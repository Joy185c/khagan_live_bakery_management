# Khagan Live Bakery — Production Deployment & Handover Guide
### প্রোডাকশন ডিপ্লয়মেন্ট ও হ্যান্ডওভার নির্দেশিকা

This guide provides step-by-step instructions for deploying the **Khagan Live Bakery Management ERP + POS System** to Vercel and connecting it to Supabase PostgreSQL.

---

## 1. Supabase Cloud Database Provisioning

1. Sign in to [Supabase](https://supabase.com) and click **New Project**.
2. **Project Name**: `khagan-live-bakery`
3. **Database Password**: Generate and securely store a strong password.
4. **Region**: Choose `Southeast Asia (Singapore)` for minimum latency to Bangladesh.
5. In the Supabase Dashboard, open **SQL Editor** and run the migration scripts in order:
   - Run `supabase/migrations/001_initial_schema.sql` (Creates 40+ tables, indexes, constraints).
   - Run `supabase/migrations/002_functions_and_rls.sql` (Stored procedures & RLS policies).
   - Run `supabase/seed.sql` (Seeds initial products, raw materials, units, and branch locations).

---

## 2. Vercel Production Deployment

### Option A: Deploy via GitHub / GitLab
1. Push the code to a private GitHub repository:
   ```bash
   git remote add origin https://github.com/your-username/khagan-live-bakery.git
   git branch -M main
   git push -u origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com), click **Add New $\rightarrow$ Project**.
3. Import the `khagan-live-bakery` repository.
4. Set Framework Preset to **Next.js**.
5. Configure Environment Variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Secret Key (Server-only)
   - `NEXT_PUBLIC_DEFAULT_LOCALE`: `bn`
   - `NEXT_PUBLIC_DEFAULT_CURRENCY`: `BDT`
   - `NEXT_PUBLIC_APP_TIMEZONE`: `Asia/Dhaka`
6. Click **Deploy**.

---

## 3. Hardware Counter Setup (POS Terminal)

- **Counter Tablet / Touchscreen**: Open Chrome or Safari and navigate to `https://your-domain.vercel.app/shop`.
- **Install PWA**: Click the browser menu $\rightarrow$ **Install App / Add to Home Screen** to run in fullscreen kiosk mode.
- **USB / Bluetooth Barcode Scanner**: Connect the scanner to the terminal in USB HID keyboard emulation mode. Scanning any product instantly adds it to the cart.
- **80mm Thermal Receipt Printer**: Pair via USB or Bluetooth; set paper size to 80mm in `/shop/settings`.

