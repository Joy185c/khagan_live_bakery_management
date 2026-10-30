'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Sale } from '@/types';
import {
  ShoppingCart,
  Search,
  Eye,
  RotateCcw,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminSalesPage() {
  const { t, locale } = useTranslation();
  const { sales } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter((s) => {
    return (
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalGrossSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCogs = sales.reduce((sum, s) => sum + s.totalCogs, 0);
  const totalGrossProfit = totalGrossSales - totalCogs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.sales}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            সার্বিক বিক্রয় নজরদারি, ইনভয়েস নিরীক্ষা, পেমেন্ট ব্রেকডাউন এবং কস্ট বিশ্লেষণ
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[#176B45]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">সর্বমোট বিক্রয় (Gross Sales)</p>
            <h3 className="text-2xl font-bold text-[#172B22] mt-1">
              {formatCurrency(totalGrossSales, locale)}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">বিক্রিত পণ্যের ব্যয় (Total COGS)</p>
            <h3 className="text-2xl font-bold text-amber-800 mt-1">
              {formatCurrency(totalCogs, locale)}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#5C7567]">মোট মুনাফা (Gross Margin)</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(totalGrossProfit, locale)}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C7567] absolute left-3 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ইনভয়েস, ক্রেতা বা ক্যাশিয়ার খুঁজুন..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ইনভয়েস নম্বর</th>
                  <th className="py-3 px-3 font-semibold">তারিখ ও সময়</th>
                  <th className="py-3 px-3 font-semibold">ক্যাশিয়ার</th>
                  <th className="py-3 px-3 font-semibold">ক্রেতা</th>
                  <th className="py-3 px-3 font-semibold">বিক্রয় মূল্য</th>
                  <th className="py-3 px-3 font-semibold">COGS ব্যয়</th>
                  <th className="py-3 px-3 font-semibold">প্রফিট</th>
                  <th className="py-3 px-3 font-semibold">পেমেন্ট মেথড</th>
                  <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {filteredSales.map((s) => {
                  const profit = s.grandTotal - s.totalCogs;
                  return (
                    <tr key={s.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">
                        {s.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">
                        {formatDateTime(s.createdAt, locale)}
                      </td>
                      <td className="py-3 px-3 text-[#172B22] font-semibold">{s.cashierName}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{s.customerName}</td>
                      <td className="py-3 px-3 font-bold text-[#176B45]">
                        {formatCurrency(s.grandTotal, locale)}
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">
                        {formatCurrency(s.totalCogs, locale)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {formatCurrency(profit, locale)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF5EE] text-[#104C34]">
                          {s.payments[0]?.paymentMethod || 'cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSale(s)}
                          className="h-7 text-xs text-[#176B45] hover:bg-[#EAF5EE]"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>বিস্তারিত</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSale(null)}
          title={`ইনভয়েস বিস্তারিত — ${selectedSale.invoiceNumber}`}
          description={`ক্যাশিয়ার: ${selectedSale.cashierName} | সময়: ${formatDateTime(selectedSale.createdAt, locale)}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-2.5 px-3">পণ্যের নাম</th>
                    <th className="py-2.5 px-3">পরিমাণ</th>
                    <th className="py-2.5 px-3">বিক্রয় মূল্য</th>
                    <th className="py-2.5 px-3">উৎপাদন ব্যয় (COGS)</th>
                    <th className="py-2.5 px-3 text-right">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {selectedSale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-bold text-[#172B22]">
                        {locale === 'bn' ? item.productNameBn : item.productNameEn}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{item.quantity} পিস</td>
                      <td className="py-2.5 px-3 text-[#176B45]">
                        {formatCurrency(item.unitPrice, locale)}
                      </td>
                      <td className="py-2.5 px-3 text-[#5C7567]">
                        {formatCurrency(item.unitCogs, locale)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#172B22]">
                        {formatCurrency(item.totalPrice, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EAF5EE] flex justify-between items-center text-xs">
              <div>
                <p className="text-[#5C7567]">পেমেন্ট মাধ্যম:</p>
                <p className="font-bold text-[#104C34] uppercase">
                  {selectedSale.payments[0]?.paymentMethod || 'cash'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#5C7567]">সর্বমোট প্রাপ্তি:</p>
                <p className="text-lg font-bold text-[#176B45]">
                  {formatCurrency(selectedSale.grandTotal, locale)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedSale(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
