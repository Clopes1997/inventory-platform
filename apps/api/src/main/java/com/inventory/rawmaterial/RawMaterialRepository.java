package com.inventory.rawmaterial;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class RawMaterialRepository implements PanacheRepository<RawMaterial> {

    public List<RawMaterial> findAllActive() {
        return list("deletedAt is null");
    }

    public List<RawMaterial> findAllActive(Page page) {
        return find("deletedAt is null").page(page).list();
    }

    public long countAllActive() {
        return find("deletedAt is null").count();
    }

    public Optional<RawMaterial> findByIdActive(Long id) {
        return find("id = ?1 and deletedAt is null", id).firstResultOptional();
    }

    public boolean existsByCodeExcludingId(String code, Long excludeId) {
        if (excludeId == null) {
            return find("code = ?1", code).count() > 0;
        }
        return find("code = ?1 and id != ?2", code, excludeId).count() > 0;
    }

    /**
     * Sum of stockQuantity for all active raw materials (for dashboard "Available Stock Units").
     */
    public BigDecimal sumStockQuantity() {
        return find("deletedAt is null").stream()
                .map(r -> r.getStockQuantity() != null ? r.getStockQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
