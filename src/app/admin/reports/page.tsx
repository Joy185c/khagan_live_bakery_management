'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ChefHat,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminReportsPage() {
  const { t, locale } = useTranslation();
  const { sales, batches, expenses, wasteRecords, rawMaterials, products } = useDatabase();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Core Accounting P&L Formulas per PDF Spec:
  // net sales = gross sales − discounts − returns
  // gross profit = net sales − COGS
  // operating profit = gross profit − operating expenses
  const grossSales = sales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalDiscounts = sales.reduce((sum, s) => sum + s.discountAmount, 0);
  const totalReturns = 0; // returns deduction
  const netSales = grossSales - totalDiscounts - totalReturns;

  const totalCogs = sales.reduce((sum, s) => sum + s.totalCogs, 0);
  const grossProfit = netSales - totalCogs;
  const grossMarginPct = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0';

  const totalOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalOpex;
  const operatingMarginPct = netSales > 0 ? ((operatingProfit / netSales) * 100).toFixed(1) : '0';

  const totalWasteLoss = wasteRecords.reduce((sum, w) => sum + w.totalCost, 0);

  // Excel Export Handler using real XLSX
  const exportToExcel = () => {
    const pnlData = [
      { Metric: 'Gross Sales (মোট বিক্রয়)', Amount_BDT: grossSales },
      { Metric: 'Discounts (ছাড়)', Amount_BDT: totalDiscounts },
      { Metric: 'Returns (ফেরত)', Amount_BDT: totalReturns },
      { Metric: 'Net Sales (প্রকৃত বিক্রয়)', Amount_BDT: netSales },
      { Metric: 'Cost of Goods Sold (COGS)', Amount_BDT: totalCogs },
      { Metric: 'Gross Profit (মোট মুনাফা)', Amount_BDT: grossProfit },
      { Metric: 'Operating Expenses (পরিচালন ব্যয়)', Amount_BDT: totalOpex },
      { Metric: 'Operating Profit (পরিচালন লাভ)', Amount_BDT: operatingProfit },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(pnlData);
    XLSX.utils.book_append_sheet(wb, ws, 'Profit_and_Loss');

    // Also export production yield
    const batchData = batches.map((b) => ({
      Batch_No: b.batchNumber,
      Product: b.productNameEn,
      Date: b.productionDate,
      Planned_Pcs: b.plannedQuantity,
      Saleable_Pcs: b.actualSaleableOutput,
      Yield_Pct: `${b.yieldPercentage}%`,
      Cost_Per_Piece: b.costPerPiece,
      Total_Batch_Cost: b.totalCost,
    }));
    const wsBatches = XLSX.utils.json_to_sheet(batchData);
    XLSX.utils.book_append_sheet(wb, wsBatches, 'Production_Yield');

    XLSX.writeFile(wb, `Khagan_Bakery_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.reports.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            লাভ-ক্ষতি (P&L), উৎপাদন ফলন, অপচয় বিশ্লেষণ ও এক্সেল রিপোর্ট এক্সপোর্ট
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportToExcel} size="sm" variant="outline" className="h-9 text-xs">
            <Download className="w-4 h-4 mr-1.5 text-[#176B45]" />
            <span>{t.reports.exportExcel}</span>
          </Button>
          <Button onClick={handlePrint} size="sm" className="h-9 text-xs bg-[#176B45]">
            <Printer className="w-4 h-4 mr-1.5" />
            <span>{t.reports.exportPdf}</span>
          </Button>
        </div>
      </div>

      {/* Date Filter Buttons */}
      <div className="flex items-center space-x-2">
        {(['today', 'week', 'month', 'all'] as const).map((period) => (
          <Button
            key={period}
            variant={dateFilter === period ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(period)}
            className="text-xs h-8 capitalize"
          >
            {period === 'today'
              ? 'আজকের (Today)'
              : period === 'week'
              ? 'চলতি সপ্তাহ'
              : period === 'month'
              ? 'চলতি মাস (Monthly)'
              : 'সার্বিক (All Time)'}
          </Button>
        ))}
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#176B45]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">প্রকৃত বিক্রয় (Net Sales)</p>
            <h3 className="text-2xl font-bold text-[#172B22] mt-1">
              {formatCurrency(netSales, locale)}
            </h3>
            <p className="text-[11px] text-[#5C7567] mt-1">মোট বিক্রয় হতে ছাড় বাদ দিয়ে</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">মোট লাভ (Gross Profit & Margin)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(grossProfit, locale)}
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">
              গ্রস মার্জিন: +{grossMarginPct}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">পরিচালন লাভ (Operating Profit)</p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">
              {formatCurrency(operatingProfit, locale)}
            </h3>
            <p className="text-[11px] text-blue-700 font-bold mt-1">
              অপারেটিং মার্জিন: +{operatingMarginPct}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Official Profit & Loss Statement Table */}
      <Card>
        <CardHeader className="py-4 bg-[#F7F9F8] border-b border-[#D1E2D7]">
          <CardTitle className="text-base flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-[#176B45]" />
            <span>খাগান লাইভ বেকারি — আয় ও ব্যয় হিসাব (P&L Income Statement)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {/* Revenue Section */}
                <tr className="bg-gray-50/60 font-bold text-[#172B22]">
                  <td className="py-2.5 px-4" colSpan={2}>
                    ১. বিক্রয় ও রাজস্ব (Revenue)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 text-[#5C7567]">মোট বিক্রয় (Gross Sales)</td>
                  <td className="py-2 px-6 text-right font-semibold text-[#172B22]">
                    {formatCurrency(grossSales, locale)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 text-[#5C7567]">বাদ: ছাড় (Less: Discounts)</td>
                  <td className="py-2 px-6 text-right text-rose-600 font-semibold">
                    -{formatCurrency(totalDiscounts, locale)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 text-[#5C7567]">বাদ: গ্রাহক রিটার্ন (Less: Returns)</td>
                  <td className="py-2 px-6 text-right text-rose-600 font-semibold">
                    -{formatCurrency(totalReturns, locale)}
                  </td>
                </tr>
                <tr className="bg-[#EAF5EE]/40 font-bold text-[#104C34]">
                  <td className="py-2.5 px-4">প্রকৃত বিক্রয় (Net Sales)</td>
                  <td className="py-2.5 px-6 text-right text-sm">
                    {formatCurrency(netSales, locale)}
                  </td>
                </tr>

                {/* Cost of Goods Sold */}
                <tr className="bg-gray-50/60 font-bold text-[#172B22]">
                  <td className="py-2.5 px-4" colSpan={2}>
                    ২. বিক্রিত পণ্যের ব্যয় (Cost of Goods Sold - COGS)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-8 text-[#5C7567]">
                    ব্যবহৃত কাঁচামাল ও উৎপাদন ব্যয় (Raw Ingredients & Direct Baking)
                  </td>
                  <td className="py-2 px-6 text-right text-rose-700 font-semibold">
                    -{formatCurrency(totalCogs, locale)}
                  </td>
                </tr>
                <tr className="bg-emerald-50 font-bold text-emerald-900">
                  <td className="py-2.5 px-4">মোট মুনাফা (Gross Profit)</td>
                  <td className="py-2.5 px-6 text-right text-sm text-emerald-800">
                    {formatCurrency(grossProfit, locale)}
                  </td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-gray-50/60 font-bold text-[#172B22]">
                  <td className="py-2.5 px-4" colSpan={2}>
                    ৩. পরিচালন ও ইউটিলিটি ব্যয় (Operating Expenses - OPEX)
                  </td>
                </tr>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-2 px-8 text-[#5C7567]">
                      {exp.notes || exp.paidTo}
                    </td>
                    <td className="py-2 px-6 text-right text-rose-700">
                      -{formatCurrency(exp.amount, locale)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 px-8 text-rose-600">
                    অপচয় ও নষ্ট পণ্যের আর্থিক ক্ষতি (Wastage & Spoilage Loss)
                  </td>
                  <td className="py-2 px-6 text-right text-rose-700 font-semibold">
                    -{formatCurrency(totalWasteLoss, locale)}
                  </td>
                </tr>
                <tr className="bg-rose-50/60 font-semibold text-rose-900">
                  <td className="py-2 px-4">সর্বমোট পরিচালন খরচ (Total OPEX)</td>
                  <td className="py-2 px-6 text-right">
                    -{formatCurrency(totalOpex + totalWasteLoss, locale)}
                  </td>
                </tr>

                {/* Final Net Operating Profit */}
                <tr className="bg-[#104C34] text-white font-black text-sm">
                  <td className="py-3 px-4">চূড়ান্ত পরিচালন মুনাফা (Net Operating Profit)</td>
                  <td className="py-3 px-6 text-right text-emerald-300 text-base">
                    {formatCurrency(operatingProfit - totalWasteLoss, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Production Yield Summary */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-[#176B45]" />
            <span>উৎপাদন ফলন ও কাঁচামাল দক্ষতা রিপোর্ট (Production Yield & Efficiency)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">ব্যাচ নম্বর</th>
                  <th className="py-2.5 px-3 font-semibold">পণ্য</th>
                  <th className="py-2.5 px-3 font-semibold">পরিকল্পিত সংখ্যা</th>
                  <th className="py-2.5 px-3 font-semibold">প্রকৃত বিক্রয়যোগ্য</th>
                  <th className="py-2.5 px-3 font-semibold">ফলন (Yield %)</th>
                  <th className="py-2.5 px-3 font-semibold">মোট ব্যাচ খরচ</th>
                  <th className="py-2.5 px-3 font-semibold">পিস প্রতি খরচ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#EAF5EE]/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#172B22]">
                      {b.batchNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#172B22]">
                      {locale === 'bn' ? b.productNameBn : b.productNameEn}
                    </td>
                    <td className="py-2.5 px-3 text-[#5C7567]">{b.plannedQuantity} পিস</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      {b.actualSaleableOutput} পিস
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#104C34]">{b.yieldPercentage}%</td>
                    <td className="py-2.5 px-3 font-semibold text-[#172B22]">
                      {formatCurrency(b.totalCost, locale)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#176B45]">
                      {formatCurrency(b.costPerPiece, locale)}
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

