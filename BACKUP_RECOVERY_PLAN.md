# Khagan Live Bakery — Database Backup & Disaster Recovery Plan
### ডেটাবেজ ব্যাকআপ ও দুর্যোগ পুনরুদ্ধার পরিকল্পনা

This document outlines the backup policies, replication topology, automated snapshot schedules, and disaster recovery (DR) procedures for the **Khagan Live Bakery Management ERP & POS System**.

---

## 1. Objectives & SLA Metrics

- **Recovery Point Objective (RPO)**: $\le 15\text{ minutes}$ (Maximum tolerable data loss in case of hardware or network catastrophe).
- **Recovery Time Objective (RTO)**: $\le 30\text{ minutes}$ (Maximum tolerable downtime to restore normal cashier POS and production operations).
- **Primary Database Engine**: Supabase Managed PostgreSQL (Production) with local resilient fallbacks.

---

## 2. Backup Topology & Schedule

| Backup Type | Frequency | Retention Period | Storage Location | Automation Tool |
|---|---|---|---|---|
| **Continuous WAL Archival (PITR)** | Real-time | 7 Days | Supabase Cloud Physical WAL Store | WAL-G / pg_wal |
| **Full Logical Snapshot** | Daily at 02:00 AM BD Time | 30 Days | Encrypted Offsite S3 Bucket | `pg_dump` automated cron |
| **Shift Closing Financial Export** | End of Every Shift | 90 Days | Encrypted Local Cache & Manager Email | System Auto-Export (`.xlsx`) |
| **Weekly Schema & Migration Snapshot** | Every Sunday | 1 Year | Git Repository (`supabase/migrations`) | Git Version Control |

---

## 3. Automated Logical Backup Script

For self-hosted Postgres or scheduled server backups, the following script executes a consistent compressed logical backup:

```bash
#!/usr/bin/env bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/khagan_bakery"
DB_NAME="postgres"
BACKUP_FILE="${BACKUP_DIR}/khagan_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting Khagan Live Bakery logical database backup..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --format=custom --compress=9 \
  --exclude-table-data='audit_logs' | gzip > "$BACKUP_FILE"

echo "Backup created successfully: $BACKUP_FILE"

# Retain only last 30 daily backups
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
```

---

## 4. Disaster Recovery & Restoration Procedures

### Scenario A: Accidental Data Corruption or Erroneous Deletion
1. Identify the timestamp immediately preceding the incident (e.g., `2026-10-30 14:15:00+06`).
2. Navigate to the **Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Backups $\rightarrow$ Point in Time Recovery**.
3. Choose the target restoration timestamp and execute restoration into a fresh staging database.
4. Verify table row counts: `products`, `sales`, `production_batches`, `inventory_movements`.
5. Point the Next.js production environment variables (`NEXT_PUBLIC_SUPABASE_URL`) to the restored instance.

### Scenario B: Complete Cloud Outage / Offline POS Emergency
1. The Shop POS interface (`/shop`) operates in resilient offline mode using local storage.
2. Cashiers continue processing counter sales with sequence invoices (`INV-OFFLINE-XXX`).
3. Once cloud connectivity resumes, the offline queue syncs with the central database using idempotency keys, avoiding double billing or duplicated stock movements.

---

## 5. End-of-Day Reconciliation Checklist

At the end of every business day (11:00 PM Asia/Dhaka):
1. **Cash Shift Closed**: Ensure all cashier registers are closed and cash counts verified against expected drawer totals (`/shop/cash`).
2. **Batch Approvals**: Ensure all day batches are either `Approved` or marked `Draft` (`/admin/production`).
3. **P&L Export**: Manager downloads the official Excel report (`/admin/reports`) and archives a physical print-out.

