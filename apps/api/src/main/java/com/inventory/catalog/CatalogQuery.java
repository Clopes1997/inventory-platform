package com.inventory.catalog;

import com.inventory.common.PageDto;
import com.inventory.product.Product;
import com.inventory.product.dto.ProductResponseDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class CatalogQuery {
    @Inject EntityManager em;
    private record Filter(String clause, Map<String, Object> values) { }

    private Filter filter(ProductFilter input) {
        if (input.minPrice != null && input.maxPrice != null && input.minPrice.compareTo(input.maxPrice) > 0)
            throw new BadRequestException("Minimum price cannot exceed maximum price");
        StringBuilder clause = new StringBuilder("p.deletedAt is null");
        Map<String, Object> values = new HashMap<>();
        if (input.name != null && !input.name.isBlank()) {
            clause.append(" and locate(:name, lower(p.name)) > 0"); values.put("name", input.name.trim().toLowerCase(java.util.Locale.ROOT));
        }
        if (input.brandId != null) { clause.append(" and p.brandId = :brand"); values.put("brand", input.brandId); }
        if (input.cityId != null) { clause.append(" and p.cityId = :city"); values.put("city", input.cityId); }
        if (input.minPrice != null) { clause.append(" and p.price >= :minimum"); values.put("minimum", input.minPrice); }
        if (input.maxPrice != null) { clause.append(" and p.price <= :maximum"); values.put("maximum", input.maxPrice); }
        if (input.available != null) { clause.append(" and p.available = :available"); values.put("available", input.available); }
        return new Filter(clause.toString(), values);
    }

    public PageDto<ProductResponseDto> search(ProductFilter input, int page, int size) {
        var filter = filter(input);
        int safeSize = Math.max(1, Math.min(size, 100));
        int safePage = Math.max(0, page);
        if ((long) safePage * safeSize > Integer.MAX_VALUE) throw new BadRequestException("Page is too large");
        var rows = em.createQuery("select p from Product p where " + filter.clause + " order by p.name, p.id", Product.class);
        var count = em.createQuery("select count(p) from Product p where " + filter.clause, Long.class);
        filter.values.forEach((key, value) -> { rows.setParameter(key, value); count.setParameter(key, value); });
        var result = new PageDto<ProductResponseDto>();
        result.setContent(rows.setFirstResult(safePage * safeSize).setMaxResults(safeSize).getResultList().stream().map(CatalogQuery::toDto).toList());
        long total = count.getSingleResult();
        result.setTotalElements(total); result.setTotalPages((int) Math.ceil((double) total / safeSize));
        result.setNumber(safePage); result.setSize(safeSize);
        return result;
    }

    public Map<String, Object> stats(ProductFilter input) {
        var filter = filter(input);
        var query = em.createQuery("select count(p), sum(p.price), avg(p.price), sum(p.finishedStock), sum(p.price * p.finishedStock) from Product p where " + filter.clause, Object[].class);
        filter.values.forEach(query::setParameter);
        Object[] values = query.getSingleResult();
        return Map.of("productCount", values[0], "sumUnitPrices", values[1] == null ? BigDecimal.ZERO : values[1],
                "averageUnitPrice", values[2] == null ? BigDecimal.ZERO : values[2], "finishedStockUnits", values[3] == null ? 0L : values[3],
                "finishedStockValue", values[4] == null ? BigDecimal.ZERO : values[4]);
    }

    private static ProductResponseDto toDto(Product product) {
        var dto = new ProductResponseDto(); dto.setId(product.getId()); dto.setCode(product.getCode());
        dto.setName(product.getName()); dto.setPrice(product.getPrice()); dto.description = product.getDescription();
        dto.categoryPath = product.getCategoryPath(); dto.available = product.isAvailable(); dto.finishedStock = product.getFinishedStock();
        dto.brandId = product.getBrandId(); dto.cityId = product.getCityId(); dto.version = product.getVersion(); return dto;
    }
}
