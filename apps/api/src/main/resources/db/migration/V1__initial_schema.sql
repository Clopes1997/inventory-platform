-- Initial schema for inventory management (MySQL).
-- Tables: product, raw_material, product_raw_material, app_user.

CREATE TABLE product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(19, 2) NOT NULL,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE raw_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    stock_quantity DECIMAL(19, 4) NOT NULL,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE product_raw_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    required_quantity DECIMAL(19, 4) NOT NULL,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_prm_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_prm_raw_material FOREIGN KEY (raw_material_id) REFERENCES raw_material (id)
);

CREATE TABLE app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_app_user_username UNIQUE (username)
);
