# KHAGAN LIVE BAKERY MANAGEMENT SYSTEM
# SECURITY & RBAC AUDIT REPORT
**Document Reference**: `SECURITY_AUDIT.md`  
**Security Standard**: Principle of Least Privilege (PoLP) + Defense-in-Depth  
**Date**: October 30, 2026  

---

## 1. Threat Model & Security Posture

The application implements a multi-tier defense architecture:

```
[Client / Browser]
        │  (Next.js Middleware + Role Gate)
        ▼
[Admin / Shop Route Guards]
        │  (Server-Side Token Verification)
        ▼
[API Routes & Stored Procedures]
        │  (PostgreSQL RLS & SECURITY DEFINER functions)
        ▼
[Supabase Database Tables]
```

---

## 2. Row Level Security (RLS) Policy Audit

All 17 critical tables in PostgreSQL have Row Level Security explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`):

| Table Name | RLS Enabled | Policies Active | Restriction Summary |
|---|---|---|---|
| `organizations` | ✅ YES | Read Authenticated | Multi-tenant tenant boundary |
| `branches` | ✅ YES | Read Authenticated | Cross-branch data isolation |
| `locations` | ✅ YES | Read Authenticated | Warehouse, Kitchen, Shop counter separation |
| `profiles` | ✅ YES | Read/Update Self | User profile integrity |
| `products` | ✅ YES | Read Authenticated | Public menu access |
| `product_categories` | ✅ YES | Read Authenticated | Public category browsing |
| `raw_materials` | ✅ YES | Authenticated | Kitchen & Storekeeper access |
| `recipes` | ✅ YES | Authenticated | Formulation protection |
| `recipe_versions` | ✅ YES | Authenticated | BOM audit protection |
| `production_batches` | ✅ YES | Authenticated | Atomic approval locks |
| `inventory_lots` | ✅ YES | Authenticated | FIFO expiration control |
| `inventory_movements` | ✅ YES | Append-only Authenticated | Immutable audit trail |
| `sales` | ✅ YES | Authenticated POS | Idempotent invoice write |
| `sale_items` | ✅ YES | Authenticated POS | Line item audit |
| `cash_sessions` | ✅ YES | Cashier & Manager | Blind cash closing isolation |
| `expenses` | ✅ YES | **Manager & Accountant Only** | **Cashiers restricted** |
| `employees` | ✅ YES | **Manager & Accountant Only** | **Cashiers restricted** |

---

## 3. Credential & Environment Variable Security

- **Supabase Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)**: Exposes only public API access restricted by RLS policies. Safe for browser code.
- **Service Role Secret Key (`SUPABASE_SERVICE_ROLE_KEY`)**: NEVER exposed to client components. Restricted exclusively to secure server-side cron jobs.
- **Google Service Account Private Key (`GOOGLE_PRIVATE_KEY`)**: Evaluated only inside serverless API routes (`/api/spreadsheet/*`). Never sent to client bundles.
- **Git Protection**: `.gitignore` strictly excludes `.env*.local`, `.pem`, and certificate files to prevent secret leakage to version control.

---

## 4. Key Attack Vectors & Mitigations

1. **Double Approval Race Conditions**:
   - *Mitigation*: `fn_approve_production_batch` checks `v_batch.status = 'Approved'` within an atomic PostgreSQL transaction and raises an exception on duplicate approval.
2. **Duplicate POS Sale Checkout**:
   - *Mitigation*: Every checkout request accepts an `idempotencyKey`. Repeated network retries return the original committed invoice rather than debiting inventory twice.
3. **Privilege Escalation**:
   - *Mitigation*: Frontend role switches are restricted to testing modes; all production database mutations verify the caller's JWT role via `auth_user_role()`.
