package com.inventory.rawmaterial.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class RawMaterialRequestDto {

    @NotBlank(message = "code must not be blank")
    @jakarta.validation.constraints.Size(max = 255)
    private String code;

    @NotBlank(message = "name must not be blank")
    @jakarta.validation.constraints.Size(max = 255)
    private String name;

    @NotNull(message = "stockQuantity must not be null")
    @jakarta.validation.constraints.Digits(integer = 15, fraction = 4)
    @DecimalMin(value = "0", inclusive = true, message = "stockQuantity must be >= 0")
    private BigDecimal stockQuantity;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(BigDecimal stockQuantity) { this.stockQuantity = stockQuantity; }
}
