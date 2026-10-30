'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp,
  ChefHat,
  AlertTriangle,
  Trash2,
  DollarSign,
  ArrowUpRight,
  PackageCheck,
  PlusCircle,
  Truck,
  Store,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation();
  const {
    sales,
    batches,
    rawMaterials,
    wasteRecords,
    expenses,
    activeCashSession,
  } = useDatabase();

  // Financial Calculations
  const todaySalesTotal = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayCogs = sales.reduce((sum, s) => sum + s.totalCogs, 0);
  const grossProfit = todaySalesTotal - todayCogs;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalExpenses;

  const totalProductionUnits = batches.reduce((sum, b) => sum + b.actualSaleableOutput, 0);
  const avgYield =
    batches.length > 0
      ? (batches.reduce((sum, b) => sum + b.yieldPercentage, 0) / batches.length).toFixed(1)
      : '0';

  const lowStockMaterials = rawMaterials.filter((m) => m.currentStock <= m.reorderPoint);
  const totalWasteCost = wasteRecords.reduce((sum, w) => sum + w.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.dashboard.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">{t.dashboard.subtitle}</p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center space-x-2">
          <Link href="/admin/production">
            <Button size="sm" className="text-xs h-9">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.dashboard.newBatch}</span>
            </Button>
          </Link>
          <Link href="/admin/purchases">
            <Button size="sm" variant="outline" className="text-xs h-9">
              <Truck className="w-3.5 h-3.5 mr-1.5 text-[#176B45]" />
              <span>{t.dashboard.recordPurchase}</span>
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="sm" variant="secondary" className="text-xs h-9">
              <Store className="w-3.5 h-3.5 mr-1.5 text-[#176B45]" />
              <span>{t.dashboard.openPos}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="border-l-4 border-l-[#176B45]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C7567]">{t.dashboard.todaySales}</p>
              <h3 className="text-2xl font-bold text-[#172B22] mt-1">
                {formatCurrency(todaySalesTotal, locale)}
              </h3>
              <p className="text-[11px] text-[#176B45] font-medium mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                <span>{sales.length} টি সফল অর্ডার সম্পন্ন</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EAF5EE] text-[#176B45] flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Production */}
        <Card className="border-l-4 border-l-[#104C34]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C7567]">{t.dashboard.todayProduction}</p>
              <h3 className="text-2xl font-bold text-[#172B22] mt-1">
                {formatNumber(totalProductionUnits, locale, 0)} {locale === 'bn' ? 'পিস' : 'pcs'}
              </h3>
              <p className="text-[11px] text-[#5C7567] font-medium mt-1">
                গড় ফলন (Avg Yield): <strong className="text-[#104C34]">{avgYield}%</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EAF5EE] text-[#104C34] flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C7567]">{t.dashboard.grossProfit}</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(grossProfit, locale)}
              </h3>
              <p className="text-[11px] text-[#5C7567] font-medium mt-1">
                COGS: {formatCurrency(todayCogs, locale)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Operating Profit */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C7567]">{t.dashboard.operatingProfit}</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(operatingProfit, locale)}
              </h3>
              <p className="text-[11px] text-[#5C7567] font-medium mt-1">
                OPEX খরচ বাদ দিয়ে প্রকৃত লাভ
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Cash Register & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cash Shift Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t.dashboard.shiftStatus}</CardTitle>
              <Badge variant={activeCashSession ? 'success' : 'danger'}>
                {activeCashSession ? t.dashboard.open : t.dashboard.closed}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCashSession ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-[#D1E2D7]/50">
                  <span className="text-[#5C7567]">ক্যাশিয়ার:</span>
                  <span className="font-semibold text-[#172B22]">{activeCashSession.cashierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E2D7]/50">
                  <span className="text-[#5C7567]">প্রারম্ভিক ক্যাশ (Float):</span>
                  <span className="font-semibold text-[#172B22]">
                    {formatCurrency(activeCashSession.openingFloat, locale)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E2D7]/50">
                  <span className="text-[#5C7567]">নগদ ক্যাশ বিক্রয়:</span>
                  <span className="font-semibold text-emerald-700">
                    +{formatCurrency(activeCashSession.totalCashSales, locale)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E2D7]/50">
                  <span className="text-[#5C7567]">মোবাইল ব্যাংকিং (বিকাশ/নগদ):</span>
                  <span className="font-semibold text-sky-700">
                    +{formatCurrency(activeCashSession.totalMobileSales, locale)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 bg-[#EAF5EE] px-2.5 rounded-lg">
                  <span className="font-bold text-[#104C34]">রেজিস্টারে ক্যাশ প্রত্যাশা:</span>
                  <span className="font-bold text-[#104C34]">
                    {formatCurrency(activeCashSession.expectedClosingCash, locale)}
                  </span>
                </div>
                <Link href="/shop/cash" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    ক্যাশ রেজিস্টার পরিচালনা &rarr;
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-[#5C7567]">বর্তমানে কোনো ক্যাশ শিফট চালু নেই।</p>
                <Link href="/shop/cash">
                  <Button size="sm" className="text-xs">
                    নতুন শিফট শুরু করুন
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Low Stock Warnings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-base">{t.dashboard.lowStockMaterials}</CardTitle>
              </div>
              <Badge variant="warning">{lowStockMaterials.length} টি কাঁচামাল সতর্ক সীমায়</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockMaterials.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#5C7567]">
                সকল কাঁচামালের মজুত পর্যাপ্ত রয়েছে।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                    <tr>
                      <th className="py-2.5 px-3">কাঁচামালের নাম</th>
                      <th className="py-2.5 px-3">বর্তমান মজুত</th>
                      <th className="py-2.5 px-3">পুনঃক্রয় সীমা</th>
                      <th className="py-2.5 px-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1E2D7]/60">
                    {lowStockMaterials.map((m) => (
                      <tr key={m.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-2.5 px-3 font-semibold text-[#172B22]">
                          {locale === 'bn' ? m.nameBn : m.nameEn}
                          <span className="block text-[10px] text-[#5C7567]">{m.code}</span>
                        </td>
                        <td className="py-2.5 px-3 text-rose-600 font-bold">
                          {m.currentStock} {m.baseUnitId.replace('u-', '')}
                        </td>
                        <td className="py-2.5 px-3 text-[#5C7567]">
                          {m.reorderPoint} {m.baseUnitId.replace('u-', '')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link href="/admin/purchases">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5">
                              ক্রয় রিকুইজিশন
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Production Batches Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">সাম্প্রতিক উৎপাদন ব্যাচসমূহ (Recent Batches)</CardTitle>
            <Link href="/admin/production">
              <Button variant="ghost" size="sm" className="text-xs">
                সকল ব্যাচ দেখুন &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-2.5 px-3">ব্যাচ নং</th>
                  <th className="py-2.5 px-3">পণ্য ও রেসিপি</th>
                  <th className="py-2.5 px-3">পরিকল্পিত / প্রকৃত উৎপাদন</th>
                  <th className="py-2.5 px-3">ফলন (Yield %)</th>
                  <th className="py-2.5 px-3">পিস প্রতি ব্যয়</th>
                  <th className="py-2.5 px-3">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {batches.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-[#EAF5EE]/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#172B22]">{b.batchNumber}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-[#172B22]">
                        {locale === 'bn' ? b.productNameBn : b.productNameEn}
                      </p>
                      <p className="text-[10px] text-[#5C7567]">{b.recipeName}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[#172B22]">
                      {b.plannedQuantity} / <strong>{b.actualSaleableOutput}</strong> পিস
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          b.yieldPercentage >= 95 ? 'text-emerald-700' : 'text-amber-600'
                        }`}
                      >
                        {b.yieldPercentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#172B22]">
                      {formatCurrency(b.costPerPiece, locale)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={b.status === 'Approved' ? 'success' : 'default'}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

