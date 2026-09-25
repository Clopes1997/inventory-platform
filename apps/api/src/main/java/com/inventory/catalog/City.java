package com.inventory.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "city")
public class City {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 255)
    public String name;
}
