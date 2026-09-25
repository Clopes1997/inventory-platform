package com.inventory.production.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response for GET /api/production/suggestion.
 * <ul>
 *   <li><b>calculationMode</b> — Constant describing how the suggestion is computed: {@value #CALCULATION_MODE_PER_PRODUCT} (per-product feasibility; raw materials are not globally allocated across products).</li>
 *   <li><b>items</b> — Producible products returned (capped by the request limit). Sorted by unit price descending.</li>
 *   <li><b>totalCount</b> — Total number of producible products found before applying the limit. When totalCount &gt; items.size(), the client can show "Showing top X of Y".</li>
 *   <li><b>totalProductionValue</b> — Sum of (unitPrice × maxProducibleQuantity) for the returned items only.</li>
 * </ul>
 */
public class ProductionSuggestionResponseDto {

    /** Constant value indicating calculation is done per product independently; no global allocation of raw materials. */
    public static final String CALCULATION_MODE_PER_PRODUCT = "PER_PRODUCT_FEASIBILITY";

    private String calculationMode;
    private List<ProductionSuggestionItemDto> items;
    private BigDecimal totalProductionValue;
    private Long totalCount;

    public String getCalculationMode() { return calculationMode; }
    public void setCalculationMode(String calculationMode) { this.calculationMode = calculationMode; }

    public List<ProductionSuggestionItemDto> getItems() { return items; }
    public void setItems(List<ProductionSuggestionItemDto> items) { this.items = items; }
    public BigDecimal getTotalProductionValue() { return totalProductionValue; }
    public void setTotalProductionValue(BigDecimal totalProductionValue) { this.totalProductionValue = totalProductionValue; }
    public Long getTotalCount() { return totalCount; }
    public void setTotalCount(Long totalCount) { this.totalCount = totalCount; }
}
