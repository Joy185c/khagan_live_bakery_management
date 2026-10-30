# KHAGAN LIVE BAKERY MANAGEMENT SYSTEM
# PRODUCTION DEPLOYMENT & OPERATIONS MANUAL
**Document Reference**: `DEPLOYMENT_GUIDE.md`  
**Platform**: Next.js App Router (TypeScript) + Supabase PostgreSQL + Vercel / Docker  
**Date**: October 30, 2026  

---

## 1. Production Architecture Overview

The system consists of:
- **Frontend & API**: Next.js 14 App Router deployed to Vercel or Node.js server.
- **Database & Auth**: Supabase Managed PostgreSQL (`swklzpclsghbdtmtprnb.supabase.co`).
- **Reporting & Backup Destination**: Google Sheets API v4 + XLSX local exports.

---

## 2. Environment Variables Checklist

Configure the following in your hosting provider (e.g. Vercel Dashboard -> Settings -> Environment Variables):

```ini
# Supabase Production Database
NEXT_PUBLIC_SUPABASE_URL=https://swklzpclsghbdtmtprnb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Application Localization & Timezone
NEXT_PUBLIC_DEFAULT_LOCALE=bn
NEXT_PUBLIC_DEFAULT_CURRENCY=BDT
NEXT_PUBLIC_APP_TIMEZONE=Asia/Dhaka

# Google Sheets Live Synchronization (Server-side)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_google_sheet_id_here
```

---

## 3. Database Migration & Setup

To set up a fresh Supabase database instance:
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/swklzpclsghbdtmtprnb/sql/new).
2. Copy and paste the complete content of `supabase/complete_setup.sql`.
3. Click **Run** to provision all 36 tables, relations, triggers, stored procedures, RLS policies, and initial bakery seeds.

---

## 4. GitHub Remote & Deployment

### Connecting to GitHub:
```powershell
# Set main branch and remote
git branch -M main
git remote add origin https://github.com/Joy185c/khagan_live_bakery_management.git

# Push complete repository
git push -u origin main
```

### Deploying to Vercel:
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import repository `Joy185c/khagan_live_bakery_management`.
3. Framework Preset: **Next.js**.
4. Add the environment variables from section 2.
5. Click **Deploy**.

---

## 5. Daily Bakery Operations Runbook

1. **Morning Shift Start**:
   - Cashier logs into `/shop`.
   - Opens cash shift with the starting cash float (e.g. ৳ 1,000).
2. **Kitchen Batch Execution**:
   - Production Manager logs into `/admin/production`.
   - Formulates daily batch (e.g. 50 pieces Milk Bread).
   - Head Baker inputs actual pieces baked (e.g. 48 saleable, 2 rejects).
   - Manager reviews yield (96%) and clicks **Approve Batch**.
3. **Goods Transfer**:
   - Transfer 30 pieces to Shop Counter (`/admin/inventory` -> Transfer).
   - Cashier clicks **Receive Transfer** at `/shop/stock`.
4. **Daytime POS Billing**:
   - Cashier scans barcodes or selects categories, collects cash/bKash, and prints receipts.
5. **Night Shift Closing**:
   - Cashier counts drawer cash blindly and enters amount in `/shop/cash`.
   - Manager verifies discrepancy report and closes shift.
   - Manager visits `/admin/spreadsheet` and confirms sync with Google Sheets / downloads daily Excel backup.

