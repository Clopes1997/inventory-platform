-- Consolidated target schema. Run only against a NEW empty database.
-- Legacy db/migration files are retained for history, not executed here.
CREATE TABLE product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(19, 2) NOT NULL,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT uk_product_code UNIQUE (code)
);
CREATE TABLE raw_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    stock_quantity DECIMAL(19, 4) NOT NULL,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT uk_raw_material_code UNIQUE (code)
);
CREATE TABLE product_raw_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    required_quantity DECIMAL(19, 4) NOT NULL,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_prm_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_prm_raw_material FOREIGN KEY (raw_material_id) REFERENCES raw_material (id),
    CONSTRAINT uk_product_raw_material_product_material UNIQUE (product_id, raw_material_id)
);
CREATE TABLE app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_app_user_username UNIQUE (username)
);
