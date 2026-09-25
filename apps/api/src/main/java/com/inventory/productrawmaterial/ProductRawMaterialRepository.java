package com.inventory.productrawmaterial;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ProductRawMaterialRepository implements PanacheRepository<ProductRawMaterial> {

    public List<ProductRawMaterial> findByProductIdActive(Long productId) {
        return list("product.id = ?1 and deletedAt is null", productId);
    }

    /**
     * Returns all active ProductRawMaterial for the given product IDs in one query,
     * with product and rawMaterial fetched to avoid N+1.
     */
    public List<ProductRawMaterial> findByProductIdsActive(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyList();
        }
        return find("SELECT DISTINCT prm FROM ProductRawMaterial prm " +
                        "LEFT JOIN FETCH prm.product LEFT JOIN FETCH prm.rawMaterial " +
                        "WHERE prm.product.id in (?1) AND prm.deletedAt is null",
                productIds)
                .list();
    }

    public Optional<ProductRawMaterial> findByIdAndProductIdActive(Long id, Long productId) {
        return find("id = ?1 and product.id = ?2 and deletedAt is null", id, productId).firstResultOptional();
    }

    public boolean existsByProductAndRawMaterialExcludingId(Long productId, Long rawMaterialId, Long excludeId) {
        if (excludeId == null) {
            return find("product.id = ?1 and rawMaterial.id = ?2 and deletedAt is null", productId, rawMaterialId).count() > 0;
        }
        return find("product.id = ?1 and rawMaterial.id = ?2 and id != ?3", productId, rawMaterialId, excludeId).count() > 0;
    }

    public Optional<ProductRawMaterial> findArchivedPair(Long productId, Long materialId) {
        return find("product.id = ?1 and rawMaterial.id = ?2 and deletedAt is not null", productId, materialId).firstResultOptional();
    }
}
