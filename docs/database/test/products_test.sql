-- PharmaQuick - Insert Masivo de Productos y Lotes
-- Generado siguiendo el estándar de la Fase 2

USE db_cluster_1;

-- 1. INSERT DE PRODUCTOS (IDs 7 al 26)
INSERT INTO productos (id, nombre, codigo_barras, descripcion, categoria, presentacion, activo, creado_en, actualizado_en, imagen) VALUES
(7, 'Acetaminofén 500mg', '7701234567071', 'Analgésico y antipirético eficaz.', 'Analgésicos', 'Caja x 100 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/7_1777000001.jpg'),
(8, 'Ibuprofeno 400mg', '7701234567082', 'Antiinflamatorio no esteroideo.', 'Analgésicos', 'Caja x 20 cápsulas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/8_1777000002.jpg'),
(9, 'Loratadina 10mg', '7701234567093', 'Antihistamínico de segunda generación.', 'Antihistamínicos', 'Caja x 10 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/9_1777000003.jpg'),
(10, 'Omeprazol 20mg', '7701234567104', 'Protector gástrico, inhibidor de bomba.', 'Gastrointestinales', 'Caja x 30 cápsulas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/10_1777000004.jpg'),
(11, 'Losartán 50mg', '7701234567115', 'Antihipertensivo (ARA II).', 'Cardiovasculares', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/11_1777000005.jpg'),
(12, 'Metformina 850mg', '7701234567126', 'Tratamiento para diabetes tipo 2.', 'Antidiabéticos', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/12_1777000006.jpg'),
(13, 'Atorvastatina 20mg', '7701234567137', 'Reductor de colesterol y triglicéridos.', 'Cardiovasculares', 'Caja x 10 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/13_1777000007.jpg'),
(14, 'Salbutamol Inhalador', '7701234567148', 'Broncodilatador de acción rápida.', 'Respiratorios', 'Frasco x 200 dosis', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/14_1777000008.jpg'),
(15, 'Amoxicilina + Clavulánico', '7701234567159', 'Antibiótico de amplio espectro.', 'Antibióticos', 'Caja x 14 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/15_1777000009.jpg'),
(16, 'Azitromicina 500mg', '7701234567160', 'Antibiótico macrólido.', 'Antibióticos', 'Caja x 3 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/16_1777000010.jpg'),
(17, 'Diclofenaco 75mg', '7701234567171', 'Analgésico inyectable o tabletas.', 'Analgésicos', 'Caja x 10 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/17_1777000011.jpg'),
(18, 'Naproxeno 500mg', '7701234567182', 'Analgésico potente y duradero.', 'Analgésicos', 'Caja x 20 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/18_1777000012.jpg'),
(19, 'Enalapril 20mg', '7701234567193', 'Inhibidor de la ECA para hipertensión.', 'Cardiovasculares', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/19_1777000013.jpg'),
(20, 'Glibenclamida 5mg', '7701234567204', 'Hipoglucemiante oral.', 'Antidiabéticos', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/20_1777000014.jpg'),
(21, 'Cetirizina 10mg', '7701234567215', 'Control de alergias y rinitis.', 'Antihistamínicos', 'Caja x 10 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/21_1777000015.jpg'),
(22, 'Esomeprazol 40mg', '7701234567226', 'Tratamiento de reflujo severo.', 'Gastrointestinales', 'Caja x 14 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/22_1777000016.jpg'),
(23, 'Prednisolona 5mg', '7701234567237', 'Corticoide antiinflamatorio.', 'Corticosteroides', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/23_1777000017.jpg'),
(24, 'Fluconazol 150mg', '7701234567248', 'Tratamiento antimicótico.', 'Antifúngicos', 'Caja x 1 cápsula', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/24_1777000018.jpg'),
(25, 'Ciprofloxacino 500mg', '7701234567259', 'Antibiótico para infecciones urinarias.', 'Antibióticos', 'Caja x 10 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/25_1777000019.jpg'),
(26, 'Hidroclorotiazida 25mg', '7701234567260', 'Diurético para la presión arterial.', 'Cardiovasculares', 'Caja x 30 tabletas', 1, NOW(), NOW(), '/uploads/productos/1/imagenes/26_1777000020.jpg');

-- 2. INSERT DE LOTES (Relacionados a los productos anteriores para Farmacia ID 1)
INSERT INTO lotes (producto_id, farmacia_id, codigo_lote, fecha_vencimiento, costo_unitario, stock_actual, stock_reservado) VALUES
(7, 1, 'LT-AC-001', '2027-05-10', 50.00, 500, 0),
(8, 1, 'LT-IB-002', '2026-12-15', 120.00, 300, 0),
(9, 1, 'LT-LO-003', '2026-11-20', 80.00, 200, 0),
(10, 1, 'LT-OM-004', '2027-01-10', 150.00, 450, 0),
(11, 1, 'LT-LS-005', '2026-08-30', 200.00, 150, 0),
(12, 1, 'LT-MT-006', '2027-03-22', 95.00, 280, 0),
(13, 1, 'LT-AT-007', '2026-06-18', 350.00, 120, 0),
(14, 1, 'LT-SL-008', '2027-09-05', 850.00, 80, 0),
(15, 1, 'LT-AM-009', '2026-04-12', 450.00, 100, 0),
(16, 1, 'LT-AZ-010', '2026-05-30', 600.00, 90, 0),
(17, 1, 'LT-DI-011', '2027-02-14', 110.00, 250, 0),
(18, 1, 'LT-NP-012', '2027-07-25', 130.00, 200, 0),
(19, 1, 'LT-EN-013', '2026-10-10', 90.00, 320, 0),
(20, 1, 'LT-GL-014', '2027-04-01', 75.00, 400, 0),
(21, 1, 'LT-CT-015', '2026-12-31', 85.00, 180, 0),
(22, 1, 'LT-ES-016', '2027-08-20', 420.00, 110, 0),
(23, 1, 'LT-PR-017', '2026-09-15', 60.00, 230, 0),
(24, 1, 'LT-FC-018', '2027-06-10', 550.00, 60, 0),
(25, 1, 'LT-CP-019', '2026-11-05', 380.00, 140, 0),
(26, 1, 'LT-HD-020', '2027-02-28', 105.00, 210, 0);

-- 3. INSERT DE PRECIOS (Recomendado para que sean visibles en la tienda)
INSERT INTO precios (producto_id, farmacia_id, precio, activo) VALUES
(7, 1, 150.00, 1), (8, 1, 350.00, 1), (9, 1, 250.00, 1), (10, 1, 450.00, 1), (11, 1, 600.00, 1),
(12, 1, 280.00, 1), (13, 1, 850.00, 1), (14, 1, 2500.00, 1), (15, 1, 1200.00, 1), (16, 1, 1800.00, 1),
(17, 1, 300.00, 1), (18, 1, 380.00, 1), (19, 1, 270.00, 1), (20, 1, 220.00, 1), (21, 1, 260.00, 1),
(22, 1, 1150.00, 1), (23, 1, 180.00, 1), (24, 1, 1500.00, 1), (25, 1, 950.00, 1), (26, 1, 320.00, 1);
