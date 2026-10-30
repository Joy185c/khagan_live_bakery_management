'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function ShopWastePage() {
  const { t, locale } = useTranslation();
  const { products, wasteRecords, recordWaste, getShopAvailableStock } = useDatabase();
  const { currentUser } = useAuth();

  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('2');
  const [reason, setReason] = useState('মেয়াদোত্তীর্ণ / বাসি হয়ে গেছে');

  const handleRecordWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(wasteQty);
    if (qty <= 0) return;

    const available = getShopAvailableStock(selectedProductId);
    if (available < qty) {
      alert(`কাউন্টারে পর্যাপ্ত মজুত নেই! উপলব্ধ: ${available} পিস`);
      return;
    }

    recordWaste({
      locationId: 'loc-shop-01',
      itemType: 'product',
      itemId: selectedProductId,
      quantity: qty,
      reason,
      actorId: currentUser.id,
    });

    setIsWasteModalOpen(false);
    alert('নষ্ট পণ্যের বিবরণ সফলভাবে ইনভেন্টরি ও অপচয় লেজারে লিপিবদ্ধ করা হয়েছে।');
  };

  const totalWasteLoss = wasteRecords.reduce((sum, w) => sum + w.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.shopWaste}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            দোকান কাউন্টারের নষ্ট, বাসি বা ক্ষতিগ্রস্ত পণ্যের হিসাব এবং লেজার ট্র্যাকিং
          </p>
        </div>
        <Button onClick={() => setIsWasteModalOpen(true)} size="sm" variant="danger" className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>নষ্ট পণ্য নথিভুক্ত করুন</span>
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between text-rose-950">
        <div>
          <p className="text-xs font-semibold text-rose-700">দোকান অপচয় বাবদ মোট ক্ষতি (Total Spoilage Loss)</p>
          <h2 className="text-2xl font-bold mt-1 text-rose-800">{formatCurrency(totalWasteLoss, locale)}</h2>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>
      </div>

      {/* Waste Records Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">সাম্প্রতিক অপচয় ও নষ্ট পণ্যের রেকর্ড ({wasteRecords.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {wasteRecords.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#5C7567]">
              দোকান কাউন্টারে বর্তমানে কোনো নষ্ট পণ্যের রেকর্ড নেই।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">রেকর্ড নম্বর</th>
                    <th className="py-3 px-3 font-semibold">তারিখ ও সময়</th>
                    <th className="py-3 px-3 font-semibold">পণ্যের নাম</th>
                    <th className="py-3 px-3 font-semibold">নষ্ট সংখ্যা</th>
                    <th className="py-3 px-3 font-semibold">একক ব্যয়</th>
                    <th className="py-3 px-3 font-semibold">মোট আর্থিক ক্ষতি</th>
                    <th className="py-3 px-3 font-semibold">কারণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {wasteRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-rose-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">{w.wasteNumber}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{formatDateTime(w.createdAt, locale)}</td>
                      <td className="py-3 px-3 font-bold text-[#172B22]">{w.itemName}</td>
                      <td className="py-3 px-3 font-bold text-rose-600 font-mono">{w.quantity} পিস</td>
                      <td className="py-3 px-3 text-[#5C7567]">{formatCurrency(w.unitCost, locale)}</td>
                      <td className="py-3 px-3 font-bold text-rose-700">
                        {formatCurrency(w.totalCost, locale)}
                      </td>
                      <td className="py-3 px-3 text-[#172B22]">{w.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Waste Modal */}
      <Modal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        title="নষ্ট / বাসি পণ্য নিবন্ধন"
        description="পণ্য নির্বাচন করুন এবং কারণ উল্লেখ করুন। সংরক্ষণ করা মাত্র কাউন্টার স্টক হতে এটি বাদ দেওয়া হবে।"
      >
        <form onSubmit={handleRecordWaste} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">পণ্য নির্বাচন করুন *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {products.map((p) => {
                const stock = getShopAvailableStock(p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.nameBn} (কাউন্টারে আছে: {stock} পিস)
                  </option>
                );
              })}
            </select>
          </div>

          <Input
            label="নষ্ট সংখ্যা (পিস) *"
            type="number"
            value={wasteQty}
            onChange={(e) => setWasteQty(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">অপচয় / নষ্টের কারণ *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              <option value="মেয়াদোত্তীর্ণ / বাসি হয়ে গেছে">মেয়াদোত্তীর্ণ / বাসি হয়ে গেছে</option>
              <option value="হাত থেকে পড়ে নষ্ট হয়েছে">হাত থেকে পড়ে নষ্ট হয়েছে</option>
              <option value="প্যাকেজিং ছেঁড়া বা ভাঙা">প্যাকেজিং ছেঁড়া বা ভাঙা</option>
              <option value="পোড়া / বিক্রয় অনুপযোগী">পোড়া / বিক্রয় অনুপযোগী</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsWasteModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" variant="danger" size="sm">
              নিশ্চিত করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

