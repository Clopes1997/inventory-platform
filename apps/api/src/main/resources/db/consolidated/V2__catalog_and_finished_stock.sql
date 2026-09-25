CREATE TABLE brand (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255)
);
CREATE TABLE city (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
ALTER TABLE product ADD COLUMN description VARCHAR(4000);
ALTER TABLE product ADD COLUMN category_path VARCHAR(1000);
ALTER TABLE product ADD COLUMN available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE product ADD COLUMN finished_stock BIGINT NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN brand_id BIGINT;
ALTER TABLE product ADD COLUMN city_id BIGINT;
ALTER TABLE product ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE product ADD CONSTRAINT fk_product_brand FOREIGN KEY (brand_id) REFERENCES brand(id);
ALTER TABLE product ADD CONSTRAINT fk_product_city FOREIGN KEY (city_id) REFERENCES city(id);
ALTER TABLE product ADD CONSTRAINT ck_finished_stock CHECK (finished_stock >= 0);
CREATE TABLE stock_adjustment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    quantity_before BIGINT NOT NULL,
    quantity_after BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    actor VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_adjustment_product FOREIGN KEY (product_id) REFERENCES product(id)
);
