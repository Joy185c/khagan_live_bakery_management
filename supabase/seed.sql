-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT ERP + POS
-- Supabase PostgreSQL Seed Data: Master Data, Recipes, and Initial Inventory
-- ============================================================================

-- 1. Initial Organization & Branch
INSERT INTO organizations (id, name, trade_license, contact_phone, contact_email, currency, timezone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Khagan Live Bakery (খাগান লাইভ বেকারি)',
    'TL-DHAKA-2026-9988',
    '01712-345678',
    'info@khaganlivebakery.com',
    'BDT',
    'Asia/Dhaka'
) ON CONFLICT DO NOTHING;

INSERT INTO branches (id, organization_id, name, code, address, phone, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Khagan Bazar Main Branch (খাগান বাজার মূল শাখা)',
    'KB-01',
    'Khagan Bazar, Birulia, Savar, Dhaka-1340',
    '01712-345678',
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- 2. Locations
INSERT INTO locations (id, branch_id, name, type, is_default_pos, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Main Kitchen & Warehouse (প্রধান কারখানা ও গুদাম)', 'kitchen', FALSE, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Front Shop Counter POS (দোকান বিক্রয় কাউন্টার)', 'shop_counter', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Units
INSERT INTO units (id, code, name_en, name_bn, symbol, type)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'kg', 'Kilogram', 'কেজি', 'kg', 'weight'),
    ('d0000000-0000-0000-0000-000000000002', 'g', 'Gram', 'গ্রাম', 'g', 'weight'),
    ('d0000000-0000-0000-0000-000000000003', 'l', 'Liter', 'লিটার', 'L', 'volume'),
    ('d0000000-0000-0000-0000-000000000004', 'ml', 'Milliliter', 'মিলি', 'ml', 'volume'),
    ('d0000000-0000-0000-0000-000000000005', 'pcs', 'Piece', 'পিস', 'pcs', 'count'),
    ('d0000000-0000-0000-0000-000000000006', 'pkt', 'Packet', 'প্যাকেট', 'pkt', 'packaging')
ON CONFLICT (code) DO NOTHING;

-- Unit Conversions
INSERT INTO unit_conversions (from_unit_id, to_unit_id, multiplier)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 1000.000000),
    ('d0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 1000.000000)
ON CONFLICT DO NOTHING;

-- 4. Product Categories
INSERT INTO product_categories (id, branch_id, name_en, name_bn, slug, sort_order, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bread & Loaves', 'পাউরুটি ও বান', 'bread', 1, TRUE),
    ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Cakes & Pastries', 'কেক ও পেস্ট্রি', 'cakes', 2, TRUE),
    ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Biscuits & Cookies', 'বিস্কুট ও কুকিজ', 'biscuits', 3, TRUE),
    ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Savory & Patties', 'লবণাক্ত ও প্যাটিস', 'savory', 4, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. Raw Materials
INSERT INTO raw_materials (id, branch_id, code, name_en, name_bn, category, base_unit_id, purchase_unit_id, conversion_ratio, current_stock, avg_cost_per_unit, reorder_point, shelf_life_days, storage_location, is_active)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RM-FLOUR-01', 'Special Baker Flour (Maida)', 'স্পেশাল বেকারি ময়দা', 'Flour & Grains', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 120.0000, 60.00, 30.0000, 90, 'Rack A', TRUE),
    ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'RM-SUGAR-01', 'Refined White Sugar', 'সাদা চিনি', 'Sweeteners', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 65.0000, 130.00, 20.0000, 180, 'Rack B', TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'RM-BUTTER-01', 'Bakery Butter Fat', 'বেকারি বাটার / মাখন', 'Dairy', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 18.0000, 820.00, 6.0000, 60, 'Chiller 1', TRUE),
    ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'RM-YEAST-01', 'Instant Dry Yeast', 'ড্রাই ইস্ট', 'Leavening', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 6.5000, 480.00, 2.0000, 120, 'Rack C', TRUE),
    ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'RM-MILK-01', 'Fresh Whole Milk', 'খাটি তরল দুধ', 'Dairy', 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 1, 45.0000, 90.00, 15.0000, 3, 'Chiller 2', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 6. Finished Products
INSERT INTO products (id, branch_id, sku, barcode, name_en, name_bn, category_id, unit_id, standard_piece_weight_g, selling_price, cost_price, shelf_life_days, is_active)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BRD-MILK-400', '89411001001', 'Special Milk Bread 400g', 'স্পেশাল মিল্ক ব্রেড ৪০০ গ্রাম', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 400.00, 85.00, 48.00, 3, TRUE),
    ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'BRD-BUN-60', '89411001002', 'Sweet Butter Bun 60g', 'মিষ্টি বাটার বান ৬০ গ্রাম', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 60.00, 20.00, 11.00, 2, TRUE),
    ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'CK-VAN-1LB', '89411002001', 'Vanilla Sponge Cake 1 Pound', 'ভ্যানিলা স্পঞ্জ কেক ১ পাউন্ড', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 454.00, 450.00, 255.00, 4, TRUE),
    ('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'SAV-CHICK-PUFF', '89411004001', 'Crispy Chicken Puff Patty', 'মুচমুচে চিকেন প্যাটিস', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 85.00, 40.00, 22.00, 1, TRUE)
ON CONFLICT (sku) DO NOTHING;

-- 7. Suppliers
INSERT INTO suppliers (id, branch_id, name, contact_person, phone, email, address, opening_balance, current_balance, is_active)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'City Sugar & Flour Mills Ltd.', 'Md. Zahirul Haque', '01819-223344', 'sales@citymillsbd.com', 'Postogola, Dhaka', 0.00, 12500.00, TRUE),
    ('20000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Aarong Dairy & Agro Foods', 'Sultan Mahmud', '01912-887766', 'corporate@aarongdairy.com', 'Tejgaon, Dhaka', 0.00, 8400.00, TRUE)
ON CONFLICT DO NOTHING;
