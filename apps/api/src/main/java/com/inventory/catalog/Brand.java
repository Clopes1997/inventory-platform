package com.inventory.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "brand")
public class Brand {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 255)
    public String name;
    @Column(length = 255)
    public String manufacturer;
}
