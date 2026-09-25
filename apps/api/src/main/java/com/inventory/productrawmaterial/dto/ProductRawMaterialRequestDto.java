package com.inventory.productrawmaterial.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProductRawMaterialRequestDto {

    @NotNull(message = "rawMaterialId must not be null")
    private Long rawMaterialId;

    @NotNull(message = "requiredQuantity must not be null")
    @jakarta.validation.constraints.Digits(integer = 15, fraction = 4)
    @DecimalMin(value = "0.0001", message = "requiredQuantity must be > 0")
    private BigDecimal requiredQuantity;

    public Long getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(Long rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public BigDecimal getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(BigDecimal requiredQuantity) { this.requiredQuantity = requiredQuantity; }
}
