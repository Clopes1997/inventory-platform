package com.inventory.product;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {

    public List<Product> findAllActive() {
        return list("deletedAt is null");
    }

    /**
     * Returns a page of active products ordered by price descending.
     * Used for production suggestion to scan catalog until top-N producible are found.
     */
    public List<Product> findActiveOrderByPriceDesc(Page page) {
        return find("deletedAt is null", Sort.descending("price").and("id"))
                .page(page)
                .list();
    }

    public List<Product> findAllActive(Page page) {
        return find("deletedAt is null").page(page).list();
    }

    public long countAllActive() {
        return find("deletedAt is null").count();
    }

    public Optional<Product> findByIdActive(Long id) {
        return find("id = ?1 and deletedAt is null", id).firstResultOptional();
    }

    public boolean existsByCodeExcludingId(String code, Long excludeId) {
        if (excludeId == null) {
            return find("code = ?1", code).count() > 0;
        }
        return find("code = ?1 and id != ?2", code, excludeId).count() > 0;
    }
}
