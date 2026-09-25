-- Enforce unique product and raw_material codes at DB level (in addition to application-level ConflictException).
ALTER TABLE product
    ADD CONSTRAINT uk_product_code UNIQUE (code);

ALTER TABLE raw_material
    ADD CONSTRAINT uk_raw_material_code UNIQUE (code);
