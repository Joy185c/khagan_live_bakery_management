'use client';

import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/lib/db/store';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  FileText,
  HelpCircle,
  RotateCcw,
  Settings,
  Upload,
  Link2,
  Key,
  Copy,
  Check,
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

  // Admin Direct Config Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; title?: string } | null>(null);
  const [activeConfig, setActiveConfig] = useState<{
    spreadsheetId: string;
    serviceAccountEmail: string;
    hasPrivateKey: boolean;
    isConfigured: boolean;
  } | null>(null);

  // Fetch current config status from server
  useEffect(() => {
    fetch('/api/spreadsheet/config')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setActiveConfig(data);
          if (data.spreadsheetId) setSpreadsheetInput(data.spreadsheetId);
          if (data.serviceAccountEmail) setServiceAccountEmail(data.serviceAccountEmail);
        }
      })
      .catch(() => {});
  }, []);

  const pendingCount = spreadsheetOutbox.filter((i) => i.status === 'pending').length;
  const failedCount = spreadsheetOutbox.filter((i) => i.status === 'failed').length;

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

  // 5. Handle Service Account JSON Upload
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.client_email) setServiceAccountEmail(json.client_email);
        if (json.private_key) setPrivateKey(json.private_key);
        setTestResult({
          success: true,
          message: locale === 'bn' ? 'সার্ভিস অ্যাকাউন্ট JSON থেকে ইমেইল ও প্রাইভেট কী সফলভাবে লোড হয়েছে।' : 'Service account credentials loaded from JSON file.',
        });
      } catch {
        setTestResult({
          success: false,
          message: locale === 'bn' ? 'অবৈধ JSON ফাইল! সঠিক Service Account JSON ফাইল আপলোড করুন।' : 'Invalid JSON file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  // 6. Test Live Google Connection
  const handleTestConnection = async () => {
    if (!spreadsheetInput || !serviceAccountEmail) {
      setTestResult({
        success: false,
        message: locale === 'bn' ? 'Spreadsheet ID এবং Service Account Email পূরণ করুন।' : 'Spreadsheet ID and Service Account Email are required.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/spreadsheet/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetInput,
          serviceAccountEmail,
          privateKey,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  // 7. Save Credentials directly from Admin Panel
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/spreadsheet/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetInput,
          serviceAccountEmail,
          privateKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: locale === 'bn' ? 'গুগল স্প্রেডশিট কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!' : 'Google Spreadsheet credentials saved successfully!',
        });
        setActiveConfig({
          spreadsheetId: spreadsheetInput,
          serviceAccountEmail,
          hasPrivateKey: true,
          isConfigured: true,
        });
        setIsConfigModalOpen(false);
      } else {
        setTestResult({
          success: false,
          message: data.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Save failed',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy email to clipboard helper
  const handleCopyEmail = () => {
    if (!serviceAccountEmail) return;
    navigator.clipboard.writeText(serviceAccountEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const isActuallyConnected = Boolean(activeConfig?.isConfigured);

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
          {/* Direct Admin Config Modal Button */}
          <Button
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            className="text-xs bg-[#104C34] hover:bg-[#176B45] text-white shadow-sm font-semibold"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            {locale === 'bn' ? 'গুগল শিট কনফিগার করুন' : 'Configure Google Sheets'}
          </Button>

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
                ? 'এখন সরাসরি এই অ্যাডমিন প্যানেল থেকেই সার্ভিস অ্যাকাউন্ট JSON আপলোড করে স্প্রেডশিট সেটআপ করতে পারবেন:'
                : 'You can now configure your Google Spreadsheet directly from this Admin Panel by uploading your JSON key:'}
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 font-medium text-[#2E4A3B]">
              <li>
                <strong>Google Cloud Console</strong>-এ গিয়ে <em>Google Sheets API</em> এনাবল করুন।
              </li>
              <li>
                একটি <strong>Service Account</strong> তৈরি করে তার JSON Key ডাউনলোড করুন।
              </li>
              <li>
                উপরের <strong>&quot;{locale === 'bn' ? 'গুগল শিট কনফিগার করুন' : 'Configure Google Sheets'}&quot;</strong> বাটনে ক্লিক করে JSON ফাইলটি আপলোড করুন।
              </li>
              <li>
                আপনার গুগল স্প্রেডশিটের <strong>Share</strong> অপশনে সার্ভিস অ্যাকাউন্ট ইমেইলটিকে <strong>Editor</strong> হিসেবে যোগ করুন।
              </li>
              <li>
                <strong>&quot;{t.spreadsheet.reconcile}&quot;</strong> বাটনে চাপ দিন—১৩টি শিট ও সমস্ত ডাটা লাইভ হয়ে যাবে!
              </li>
            </ol>
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
                <p className="font-bold text-sm text-[#172B22] truncate max-w-[170px]" title={activeConfig?.spreadsheetId || 'Not Configured'}>
                  {activeConfig?.spreadsheetId ? `ID: ${activeConfig.spreadsheetId.slice(0, 15)}...` : 'Not Configured'}
                </p>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-[11px] text-[#176B45] font-semibold hover:underline mt-0.5 block"
                >
                  {isActuallyConnected ? (locale === 'bn' ? 'সেটিংস পরিবর্তন করুন' : 'Change Settings') : (locale === 'bn' ? '+ এখানে যুক্ত করুন' : '+ Connect Now')}
                </button>
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
                <Badge
                  variant="default"
                  className={isActuallyConnected ? 'bg-emerald-100 text-[#104C34] border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'}
                >
                  {isActuallyConnected ? t.spreadsheet.connected : (locale === 'bn' ? 'সেটআপ প্রয়োজন' : 'Setup Required')}
                </Badge>
                <p className="text-[10px] text-[#5C7567] mt-1">
                  {isActuallyConnected ? 'Live Cloud Sync Active' : 'Running in Local Mode'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActuallyConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {isActuallyConnected ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
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

      {/* ========================================================================= */}
      {/* DIRECT ADMIN CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={locale === 'bn' ? 'গুগল স্প্রেডশিট সরাসরি কনফিগারেশন' : 'Configure Google Spreadsheet'}
        description={locale === 'bn' ? 'সার্ভিস অ্যাকাউন্ট JSON আপলোড করুন অথবা সরাসরি লিঙ্ক ও ক্রেডেনশিয়াল প্রদান করুন।' : 'Upload Service Account JSON or provide sheet link and credentials.'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          {/* Quick Upload Box */}
          <div className="p-3.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#104C34]">
              <Upload className="w-4 h-4 text-[#176B45]" />
              <span>{locale === 'bn' ? 'Google Service Account JSON ফাইল আপলোড করুন (১-ক্লিক)' : 'Upload Service Account JSON File (1-Click)'}</span>
            </div>
            <p className="text-[11px] text-[#5C7567]">
              {locale === 'bn' ? 'গুগল ক্লাউড থেকে ডাউনলোড করা .json ফাইলটি সিলেক্ট করলে ইমেইল ও কী স্বয়ংক্রিয়ভাবে বসে যাবে।' : 'Selecting the downloaded .json file auto-populates Email and Private Key.'}
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileUpload}
              className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#176B45] file:text-white hover:file:bg-[#104C34] cursor-pointer"
            />
          </div>

          {/* Test Status Alert */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.title && <p className="text-[11px] mt-0.5 text-emerald-700">Spreadsheet Name: &quot;{testResult.title}&quot;</p>}
              </div>
            </div>
          )}

          {/* Field 1: Spreadsheet URL or ID */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#172B22] flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-[#176B45]" />
              <span>{locale === 'bn' ? 'Google Spreadsheet URL বা Sheet ID *' : 'Google Spreadsheet URL or Sheet ID *'}</span>
            </label>
            <Input
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit অথবা Sheet ID"
              className="text-xs font-mono"
              required
            />
            <p className="text-[10px] text-[#5C7567]">
              {locale === 'bn' ? 'টিপ: পুরো গুগল শিটের ব্রাউজার লিঙ্ক সরাসরি পেস্ট করতে পারেন।' : 'Tip: You can paste the entire Google Sheets browser URL directly.'}
            </p>
          </div>

          {/* Field 2: Service Account Email */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#172B22]">
                {locale === 'bn' ? 'Service Account Email *' : 'Service Account Email *'}
              </label>
              {serviceAccountEmail && (
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-[11px] text-[#176B45] hover:underline flex items-center gap-1"
                >
                  {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEmail ? (locale === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (locale === 'bn' ? 'ইমেইল কপি করুন' : 'Copy Email')}</span>
                </button>
              )}
            </div>
            <Input
              value={serviceAccountEmail}
              onChange={(e) => setServiceAccountEmail(e.target.value)}
              placeholder="your-account@project.iam.gserviceaccount.com"
              className="text-xs font-mono"
              required
            />
            <p className="text-[10px] text-[#176B45] font-medium">
              👉 {locale === 'bn' ? 'এই ইমেইলটিকে আপনার Google Sheet এর "Share" এ গিয়ে Editor বানিয়ে দিন।' : 'Make sure to share your Google Sheet with this email as an Editor.'}
            </p>
          </div>

          {/* Field 3: Private Key */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#172B22] flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-[#176B45]" />
              <span>{locale === 'bn' ? 'Private Key (JSON ফাইল থেকে পাওয়া কী) *' : 'Private Key (RSA Private Key) *'}</span>
            </label>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              rows={4}
              placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC..."
              className="w-full p-2.5 text-[11px] font-mono rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E2EBE5]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="text-xs border-[#176B45] text-[#176B45] hover:bg-[#EAF5EE]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? (locale === 'bn' ? 'পরীক্ষা হচ্ছে...' : 'Testing...') : (locale === 'bn' ? 'সংযোগ পরীক্ষা করুন' : 'Test Connection')}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-xs"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || isTesting}
                className="text-xs bg-[#176B45] hover:bg-[#104C34] text-white"
              >
                {isSaving ? (locale === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (locale === 'bn' ? 'সংরক্ষণ ও সংযোগ করুন' : 'Save & Connect')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
