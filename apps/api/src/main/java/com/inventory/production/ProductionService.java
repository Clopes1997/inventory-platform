package com.inventory.production;

import com.inventory.production.dto.ProductionSuggestionItemDto;
import com.inventory.production.dto.ProductionSuggestionResponseDto;
import com.inventory.product.Product;
import com.inventory.product.ProductRepository;
import com.inventory.productrawmaterial.ProductRawMaterial;
import com.inventory.productrawmaterial.ProductRawMaterialRepository;
import com.inventory.rawmaterial.RawMaterial;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ProductionService {

    private final ProductRepository productRepository;
    private final ProductRawMaterialRepository productRawMaterialRepository;

    public ProductionService(ProductRepository productRepository,
                             ProductRawMaterialRepository productRawMaterialRepository) {
        this.productRepository = productRepository;
        this.productRawMaterialRepository = productRawMaterialRepository;
    }

    private static final int MAX_LIMIT = 1000;
    private static final int PAGE_SIZE = 200;

    /**
     * Returns producible products sorted by highest price first, up to limit.
     * Pages through the full catalog (by price desc) so the result is the true top-N
     * producible by value, not a subset of an arbitrary candidate window.
     * <p>
     * <strong>Semantics:</strong> Max quantity is computed per product assuming all current
     * stock is available for that product. Shared raw materials are not allocated across
     * products — this is a per-product feasibility check, not a global optimal allocation.
     * Acceptable simplification for this system; see README for details.
     */
    @Transactional
    public ProductionSuggestionResponseDto getSuggestion(int limit) {
        int cappedLimit = limit <= 0 ? MAX_LIMIT : Math.min(limit, MAX_LIMIT);
        List<ProductionSuggestionItemDto> items = new ArrayList<>();

        // Page through products by price desc; accumulate producible items until we have enough or exhaust the catalog.
        int pageIndex = 0;
        boolean catalogExhausted = false;
        while (true) {
            Page page = Page.of(pageIndex, PAGE_SIZE);
            List<Product> products = productRepository.findActiveOrderByPriceDesc(page);
            if (products.isEmpty()) {
                catalogExhausted = true;
                break;
            }

            List<Long> productIds = products.stream().map(Product::getId).toList();
            Map<Long, List<ProductRawMaterial>> materialsByProductId = productRawMaterialRepository
                    .findByProductIdsActive(productIds)
                    .stream()
                    .collect(Collectors.groupingBy(prm -> prm.getProduct().getId()));

            for (Product product : products) {
                List<ProductRawMaterial> prmList = materialsByProductId.getOrDefault(product.getId(), List.of());
                if (prmList.isEmpty()) continue;

                BigDecimal maxProducible = null;
                boolean skip = false;
                for (ProductRawMaterial prm : prmList) {
                    RawMaterial rm = prm.getRawMaterial();
                    if (rm.getDeletedAt() != null) {
                        skip = true;
                        break;
                    }
                    if (prm.getRequiredQuantity() == null || prm.getRequiredQuantity().signum() <= 0) {
                        skip = true;
                        break;
                    }
                    BigDecimal stock = rm.getStockQuantity() != null ? rm.getStockQuantity() : BigDecimal.ZERO;
                    BigDecimal batches = stock.divide(prm.getRequiredQuantity(), 0, RoundingMode.DOWN);
                    if (maxProducible == null || batches.compareTo(maxProducible) < 0) {
                        maxProducible = batches;
                    }
                }
                if (skip || maxProducible == null || maxProducible.signum() < 1) continue;

                ProductionSuggestionItemDto dto = new ProductionSuggestionItemDto();
                dto.setProductId(product.getId());
                dto.setProductCode(product.getCode());
                dto.setProductName(product.getName());
                dto.setUnitPrice(product.getPrice());
                dto.setMaxProducibleQuantity(maxProducible);
                dto.setLineValue(product.getPrice().multiply(maxProducible));
                items.add(dto);
            }

            if (products.size() < PAGE_SIZE) {
                catalogExhausted = true;
                break;
            }
            if (items.size() >= cappedLimit) {
                break;
            }
            pageIndex++;
        }

        items.sort(Comparator
                .comparing(ProductionSuggestionItemDto::getUnitPrice, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ProductionSuggestionItemDto::getProductId, Comparator.nullsLast(Comparator.naturalOrder())));

        // Cap the returned list to the requested limit; items may hold more from the last page.
        List<ProductionSuggestionItemDto> limited = items.size() <= cappedLimit
                ? items
                : items.subList(0, cappedLimit);

        BigDecimal total = limited.stream()
                .map(ProductionSuggestionItemDto::getLineValue)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // totalCount = full number of producible items we found (before capping). Enables "Showing top X of Y" in the UI.
        long totalProducibleFound = items.size();

        ProductionSuggestionResponseDto response = new ProductionSuggestionResponseDto();
        response.setCalculationMode(ProductionSuggestionResponseDto.CALCULATION_MODE_PER_PRODUCT);
        response.setItems(limited);
        response.setTotalProductionValue(total);
        response.setTotalCount(catalogExhausted ? totalProducibleFound : null);
        return response;
    }
}
