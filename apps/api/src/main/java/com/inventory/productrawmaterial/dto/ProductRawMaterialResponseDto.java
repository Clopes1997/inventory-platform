package com.inventory.productrawmaterial.dto;

import java.math.BigDecimal;

public class ProductRawMaterialResponseDto {

    private Long id;
    private Long rawMaterialId;
    private String rawMaterialCode;
    private String rawMaterialName;
    private BigDecimal requiredQuantity;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(Long rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public String getRawMaterialCode() { return rawMaterialCode; }
    public void setRawMaterialCode(String rawMaterialCode) { this.rawMaterialCode = rawMaterialCode; }
    public String getRawMaterialName() { return rawMaterialName; }
    public void setRawMaterialName(String rawMaterialName) { this.rawMaterialName = rawMaterialName; }
    public BigDecimal getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(BigDecimal requiredQuantity) { this.requiredQuantity = requiredQuantity; }
}
