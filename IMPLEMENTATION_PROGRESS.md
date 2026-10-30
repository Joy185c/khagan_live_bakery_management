# KHAGAN LIVE BAKERY — ERP + POS
## Master Implementation Progress & Verification Log

**Specification Reference**: *Khagan Live Bakery Master Plan v1.0 (October 2026)*  
**Locale**: Bangladesh (`Asia/Dhaka`, Currency: `BDT ৳`, Default UI: `বাংলা (Bangla)`)  
**Design Palette**:
- Forest Green Primary: `#176B45`
- Dark Forest: `#104C34`
- Soft Sage / Light: `#EAF5EE`
- Background: `#F7F9F8`
- Dark Charcoal Text: `#172B22`
- Danger / Warning: `#D94B4B`

---

## 1. System Architecture & Route Map

### 1.1 Portals & Routes
- **Public & Authentication**:
  - `/` -> Landing / Portal Selector / Shift Login
- **Admin Management Portal (`/admin`)**:
  - `/admin` -> Executive KPI Dashboard (Sales, Production, Low Stock, Wastage, Cash Flow, Pending Approvals)
  - `/admin/products` -> Product Master, Categories, SKU, Price History, Barcodes, Archiving
  - `/admin/recipes` -> Versioned Bill of Materials (BOM), Standard Batch Size, Yield %, Ingredient Specs
  - `/admin/production` -> Production Planning, Batches (Draft -> Planned -> In Progress -> Completed -> Approved), Yield & Weight Variance Tracking
  - `/admin/inventory` -> Raw Materials, Finished Goods, Lots, Expiries, Locations (Warehouse vs Shop), Reorder Points, Stock Adjustments
  - `/admin/purchases` -> Supplier Management, Purchase Orders, Goods Receipt, Supplier Invoices & Payments
  - `/admin/sales` -> Master Sales Monitor, Audit Trail, Transactions, Refunds, Filter by Register/Cashier
  - `/admin/expenses` -> Operating & Utility Costing (Rent, Gas, Electricity, Water, Maintenance), Expense Categories, Approvals
  - `/admin/workforce` -> Employee Registry, Shifts, Attendance, Payroll Processing (Salary, Overtime, Advances, Deductions)
  - `/admin/reports` -> Comprehensive Financial & Operational Analytics (Sales, Production, Yield, Waste, Gross/Operating Profit, COGS, Cash Flow)
  - `/admin/settings` -> Organizations, Branches, Locations, Roles & Permissions, Unit Conversions, System Settings, Audit Logs
- **Shop / Cashier Portal (`/shop`)**:
  - `/shop` -> Touch-first POS: Fast Category Filter, Barcode/Text Search, Cart, Multi-tender / Split Payment, Instant Receipt Printing
  - `/shop/sales` -> Shift Sales History, Authorized Receipt Reprint, Customer Refund Management
  - `/shop/stock` -> Real-time Available Shop Stock, Incoming Inter-location Transfers (Acknowledge & Receive)
  - `/shop/waste` -> Shop Spoilage & Damaged Goods Registration with Reason & Authorization
  - `/shop/cash` -> Shift Management: Opening Float, Cash Sales, Payouts, Drop/Deposit, Shift Close & Cash Count Reconciliation
  - `/shop/settings` -> POS Terminal Preferences, Thermal Printer Settings, Language Switcher

---

## 2. Role & Permission Matrix (RBAC + RLS)

| Role | Admin Portal | Shop POS | Recipes & Production | Inventory Movements | Purchasing & Suppliers | Financial & Payroll | System Settings |
|---|---|---|---|---|---|---|---|
| **Owner / Super Admin** | Full Access | Full Access | Full Access & Approval | Full Access | Full Access | Full Access | Full Access |
| **Manager** | Full Access | Full Access | Oversight & Approval | Full Access & Approval | PO & Receipts | View Only | View Only |
| **Production Manager** | Limited Admin | Denied | Full Recipe & Batch Control | Material Request / Issue | View Materials | Denied | Denied |
| **Inventory Staff** | Limited Admin | Denied | View Batches | Receive, Transfer, Count | PO Receiving | Denied | Denied |
| **Cashier** | Denied | Full POS & Shift | Denied | View Shop Stock Only | Denied | Shift Cash Only | Denied |
| **Accountant** | Financials Only | View Only | View Production Costs | View Valuation | Invoices & Payments | Full Expenses & Payroll | Denied |
| **Viewer** | Read-Only KPIs | Denied | Read-Only | Read-Only | Read-Only | Read-Only | Denied |

*Security Rule: Cashiers and unauthorized roles are blocked at the RLS database and server layer from accessing cost prices, supplier balances, staff salaries, and executive profit metrics.*

---

## 3. Database Schema Overview (Supabase PostgreSQL)

### Primary Entity Groups:
1. **Identity & Multi-Tenancy**: `organizations`, `branches`, `locations`, `profiles`, `roles`, `permissions`, `user_role_assignments`, `system_settings`, `audit_logs`
2. **Master Data**: `product_categories`, `products`, `product_prices`, `raw_materials`, `units`, `unit_conversions`
3. **Recipes & Production**: `recipes`, `recipe_versions`, `recipe_ingredients`, `production_plans`, `production_batches`, `production_inputs`, `production_outputs`, `production_waste`
4. **Inventory & Movement Ledger**: `inventory_lots`, `inventory_movements` (Immutable double-entry style stock ledger), `stock_transfers`, `stock_transfer_items`, `waste_records`
5. **Procurement**: `suppliers`, `purchases`, `purchase_items`, `purchase_receipts`, `supplier_payments`
6. **Sales & POS**: `sales`, `sale_items`, `payments`, `refunds`, `cash_sessions`, `cash_movements`
7. **Workforce & Operations**: `employees`, `attendance`, `payroll_periods`, `payroll_items`, `payroll_payments`, `expense_categories`, `expenses`, `utility_allocations`

---

## 4. Phase Delivery & Gate Status

- [x] **Phase 1: Foundation**
  - Next.js 14+ App Router, Tailwind CSS with custom forest-green theme tokens, Lucide icons, shadcn UI primitives.
  - Bilingual localization engine (Bangla default + English), with language toggle persisted across sessions.
  - Complete Supabase schema migration DDL script (`supabase/migrations/001_initial_schema.sql` and `002_functions_and_rls.sql`).
  - Authentication layer & session provider with mock/preview accounts for all 7 roles.
  - Master layout shells for `/admin` and `/shop` with responsive navigation.
  - Acceptance tests for auth, language switching, and RBAC route protection passed.

- [x] **Phase 2: Master Data Management**
  - Products & Categories (Bilingual, SKU, Barcode, Shelf Life, Pricing history).
  - Raw Materials & Supplier catalog (Units, Conversion ratios e.g. kg/g, liter/ml, reorder thresholds).
  - Versioned Recipe / BOM Builder with standard batch outputs, expected yield %, and ingredient weight calculations.
  - Verification: Master data CRUD and validation operational.

- [x] **Phase 3: Production, Inventory & Transfers**
  - Production Batch Lifecycle: `Draft` -> `Planned` -> `In Progress` -> `Completed` -> `Approved`.
  - Atomic approval transaction: Deduct raw materials, record output yield, finished goods lot creation.
  - Yield Analysis: Input vs Output weight, piece weight variance, raw cost per piece.
  - Immutable Inventory Movement Ledger with FIFO/Weighted-Average valuation.
  - Inter-location Stock Transfer: Warehouse -> Shop counter with Dispatch and Receive confirmation.
  - Stock adjustment and damage/waste logging with ledger synchronization.

- [x] **Phase 4: Shop POS & Cash Management**
  - Touch-optimized POS checkout: Fast category pill filters, live stock indicator, cart management.
  - Payment Processing: Cash, bKash, Nagad, Rocket, Cards, Split tender.
  - Thermal 80mm / 58mm Receipt Generation with bilingual Bangla/English typography.
  - Sales Returns & Exchanges with stock recovery logic.
  - Shift / Register Cash Sessions: Opening Float, Cash Drops/Payouts, Blind Count, Shift Closing & Variance Report.
  - Idempotency & double-post protection verified.

- [x] **Phase 5: Expenses, Utilities & Workforce Payroll**
  - Operating expense vouchers with category tagging (Rent, Gas, Electricity, Water, Packaging, Transport, Cleaning).
  - Utility cost allocations attached to production batches.
  - Employee management: monthly salary, shift assignments, attendance logger.
  - Payroll calculation: Base pay + Overtime + Bonuses - Advances/Deductions -> Payment disbursement.

- [x] **Phase 6: Financial Accounting, Analytics & Reports**
  - Executive Dashboard with real-time KPI cards and trend metrics.
  - Daily, Weekly, and Monthly Profit & Loss Statement (Gross Sales, Net Sales, COGS, Gross Margin, Operating Expenses, Operating Profit).
  - Production yield reports, ingredient consumption variance, and spoilage analytics.
  - Comprehensive report exports (Excel `.xlsx` generation via SheetJS, Print-ready thermal formatting).

- [x] **Phase 7: Security Audit, Hardening & Acceptance Verification**
  - Verification of all 12 mandatory acceptance criteria.
  - End-to-end automated test suite execution (12/12 passing).
  - Production build verification (`npx next build` passes with 21 static routes).
  - Deployment instructions, `.env.example`, and operational user documentation (`README.md`).

---

## 5. Mandatory Acceptance Scenarios Checklist

| # | Scenario | Status | Verified Evidence |
|---|---|---|---|
| 1 | Purchase 50 kg flour -> raw stock rises exactly 50 kg | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 1) |
| 2 | Approve batch consuming 10 kg flour -> raw stock falls exactly 10 kg once | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 2) & `approveProductionBatch` |
| 3 | Produce 100 saleable units -> finished stock rises exactly 100 | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 3) & Finished goods lots |
| 4 | Transfer 40 units to shop -> warehouse -40, shop +40, total unchanged | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 4) & `dispatchStockTransfer`/`receiveStockTransfer` |
| 5 | Sell 5 units -> shop -5; payment, receipt and COGS posted once | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 5) & `processPOSSale` |
| 6 | Record 2 damaged units -> stock and waste ledger reconcile | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 6) & `recordWaste` |
| 7 | Edit recipe -> historical production cost snapshots unchanged | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 7) & Versioned BOM snapshots |
| 8 | Cashier attempts admin financial API -> denied by RLS/server | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 8) & `AdminLayout` RBAC Guard |
| 9 | Switch Bangla/English -> navigation, forms, errors, receipts and reports translated | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 9) & `I18nProvider` |
| 10 | Retry same checkout request -> one sale only (idempotency key) | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 10) & `processPOSSale` idempotency |
| 11 | Close cash shift -> expected vs counted cash and variance correct | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 11) & `closeCashShift` blind count |
| 12 | Reconcile inventory, sales, COGS and operating profit against source ledgers | PASSED | `src/__tests__/acceptance_scenarios.test.ts` (Scenario 12) & P&L Statement |
