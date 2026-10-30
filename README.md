# Khagan Live Bakery — ERP & POS Management System
### খাগান লাইভ বেকারি ম্যানেজমেন্ট সিস্টেম

A complete, production-grade, bilingual (Bangla + English) Bakery Enterprise Resource Planning (ERP) and Point of Sale (POS) application built according to the **Khagan Live Bakery Antigravity Master Plan (v1.0)**.

Designed for commercial bakery operations in Bangladesh (`Asia/Dhaka`, Currency: `BDT ৳`), providing accurate inventory valuation, versioned recipe batching, yield & weight variance tracking, touch-friendly POS billing, shift cash reconciliation, and full financial Profit & Loss (P&L) accounting.

---

## 🌟 Key Highlights

- **Bilingual Interface**: Seamlessly switch between **বাংলা (Default)** and **English** across all menus, forms, buttons, receipts, and reports with typography optimized for Bengali (`Noto Sans Bengali`).
- **Two Role-Protected Portals**:
  - **Admin Management Portal (`/admin`)**: Owner KPI dashboard, production batches, BOM recipes, raw material & finished goods inventory, purchases, supplier accounts, operating expenses, employee payroll, and financial reports.
  - **Shop POS Terminal (`/shop`)**: Touch-first sales register, barcode scan support, multi-tender payment (Cash, bKash, Nagad, Card), 80mm/58mm thermal receipt printing, stock availability, incoming transfers, spoilage registration, and shift cash opening/closing with blind count reconciliation.
- **Atomic Batch Approval & Double-Posting Prevention**:
  - Approving a batch atomically consumes raw materials from the kitchen/warehouse, creates finished goods inventory lots, posts immutable movement ledger records, calculates yield % and piece cost, and prevents double-posting.
- **Inter-Location Stock Conservation**:
  - Transferring finished products from the kitchen warehouse to the front shop counter strictly conserves stock with zero duplication.
- **Comprehensive P&L Accounting**:
  - `Net Sales = Gross Sales − Discounts − Returns`
  - `Gross Profit = Net Sales − COGS`
  - `Operating Profit = Gross Profit − Operating Expenses (OPEX)`
- **Full Role-Based Access Control (RBAC)**:
  - 7 predefined roles (`super_admin`, `manager`, `production_manager`, `inventory_staff`, `cashier`, `accountant`, `viewer`).
  - Cashiers are strictly restricted from accessing admin financial data, payroll, ingredient costs, and profit reports.

---

## 🏗️ Technology Architecture

- **Frontend & App Framework**: Next.js App Router (TypeScript) with Tailwind CSS and custom Forest Green palette (`#176B45`, `#104C34`, `#EAF5EE`, `#F7F9F8`).
- **State & Database Layer**:
  - Supabase PostgreSQL with complete migrations (`supabase/migrations/001_initial_schema.sql` and `002_functions_and_rls.sql`) including Row Level Security (RLS) policies and transactional stored procedures.
  - Reactive in-memory and browser-persisted database engine enabling out-of-the-box local operation, automated verification, and seamless synchronization.
- **Reporting & Exports**:
  - Automated spreadsheet export (`.xlsx`) via SheetJS / xlsx.
  - Standard 80mm thermal receipt print formatting with print media styling.
- **Automated Testing**:
  - Vitest test suite (`src/__tests__/acceptance_scenarios.test.ts`) covering all 12 mandatory acceptance criteria from the master plan.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- `pnpm` or `npm`

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Configure your Supabase URL and keys in `.env.local` (optional for local evaluation):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEFAULT_LOCALE=bn
NEXT_PUBLIC_DEFAULT_CURRENCY=BDT
NEXT_PUBLIC_APP_TIMEZONE=Asia/Dhaka
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
Execute the 12 acceptance scenario tests:
```bash
npx vitest run
```

### 6. Production Build
```bash
pnpm build
pnpm start
```

---

## 📋 Route Architecture

| Route | Purpose | Access Control |
|---|---|---|
| `/` | Landing page, Portal selector & quick role switcher | Public |
| `/admin` | Executive KPI dashboard, sales vs production | Admin, Manager, Accountant |
| `/admin/products` | Product catalog, SKU, categories, piece weight & pricing | Admin, Manager |
| `/admin/recipes` | Versioned BOM recipes, ingredient proportions & costs | Admin, Manager, Production Mgr |
| `/admin/production` | Production batch wizard, atomic approval & yield variance | Admin, Manager, Production Mgr |
| `/admin/inventory` | Raw material stock, lots, ledger & inter-location transfers | Admin, Manager, Inventory Staff |
| `/admin/purchases` | Supplier directory, purchase orders & goods receipt | Admin, Manager, Inventory Staff |
| `/admin/sales` | Master sales monitor, audit trail & refunds | Admin, Manager, Accountant |
| `/admin/expenses` | Utility vouchers, rent, gas, electricity & allocation | Admin, Manager, Accountant |
| `/admin/workforce` | Employee registry, daily attendance & payroll calculation | Admin, Manager, Accountant |
| `/admin/reports` | Financial P&L statements, yield reports & Excel export | Admin, Manager, Accountant, Viewer |
| `/admin/settings` | Units & conversions, RBAC permission matrix & audit logs | Super Admin Only |
| `/shop` | Touch-first POS checkout counter with cart & payments | Cashier, Manager, Admin |
| `/shop/sales` | Shift sales history & receipt reprinting | Cashier, Manager, Admin |
| `/shop/stock` | Live counter stock & incoming transfer acknowledge | Cashier, Manager, Admin |
| `/shop/waste` | Spoilage & damaged goods registration | Cashier, Manager, Admin |
| `/shop/cash` | Shift opening float, payouts, closing blind count & variance | Cashier, Manager, Admin |
| `/shop/settings` | 80mm/58mm thermal printer & language configuration | Cashier, Manager, Admin |

---

## 🗄️ Database Migrations

Complete SQL migrations are provided in the repository:
1. `supabase/migrations/001_initial_schema.sql`:
   - 40+ relational tables with UUID keys, foreign key cascades, check constraints, branch scoping, and performance indexes.
2. `supabase/migrations/002_functions_and_rls.sql`:
   - Transactional RPC stored procedures: `fn_approve_production_batch`, `fn_process_stock_transfer_dispatch`, `fn_process_stock_transfer_receive`.
   - Row Level Security (RLS) policies protecting sensitive employee salaries, financial expenses, and cost prices from unauthorized cashier access.

---

## ✅ Acceptance Scenarios Verification

All 12 mandatory criteria defined in Section 16 of the Master Plan are verified by automated tests in `src/__tests__/acceptance_scenarios.test.ts`:

1. **Purchase 50 kg flour** -> Raw material stock rises by exactly 50 kg.
2. **Approve batch consuming 10 kg flour** -> Raw stock falls by exactly 10 kg, once only.
3. **Produce 100 saleable units** -> Finished stock rises by exactly 100.
4. **Transfer 40 units to shop** -> Warehouse −40, shop +40, total inventory strictly unchanged.
5. **Sell 5 units** -> Shop stock −5; payment, receipt, and COGS posted once.
6. **Record 2 damaged units** -> Stock and waste ledger reconcile.
7. **Edit recipe** -> Historical production cost snapshots remain unchanged.
8. **Cashier attempts admin financial API** -> Denied by server & RLS.
9. **Switch Bangla/English** -> Navigation, forms, errors, receipts, and reports translated.
10. **Retry same checkout request** -> One sale only (idempotency key protection).
11. **Close cash shift** -> Expected vs counted cash and variance calculated accurately.
12. **Reconcile inventory, sales, COGS, and operating profit** -> Verified against source ledgers without double counting.
