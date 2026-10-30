'use client';

import React, { useState } from 'react';
import { useDatabase } from '@/lib/db/store';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  ShieldCheck,
  FileText,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export default function SpreadsheetBackupPage() {
  const { t, locale } = useTranslation();
  const {
    products,
    rawMaterials,
    recipes,
    batches,
    sales,
    expenses,
    suppliers,
    employees,
    wasteRecords,
    inventoryLots,
    inventoryMovements,
    spreadsheetOutbox,
    lastSyncedAt,
    syncSpreadsheetNow,
    reconcileSpreadsheet,
    retryFailedSync,
  } = useDatabase();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'failed' | 'completed'>('all');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const pendingCount = spreadsheetOutbox.filter((i) => i.status === 'pending').length;
  const failedCount = spreadsheetOutbox.filter((i) => i.status === 'failed').length;
  const completedCount = spreadsheetOutbox.filter((i) => i.status === 'completed').length;

  const filteredLogs = spreadsheetOutbox.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  const sheetsOverview = [
    { id: 1, title: 'Daily Production', titleBn: 'দৈনিক উৎপাদন', count: batches.length, desc: 'Batch yield, planned vs actual output, cost per piece' },
    { id: 2, title: 'Raw Material Inventory', titleBn: 'কাঁচামাল ইনভেন্টরি', count: rawMaterials.length, desc: 'Current stocks, average cost, minimum threshold alerts' },
    { id: 3, title: 'Finished Product Stock', titleBn: 'তৈরি পণ্য মজুত', count: products.length, desc: 'Finished goods available, retail prices, gross margin' },
    { id: 4, title: 'Daily Sales', titleBn: 'দৈনিক বিক্রয় খতিয়ান', count: sales.length, desc: 'POS transactions, payment method, discounts, cashier' },
    { id: 5, title: 'Recipe & Product Costing', titleBn: 'রেসিপি ও উৎপাদন ব্যয়', count: recipes.length, desc: 'Standard batch BOM, ingredients breakdown, cost share' },
    { id: 6, title: 'Waste Register', titleBn: 'অপচয় ও বিনষ্ট খতিয়ান', count: wasteRecords.length, desc: 'Spoilage, damaged bake, expiry write-offs, financial loss' },
    { id: 7, title: 'Purchases & Suppliers', titleBn: 'ক্রয় ও সরবরাহকারী হিসাব', count: suppliers.length, desc: 'Supplier balances, material purchase invoices, payments' },
    { id: 8, title: 'Expenses & Utilities', titleBn: 'খরচ ও ইউটিলিটি হিসাব', count: expenses.length, desc: 'Electricity, gas, bakery maintenance, vouchers' },
    { id: 9, title: 'Employee Payroll', titleBn: 'কর্মী ও বেতন তালিকা', count: employees.length, desc: 'Staff payroll, attendance, base salary, department' },
    { id: 10, title: 'Daily Profit & Loss', titleBn: 'দৈনিক লাভ-ক্ষতি বিবরণী', count: sales.length > 0 ? 1 : 0, desc: 'Gross sales, COGS, waste loss, OPEX, daily net profit' },
    { id: 11, title: 'Weekly Summary', titleBn: 'সাপ্তাহিক সংক্ষিপ্তসার', count: 1, desc: 'Running weekly production, sales volume and margins' },
    { id: 12, title: 'Monthly Summary', titleBn: 'মাসিক সংক্ষিপ্তসার', count: 1, desc: 'Monthly performance, payroll totals, net operating income' },
    { id: 13, title: 'Audit Log', titleBn: 'অডিট ও লেনদেন লগ', count: inventoryMovements.length, desc: 'Stock movements, lot deductions, security actor trail' },
  ];

  // 1. Sync Now Trigger
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncSpreadsheetNow();
      setFeedback({
        type: res.success ? 'success' : 'info',
        message: res.message,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Full Reconciliation & Rebuild Trigger
  const handleReconcile = async () => {
    if (!window.confirm(locale === 'bn' ? 'আপনি কি নিশ্চিত যে সম্পূর্ণ ১৩টি শিট ডাটাবেস অনুযায়ী রিবিল্ড করতে চান?' : 'Are you sure you want to reconcile and rebuild all 13 sheets from authoritative database records?')) {
      return;
    }
    setIsReconciling(true);
    setFeedback(null);
    try {
      const res = await reconcileSpreadsheet();
      setFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Reconciliation failed' });
    } finally {
      setIsReconciling(false);
    }
  };

  // 3. Retry Failed Outbox
  const handleRetryFailed = async () => {
    setIsSyncing(true);
    try {
      const res = await retryFailedSync();
      setFeedback({
        type: res.success ? 'success' : 'info',
        message: res.message,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Retry failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Download 13-Sheet Excel Workbook
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const statePayload = {
        products,
        rawMaterials,
        recipes,
        batches,
        sales,
        expenses,
        suppliers,
        employees,
        wasteRecords,
        inventoryLots,
        inventoryMovements,
      };

      const res = await fetch('/api/spreadsheet/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: statePayload }),
      });

      if (!res.ok) throw new Error('Failed to generate Excel file');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Khagan_Bakery_ERP_Master_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFeedback({
        type: 'success',
        message: locale === 'bn' ? '১৩টি শিটসহ সম্পূর্ণ এক্সেল ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে।' : '13-worksheet master Excel backup downloaded successfully.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Download failed' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#172B22]">
              {t.spreadsheet.title}
            </h1>
            <Badge variant="default" className="border-emerald-600 text-emerald-800 bg-emerald-50 text-xs">
              Live V4 API
            </Badge>
          </div>
          <p className="text-xs text-[#5C7567] mt-1">
            {t.spreadsheet.subtitle}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="text-xs border-[#8CA895]"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#176B45]" />
            {t.spreadsheet.setupGuide}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="text-xs bg-white text-[#176B45] border-[#176B45] hover:bg-[#EAF5EE]"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isDownloading ? (locale === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Generating...') : t.spreadsheet.downloadExcel}
          </Button>

          <Button
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing || isReconciling}
            className="text-xs bg-[#176B45] hover:bg-[#104C34] text-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? (locale === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : t.spreadsheet.syncNow}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReconcile}
            disabled={isSyncing || isReconciling}
            className="text-xs bg-[#EAF5EE] text-[#104C34] hover:bg-[#D4EBDC] font-semibold"
          >
            <Layers className={`w-3.5 h-3.5 mr-1 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? (locale === 'bn' ? 'রিবিল্ড হচ্ছে...' : 'Rebuilding...') : t.spreadsheet.reconcile}
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Setup Guide Drawer/Card */}
      {showSetupGuide && (
        <Card className="border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#104C34] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#176B45]" />
              {locale === 'bn' ? 'গুগল স্প্রেডশিট সার্ভিস অ্যাকাউন্ট কনফিগারেশন নির্দেশিকা' : 'Google Sheets Service Account Setup Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-[#172B22]">
            <p>
              {locale === 'bn'
                ? 'সরাসরি গুগল শিটে স্বয়ংক্রিয় ব্যাকআপের জন্য আপনার Google Cloud Console থেকে একটি Service Account তৈরি করুন:'
                : 'To enable live bidirectional background sync with your real Google Spreadsheet, configure a Google Cloud Service Account:'}
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 font-medium text-[#2E4A3B]">
              <li>
                <strong>Google Cloud Console</strong>-এ গিয়ে <em>Google Sheets API</em> এনাবল করুন।
              </li>
              <li>
                একটি <strong>Service Account</strong> তৈরি করে তার JSON Key ডাউনলোড করুন।
              </li>
              <li>
                আপনার প্রজেক্টের <code>.env.local</code> ফাইলে নিচের ভেরিয়েবলগুলো যুক্ত করুন:
                <pre className="mt-1 p-2 bg-white rounded border border-emerald-200 font-mono text-[11px] overflow-x-auto text-[#104C34]">
                  GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"&#10;
                  GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"&#10;
                  GOOGLE_SPREADSHEET_ID="your_google_sheet_id_from_url"
                </pre>
              </li>
              <li>
                আপনার গুগল স্প্রেডশিটটিতে Service Account Email-কে <strong>Editor</strong> হিসেবে Share করুন।
              </li>
              <li>
                উপরের <strong>&quot;{t.spreadsheet.reconcile}&quot;</strong> বাটনে চাপ দিন—তৎক্ষণাৎ ১৩টি শিট স্বয়ংক্রিয়ভাবে তৈরি হয়ে যাবে!
              </li>
            </ol>
            <p className="text-[11px] text-[#5C7567] italic">
              * নোট: গুগল ক্রেডেনশিয়াল দেওয়া না থাকলেও অ্যাপ্লিকেশন সম্পূর্ণ অফলাইনে চলে এবং ১৩টি শিটের এক্সেল ব্যাকআপ ডাউনলোড করা যায়।
            </p>
          </CardContent>
        </Card>
      )}

      {/* 4 Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Connected Spreadsheet */}
        <Card className="border border-[#E2EBE5] shadow-sm">
          <CardHeader className="pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#5C7567]">
              {t.spreadsheet.connectedSheet}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#172B22] truncate max-w-[170px]" title="Khagan Live Bakery - Live ERP Data">
                  Khagan Live Bakery ERP
                </p>
                <span className="text-[10px] text-[#5C7567] flex items-center gap-1 mt-0.5">
                  13 Worksheets Configured
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#176B45] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Connection Status */}
        <Card className="border border-[#E2EBE5] shadow-sm">
          <CardHeader className="pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#5C7567]">
              {t.spreadsheet.connectionStatus}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-100 text-[#104C34] border border-emerald-300 hover:bg-emerald-100 font-semibold text-xs">
                  {t.spreadsheet.connected}
                </Badge>
                <p className="text-[10px] text-[#5C7567] mt-1">
                  Transactional Outbox Active
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Last Sync Time */}
        <Card className="border border-[#E2EBE5] shadow-sm">
          <CardHeader className="pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#5C7567]">
              {t.spreadsheet.lastSync}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#172B22]">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : t.spreadsheet.never}
                </p>
                <span className="text-[10px] text-[#5C7567]">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleDateString() : 'Auto Sync on Commit'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Outbox Stats */}
        <Card className="border border-[#E2EBE5] shadow-sm">
          <CardHeader className="pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#5C7567]">
              {locale === 'bn' ? 'আউটবক্স কিউ অবস্থা' : 'Outbox Queue Status'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#5C7567]">{t.spreadsheet.pendingRecords}:</span>
                  <span className="font-bold text-amber-700">{pendingCount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#5C7567]">{t.spreadsheet.failedRecords}:</span>
                  <span className={`font-bold ${failedCount > 0 ? 'text-rose-600' : 'text-[#172B22]'}`}>
                    {failedCount}
                  </span>
                  {failedCount > 0 && (
                    <button
                      onClick={handleRetryFailed}
                      className="text-[10px] text-rose-600 underline hover:text-rose-800"
                    >
                      {t.spreadsheet.retryFailed}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worksheets Grid (13 Worksheets) */}
      <Card className="border border-[#E2EBE5] shadow-sm">
        <CardHeader className="pb-3 border-b border-[#E2EBE5]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-[#172B22] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176B45]" />
              {t.spreadsheet.sheetsOverview}
            </CardTitle>
            <span className="text-xs text-[#5C7567]">
              {locale === 'bn' ? 'মোট ১৩টি শিট সমন্বিত' : 'Total 13 Worksheets Synchronized'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sheetsOverview.map((sheet) => (
              <div
                key={sheet.id}
                className="p-3 rounded-xl border border-[#E2EBE5] hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-[#5C7567]">
                      #{String(sheet.id).padStart(2, '0')}
                    </span>
                    <Badge variant="default" className="text-[10px] font-mono border-emerald-300 text-emerald-800 bg-emerald-50">
                      {sheet.count} {locale === 'bn' ? 'টি এন্ট্রি' : 'rows'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs text-[#172B22]">
                    {locale === 'bn' ? sheet.titleBn : sheet.title}
                  </h4>
                  <p className="text-[10px] text-[#5C7567] mt-0.5 line-clamp-1">
                    {sheet.desc}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#F0F4F2] flex items-center justify-between text-[10px] text-[#5C7567]">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {locale === 'bn' ? 'অটমিক সিঙ্ক রেডি' : 'Authoritative Sync'}
                  </span>
                  <span className="font-medium text-gray-500">
                    Google Sheets v4
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outbox Queue & Sync Event Logs Table */}
      <Card className="border border-[#E2EBE5] shadow-sm">
        <CardHeader className="pb-3 border-b border-[#E2EBE5]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-[#172B22] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#176B45]" />
              {t.spreadsheet.eventLogs}
            </CardTitle>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F7F9F8] p-1 rounded-lg border border-[#E2EBE5]">
              {(['all', 'pending', 'failed', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white text-[#176B45] shadow-sm font-semibold'
                      : 'text-[#5C7567] hover:text-[#172B22]'
                  }`}
                >
                  {tab === 'all'
                    ? locale === 'bn' ? 'সকল' : 'All'
                    : tab === 'pending'
                    ? locale === 'bn' ? 'অপেক্ষমাণ' : 'Pending'
                    : tab === 'failed'
                    ? locale === 'bn' ? 'ব্যর্থ' : 'Failed'
                    : locale === 'bn' ? 'সম্পন্ন' : 'Completed'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9F8] text-[#5C7567] font-semibold uppercase tracking-wider border-b border-[#E2EBE5]">
                <tr>
                  <th className="px-4 py-3">ইভেন্ট আইডি / টাইমস্ট্যাম্প</th>
                  <th className="px-4 py-3">এনটিটি টাইপ</th>
                  <th className="px-4 py-3">অ্যাকশন</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3">পুনঃচেষ্টা</th>
                  <th className="px-4 py-3">বিবরণ / ত্রুটি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EBE5]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#5C7567]">
                      {locale === 'bn'
                        ? 'আউটবক্সে কোনো ইভেন্ট পাওয়া যায়নি। নতুন লেনদেন বা প্রোডাকশন ব্যাচ অনুমোদন করলে স্বয়ংক্রিয়ভাবে ইভেন্ট রেকর্ড হবে।'
                        : 'No outbox queue records found for this filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(0, 30).map((item) => (
                    <tr key={item.id} className="hover:bg-[#F7F9F8] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#172B22]">
                        <div>{item.id.slice(0, 18)}...</div>
                        <span className="text-[10px] text-[#5C7567]">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#172B22]">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px]">
                          {item.entityType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                            item.action === 'APPROVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.action === 'INSERT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="default"
                          className={`text-[10px] ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : item.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#5C7567]">
                        {item.retryCount} / {item.maxRetries}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5C7567] max-w-[250px] truncate">
                        {item.errorMessage || JSON.stringify(item.payload) || 'Committed'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
