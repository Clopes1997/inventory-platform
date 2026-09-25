package com.inventory.production.dto;

import java.math.BigDecimal;

public class ProductionSuggestionItemDto {

    private Long productId;
    private String productCode;
    private String productName;
    private BigDecimal unitPrice;
    private BigDecimal maxProducibleQuantity;
    private BigDecimal lineValue;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getMaxProducibleQuantity() { return maxProducibleQuantity; }
    public void setMaxProducibleQuantity(BigDecimal maxProducibleQuantity) { this.maxProducibleQuantity = maxProducibleQuantity; }
    public BigDecimal getLineValue() { return lineValue; }
    public void setLineValue(BigDecimal lineValue) { this.lineValue = lineValue; }
}
