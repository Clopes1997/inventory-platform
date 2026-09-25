-- Seed placeholder products and raw materials from reference (Autoflex).
-- Overwrites existing data in product, raw_material, product_raw_material.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE product_raw_material;
TRUNCATE TABLE product;
TRUNCATE TABLE raw_material;

SET FOREIGN_KEY_CHECKS = 1;

-- Raw materials (rm1..rm8)
INSERT INTO raw_material (code, name, stock_quantity) VALUES
('RM-001', 'Steel Sheet 2mm', 500),
('RM-002', 'Aluminum Bar 10mm', 320),
('RM-003', 'Rubber Seal', 1200),
('RM-004', 'Stainless Bolt M8', 5000),
('RM-005', 'Copper Wire 1.5mm', 800),
('RM-006', 'Plastic Housing ABS', 150),
('RM-007', 'Spring Tension 40N', 900),
('RM-008', 'Bearing 6205', 420);

-- Products (p1..p6) - ids 1..6 after truncate
INSERT INTO product (code, name, price) VALUES
('PRD-001', 'Hydraulic Cylinder A', 450),
('PRD-002', 'Pneumatic Valve B', 320),
('PRD-003', 'Control Module X', 780),
('PRD-004', 'Flex Coupling C', 190),
('PRD-005', 'Drive Assembly D', 1250),
('PRD-006', 'Sensor Bracket E', 95);

-- Product-RawMaterial associations (product_id, raw_material_id, required_quantity)
-- p1: rm1 x3, rm3 x2
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(1, 1, 3), (1, 3, 2);
-- p2: rm2 x1, rm4 x8
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(2, 2, 1), (2, 4, 8);
-- p3: rm5 x5, rm6 x1
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(3, 5, 5), (3, 6, 1);
-- p4: rm3 x4, rm7 x2
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(4, 3, 4), (4, 7, 2);
-- p5: rm1 x2, rm8 x4
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(5, 1, 2), (5, 8, 4);
-- p6: rm2 x1, rm4 x4
INSERT INTO product_raw_material (product_id, raw_material_id, required_quantity) VALUES
(6, 2, 1), (6, 4, 4);
