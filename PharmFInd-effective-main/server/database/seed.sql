-- Seed data for PharmFind database
-- Run this after creating the schema to populate with sample data

-- ==================== Sample Medicines ====================
INSERT INTO medicines (name, category, base_price, description, manufacturer, requires_prescription) VALUES
('Panadol Extra', 'Pain Relief', 25.00, 'Fast relief from headaches and pain', 'GSK', FALSE),
('Augmentin 1g', 'Antibiotics', 85.00, 'Broad-spectrum antibiotic', 'GSK', TRUE),
('Vitamin C 1000mg', 'Vitamins', 45.00, 'Immune system support', 'Various', FALSE),
('Congestal', 'Cold & Flu', 30.00, 'Relief from cold and flu symptoms', 'Various', FALSE),
('Claritine', 'Allergy', 55.00, '24-hour allergy relief', 'Bayer', FALSE),
('Antinal', 'Digestive Health', 35.00, 'Treatment for diarrhea', 'Various', FALSE),
('Band-Aid Pack', 'First Aid', 20.00, 'Sterile adhesive bandages', 'Johnson & Johnson', FALSE),
('Hand Sanitizer', 'Hygiene', 15.00, '70% alcohol hand sanitizer', 'Various', FALSE)
ON CONFLICT DO NOTHING;

-- ==================== Sample Pharmacies ====================
INSERT INTO pharmacies (name, address, phone, latitude, longitude, rating, is_open, hours_open, hours_close, base_delivery_fee) VALUES
('El Ezaby Pharmacy', '123 Main St, Beirut, Lebanon', '+961 1 123 456', 33.8938, 35.5018, 4.5, TRUE, '08:00', '23:00', 15.00),
('Seif Pharmacy', '456 Downtown, Beirut, Lebanon', '+961 1 234 567', 33.8938, 35.5018, 4.3, TRUE, '09:00', '22:00', 20.00),
('19011 Pharmacy', '789 Hamra, Beirut, Lebanon', '+961 1 345 678', 33.8938, 35.5018, 4.7, TRUE, '00:00', '23:59', 25.00),
('Alfa Pharmacy', '321 Achrafieh, Beirut, Lebanon', '+961 1 456 789', 33.8938, 35.5018, 4.2, FALSE, '08:00', '20:00', 30.00)
ON CONFLICT DO NOTHING;

-- ==================== Sample Pharmacy Inventory ====================
-- El Ezaby Pharmacy (id=1)
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, stock_status, quantity) VALUES
(1, 1, 27.00, 'In Stock', 100),
(1, 2, 90.00, 'In Stock', 50),
(1, 3, 50.00, 'In Stock', 75),
(1, 4, 32.00, 'In Stock', 80),
(1, 5, 60.00, 'In Stock', 60),
(1, 6, 38.00, 'In Stock', 70)
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

-- Seif Pharmacy (id=2)
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, stock_status, quantity) VALUES
(2, 1, 26.00, 'In Stock', 90),
(2, 3, 48.00, 'In Stock', 65),
(2, 4, 31.00, 'In Stock', 70),
(2, 7, 22.00, 'In Stock', 100),
(2, 8, 17.00, 'In Stock', 150)
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

-- 19011 Pharmacy (id=3)
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, stock_status, quantity) VALUES
(3, 1, 28.00, 'In Stock', 120),
(3, 2, 88.00, 'In Stock', 55),
(3, 3, 52.00, 'In Stock', 85),
(3, 4, 33.00, 'In Stock', 90),
(3, 5, 58.00, 'In Stock', 70),
(3, 6, 36.00, 'In Stock', 80),
(3, 7, 21.00, 'In Stock', 110),
(3, 8, 16.00, 'In Stock', 160)
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

-- Alfa Pharmacy (id=4)
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, stock_status, quantity) VALUES
(4, 2, 92.00, 'In Stock', 40),
(4, 3, 47.00, 'In Stock', 60),
(4, 5, 62.00, 'In Stock', 50),
(4, 6, 37.00, 'In Stock', 65)
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

