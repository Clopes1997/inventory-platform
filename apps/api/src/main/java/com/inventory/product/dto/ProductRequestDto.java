package com.inventory.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ProductRequestDto {

    @NotBlank(message = "code must not be blank")
    @Size(max = 255)
    private String code;

    @NotBlank(message = "name must not be blank")
    @Size(max = 255)
    private String name;

    @NotNull(message = "price must not be null")
    @Digits(integer = 17, fraction = 2)
    @DecimalMin(value = "0", inclusive = true, message = "price must be >= 0")
    private BigDecimal price;

    @Size(max = 4000) public String description;
    @Size(max = 1000) public String categoryPath;
    public Boolean available;
    @Min(0) @Max(9007199254740991L) public Long finishedStock;
    @Min(1) public Long brandId;
    @Min(1) public Long cityId;
    @Min(0) public Long version;
    @Size(max = 500) public String adjustmentReason;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
