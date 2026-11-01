-- ============================================================================
-- KHAGAN LIVE BAKERY MANAGEMENT SYSTEM
-- MIGRATION 005: RLS POLICIES FOR OPERATIONAL CRUD & RECIPES
-- ============================================================================

-- Allow both anon and authenticated users full CRUD on operational tables
-- to ensure web app operations, POS and recipes never get blocked by RLS.

-- 1. PRODUCTS
DROP POLICY IF EXISTS "Allow anon and auth read products" ON products;
CREATE POLICY "Allow anon and auth read products" ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert products" ON products;
CREATE POLICY "Allow anon and auth insert products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update products" ON products;
CREATE POLICY "Allow anon and auth update products" ON products FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth delete products" ON products;
CREATE POLICY "Allow anon and auth delete products" ON products FOR DELETE TO anon, authenticated USING (true);

-- 2. RECIPES
DROP POLICY IF EXISTS "Allow anon and auth read recipes" ON recipes;
CREATE POLICY "Allow anon and auth read recipes" ON recipes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert recipes" ON recipes;
CREATE POLICY "Allow anon and auth insert recipes" ON recipes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update recipes" ON recipes;
CREATE POLICY "Allow anon and auth update recipes" ON recipes FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth delete recipes" ON recipes;
CREATE POLICY "Allow anon and auth delete recipes" ON recipes FOR DELETE TO anon, authenticated USING (true);

-- 3. RECIPE VERSIONS & INGREDIENTS
DROP POLICY IF EXISTS "Allow anon and auth read recipe_versions" ON recipe_versions;
CREATE POLICY "Allow anon and auth read recipe_versions" ON recipe_versions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert recipe_versions" ON recipe_versions;
CREATE POLICY "Allow anon and auth insert recipe_versions" ON recipe_versions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth read recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Allow anon and auth read recipe_ingredients" ON recipe_ingredients FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Allow anon and auth insert recipe_ingredients" ON recipe_ingredients FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4. RAW MATERIALS
DROP POLICY IF EXISTS "Allow anon and auth read raw_materials" ON raw_materials;
CREATE POLICY "Allow anon and auth read raw_materials" ON raw_materials FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert raw_materials" ON raw_materials;
CREATE POLICY "Allow anon and auth insert raw_materials" ON raw_materials FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update raw_materials" ON raw_materials;
CREATE POLICY "Allow anon and auth update raw_materials" ON raw_materials FOR UPDATE TO anon, authenticated USING (true);

-- 5. PRODUCTION BATCHES
DROP POLICY IF EXISTS "Allow anon and auth read production_batches" ON production_batches;
CREATE POLICY "Allow anon and auth read production_batches" ON production_batches FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert production_batches" ON production_batches;
CREATE POLICY "Allow anon and auth insert production_batches" ON production_batches FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update production_batches" ON production_batches;
CREATE POLICY "Allow anon and auth update production_batches" ON production_batches FOR UPDATE TO anon, authenticated USING (true);

-- 6. SALES & SALE ITEMS
DROP POLICY IF EXISTS "Allow anon and auth read sales" ON sales;
CREATE POLICY "Allow anon and auth read sales" ON sales FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert sales" ON sales;
CREATE POLICY "Allow anon and auth insert sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth read sale_items" ON sale_items;
CREATE POLICY "Allow anon and auth read sale_items" ON sale_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert sale_items" ON sale_items;
CREATE POLICY "Allow anon and auth insert sale_items" ON sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 7. EXPENSES & SUPPLIERS
DROP POLICY IF EXISTS "Allow anon and auth read expenses" ON expenses;
CREATE POLICY "Allow anon and auth read expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert expenses" ON expenses;
CREATE POLICY "Allow anon and auth insert expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth read suppliers" ON suppliers;
CREATE POLICY "Allow anon and auth read suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert suppliers" ON suppliers;
CREATE POLICY "Allow anon and auth insert suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
