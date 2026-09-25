package com.inventory.product.dto;

import java.math.BigDecimal;

public class ProductResponseDto {

    private Long id;
    private String code;
    private String name;
    private BigDecimal price;

    public String description;
    public String categoryPath;
    public boolean available;
    public long finishedStock;
    public Long brandId;
    public Long cityId;
    public long version;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
