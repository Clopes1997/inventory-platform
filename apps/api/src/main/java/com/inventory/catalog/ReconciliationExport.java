package com.inventory.catalog;

import com.inventory.product.Product;
import com.inventory.rawmaterial.RawMaterial;
import com.inventory.productrawmaterial.ProductRawMaterial;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.*;

/** Administrator-only observed state; values come from target entities, never source_json. */
@ApplicationScoped
public class ReconciliationExport {
    @Inject EntityManager em;
    public record Snapshot(String source, String installation, List<Map<String,Object>> entries) {}
    @Transactional
    public Snapshot export(String source, String installation) {
        var mappings = em.createQuery("from ImportRecord where source=:s and installation=:i order by entityType, legacyId", ImportRecord.class)
            .setParameter("s", source).setParameter("i", installation).getResultList();
        Map<String,String> reverse = new HashMap<>();
        for (var m : mappings) reverse.put(m.entityType + ":" + m.targetId, m.legacyId);
        List<Map<String,Object>> entries = new ArrayList<>();
        for (var m : mappings) {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("type", m.entityType); row.put("legacyId", m.legacyId);
            row.put("targetId", m.targetId.toString()); row.put("sourceFingerprint", m.fingerprint);
            switch (m.entityType) {
                case "brand" -> { var e=em.find(Brand.class,m.targetId); if(e==null){row.put("missing",true);break;}
                    row.put("name",e.name);row.put("manufacturer",e.manufacturer); }
                case "city" -> { var e=em.find(City.class,m.targetId);if(e==null){row.put("missing",true);break;} row.put("name",e.name); }
                case "product" -> {var e=em.find(Product.class,m.targetId);if(e==null){row.put("missing",true);break;}
                    row.put("name",e.getName());row.put("code",e.getCode());row.put("description",e.getDescription());
                    row.put("categoryPath",e.getCategoryPath());row.put("price",e.getPrice().toPlainString());
                    row.put("stock",Long.toString(e.getFinishedStock()));row.put("available",e.isAvailable());
                    row.put("brand",reference(reverse,"brand",e.getBrandId()));row.put("city",reference(reverse,"city",e.getCityId()));
                    row.put("deletedAt",e.getDeletedAt());
                    row.put("adjustmentCount",em.createNativeQuery("select count(*) from stock_adjustment where product_id=?1").setParameter(1,m.targetId).getSingleResult().toString());
                }
                case "material" -> {var e=em.find(RawMaterial.class,m.targetId);if(e==null){row.put("missing",true);break;}
                    row.put("name",e.getName());row.put("code",e.getCode());row.put("quantity",e.getStockQuantity().toPlainString());row.put("deletedAt",e.getDeletedAt());}
                case "recipe" -> {var e=em.find(ProductRawMaterial.class,m.targetId);if(e==null){row.put("missing",true);break;}
                    row.put("product",reference(reverse,"product",e.getProduct().getId()));row.put("material",reference(reverse,"material",e.getRawMaterial().getId()));
                    row.put("quantity",e.getRequiredQuantity().toPlainString());row.put("deletedAt",e.getDeletedAt());}
                default -> row.put("missing",true);
            }
            entries.add(row);
        }
        return new Snapshot(source,installation,entries);
    }
    private String reference(Map<String,String> reverse,String type,Long id) {
        if(id==null)return null;
        return reverse.getOrDefault(type+":"+id,"UNMAPPED_TARGET:"+id);
    }
}
