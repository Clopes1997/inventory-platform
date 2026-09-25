-- Ensure at most one association per (product_id, raw_material_id) for data integrity.
-- Duplicate associations are already prevented in application code; this enforces at DB level.
ALTER TABLE product_raw_material
    ADD CONSTRAINT uk_product_raw_material_product_material UNIQUE (product_id, raw_material_id);
