package com.inventory.catalog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.common.ConflictException;
import com.inventory.product.Product;
import com.inventory.rawmaterial.RawMaterial;
import com.inventory.productrawmaterial.ProductRawMaterial;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class InventoryImporter {
    @Inject EntityManager em;
    @Inject ObjectMapper json;
    private static final List<String> ORDER = List.of("brand", "city", "product", "material", "recipe");

    public record Preview(int total, int newRecords, int alreadyImported, List<String> errors) { }

    public Preview preview(ImportBundle bundle) {
        List<String> errors = new ArrayList<>();
        Set<String> identities = new HashSet<>();
        Set<String> codes = new HashSet<>();
        Set<String> recipePairs = new HashSet<>();
        int existing = 0;
        for (var entry : bundle.entries) {
            String key = entry.type + ":" + entry.legacyId;
            if (!identities.add(key)) errors.add("Duplicate source identity: " + key);
            ImportRecord record = mapping(bundle, entry.type, entry.legacyId);
            if (record != null) {
                existing++;
                if (!record.fingerprint.equals(fingerprint(entry))) errors.add("Previously imported record changed: " + key);
            }
            if (!"recipe".equals(entry.type) && (entry.name == null || entry.name.isBlank())) errors.add("Name is required: " + key);
            if ("product".equals(entry.type) && (entry.price == null || entry.stock == null || entry.available == null))
                errors.add("Product requires explicit price, whole stock and availability: " + key);
            if (("material".equals(entry.type) || "recipe".equals(entry.type)) && entry.quantity == null)
                errors.add("Quantity is required: " + key);
            if ("recipe".equals(entry.type) && entry.quantity != null && entry.quantity.signum() <= 0)
                errors.add("Recipe quantity must be positive: " + key);
            if ("recipe".equals(entry.type) && !recipePairs.add(entry.product + ":" + entry.material))
                errors.add("Duplicate recipe material pair: " + key);
            if ("product".equals(entry.type) || "material".equals(entry.type)) {
                String code = code(bundle, entry);
                if (!codes.add(entry.type + ":" + code)) errors.add("Duplicate code in bundle: " + code);
                String entity = "product".equals(entry.type) ? "Product" : "RawMaterial";
                if (record == null && em.createQuery("select count(e) from " + entity + " e where e.code = :code", Long.class).setParameter("code", code).getSingleResult() > 0)
                    errors.add("Code already exists; choose an explicit code mapping: " + code);
            }
        }
        for (var entry : bundle.entries) {
            if ("product".equals(entry.type)) {
                checkReference(bundle, identities, errors, entry, "brand", entry.brand, false);
                checkReference(bundle, identities, errors, entry, "city", entry.city, false);
            }
            if ("recipe".equals(entry.type)) {
                checkReference(bundle, identities, errors, entry, "product", entry.product, true);
                checkReference(bundle, identities, errors, entry, "material", entry.material, true);
            }
        }
        return new Preview(bundle.entries.size(), bundle.entries.size() - existing, existing, errors);
    }

    private void checkReference(ImportBundle bundle, Set<String> identities, List<String> errors, ImportBundle.Entry entry, String type, String id, boolean required) {
        if (id == null && !required) return;
        if (id == null || (!identities.contains(type + ":" + id) && mapping(bundle, type, id) == null))
            errors.add("Missing " + type + " reference for " + entry.type + ":" + entry.legacyId);
    }

    @Transactional
    public Preview apply(ImportBundle bundle, String actor) {
        Preview preview = preview(bundle);
        if (!preview.errors.isEmpty()) throw new ConflictException(String.join("; ", preview.errors));
        var entries = bundle.entries.stream().sorted(Comparator.comparingInt(entry -> ORDER.indexOf(entry.type))).toList();
        for (var entry : entries) {
            if (mapping(bundle, entry.type, entry.legacyId) != null) continue;
            Long target = insert(bundle, entry, actor);
            ImportRecord record = new ImportRecord(); record.source = bundle.source; record.installation = bundle.installation;
            record.entityType = entry.type; record.legacyId = entry.legacyId; record.targetId = target;
            record.sourceJson = serialize(entry); record.fingerprint = fingerprint(entry); record.importedAt = Instant.now();
            em.persist(record); em.flush();
        }
        return preview;
    }

    private Long insert(ImportBundle bundle, ImportBundle.Entry entry, String actor) {
        return switch (entry.type) {
            case "brand" -> { Brand value = new Brand(); value.name = entry.name; value.manufacturer = entry.manufacturer; em.persist(value); yield value.id; }
            case "city" -> { City value = new City(); value.name = entry.name; em.persist(value); yield value.id; }
            case "product" -> {
                Product value = new Product(); value.setCode(code(bundle, entry)); value.setName(entry.name); value.setPrice(entry.price);
                value.setDescription(entry.description); value.setCategoryPath(entry.categoryPath); value.setAvailable(entry.available);
                value.setFinishedStock(entry.stock); value.setBrandId(target(bundle, "brand", entry.brand)); value.setCityId(target(bundle, "city", entry.city));
                value.setDeletedAt(entry.deletedAt); em.persist(value); em.flush();
                em.createNativeQuery("INSERT INTO stock_adjustment(product_id,quantity_before,quantity_after,reason,actor,created_at) VALUES (?1,0,?2,?3,?4,?5)")
                    .setParameter(1, value.getId()).setParameter(2, entry.stock).setParameter(3, "Imported opening balance; prior movements unknown")
                    .setParameter(4, actor).setParameter(5, java.sql.Timestamp.from(Instant.now())).executeUpdate();
                yield value.getId();
            }
            case "material" -> {
                RawMaterial value = new RawMaterial(); value.setCode(code(bundle, entry)); value.setName(entry.name);
                value.setStockQuantity(entry.quantity); value.setDeletedAt(entry.deletedAt); em.persist(value); yield value.getId();
            }
            case "recipe" -> {
                ProductRawMaterial value = new ProductRawMaterial(); value.setProduct(em.find(Product.class, target(bundle, "product", entry.product)));
                value.setRawMaterial(em.find(RawMaterial.class, target(bundle, "material", entry.material)));
                value.setRequiredQuantity(entry.quantity); value.setDeletedAt(entry.deletedAt); em.persist(value); yield value.getId();
            }
            default -> throw new IllegalArgumentException("Unsupported entity type");
        };
    }

    private String code(ImportBundle bundle, ImportBundle.Entry entry) {
        return entry.code == null || entry.code.isBlank() ? bundle.source + ":" + bundle.installation + ":" + entry.legacyId : entry.code;
    }
    private ImportRecord mapping(ImportBundle bundle, String type, String id) {
        if (id == null) return null;
        return em.createQuery("from ImportRecord where source=:source and installation=:installation and entityType=:type and legacyId=:id", ImportRecord.class)
                .setParameter("source", bundle.source).setParameter("installation", bundle.installation).setParameter("type", type).setParameter("id", id)
                .getResultStream().findFirst().orElse(null);
    }
    private Long target(ImportBundle bundle, String type, String id) {
        if (id == null) return null;
        var record = mapping(bundle, type, id);
        if (record == null) throw new ConflictException("Unresolved import reference: " + type + ":" + id);
        return record.targetId;
    }
    private String serialize(ImportBundle.Entry entry) {
        try { return json.writeValueAsString(entry); } catch (Exception exception) { throw new IllegalArgumentException("Cannot encode source record", exception); }
    }
    private String fingerprint(ImportBundle.Entry entry) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(serialize(entry).getBytes(StandardCharsets.UTF_8))); }
        catch (Exception exception) { throw new IllegalStateException("Cannot fingerprint source record", exception); }
    }
}
