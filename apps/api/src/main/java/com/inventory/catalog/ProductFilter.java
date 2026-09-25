package com.inventory.catalog;

import jakarta.ws.rs.QueryParam;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ProductFilter {
    @QueryParam("name") @Size(max = 255) public String name;
    @QueryParam("brandId") @Min(1) public Long brandId;
    @QueryParam("cityId") @Min(1) public Long cityId;
    @QueryParam("minPrice") @DecimalMin("0") @Digits(integer = 17, fraction = 2) public BigDecimal minPrice;
    @QueryParam("maxPrice") @DecimalMin("0") @Digits(integer = 17, fraction = 2) public BigDecimal maxPrice;
    @QueryParam("available") public Boolean available;
}
