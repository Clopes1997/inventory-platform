package com.inventory.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Explicit normalized interchange format; never guesses a live source database. */
public class ImportBundle {
    @Min(1) @Max(1) public int schemaVersion = 1;
    @NotBlank @Pattern(regexp = "arquivel|product-manager|product-list|autoflex") public String source;
    @NotBlank @Size(max = 64) public String installation;
    @NotNull @Size(min = 1, max = 2000) @Valid public List<@NotNull Entry> entries;

    public static class Entry {
        @NotBlank @Pattern(regexp = "brand|city|product|material|recipe") public String type;
        @NotBlank @Size(max = 64) public String legacyId;
        @Size(max = 255) public String name;
        @Size(max = 255) public String code;
        @Size(max = 255) public String manufacturer;
        @Size(max = 4000) public String description;
        @Size(max = 1000) public String categoryPath;
        @DecimalMin("0") @Digits(integer = 17, fraction = 2) public BigDecimal price;
        @Min(0) @Max(9007199254740991L) public Long stock;
        @DecimalMin("0") @Digits(integer = 15, fraction = 4) public BigDecimal quantity;
        public Boolean available;
        @Size(max = 64) public String brand;
        @Size(max = 64) public String city;
        @Size(max = 64) public String product;
        @Size(max = 64) public String material;
        public Instant deletedAt;
    }
}
