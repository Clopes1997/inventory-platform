package com.inventory.product;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "product",
    uniqueConstraints = @UniqueConstraint(name = "uk_product_code", columnNames = "code")
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(length = 4000)
    private String description;
    @Column(name = "category_path", length = 1000)
    private String categoryPath;
    @Column(nullable = false)
    private boolean available = true;
    @Column(name = "finished_stock", nullable = false)
    private long finishedStock;
    @Column(name = "brand_id")
    private Long brandId;
    @Column(name = "city_id")
    private Long cityId;
    @Version
    private long version;

    public String getDescription() { return description; }
    public void setDescription(String value) { description = value; }
    public String getCategoryPath() { return categoryPath; }
    public void setCategoryPath(String value) { categoryPath = value; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean value) { available = value; }
    public long getFinishedStock() { return finishedStock; }
    public void setFinishedStock(long value) { finishedStock = value; }
    public Long getBrandId() { return brandId; }
    public void setBrandId(Long value) { brandId = value; }
    public Long getCityId() { return cityId; }
    public void setCityId(Long value) { cityId = value; }
    public long getVersion() { return version; }

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
