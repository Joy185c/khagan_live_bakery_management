'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/types';
import {
  Receipt,
  Plus,
  Zap,
  Flame,
  Droplet,
  Home,
  Truck,
  Box,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminExpensesPage() {
  const { t, locale } = useTranslation();
  const { expenses, expenseCategories, addExpense } = useDatabase();
  const { currentUser } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(expenseCategories[0]?.id || '');
  const [amount, setAmount] = useState('1500');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'bkash' | 'nagad'>('cash');
  const [notes, setNotes] = useState('');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paidTo) return;

    addExpense({
      branchId: 'branch-khagan-01',
      voucherNumber: '',
      categoryId: selectedCatId,
      amount: Number(amount),
      paymentMethod,
      paidTo,
      expenseDate: new Date().toISOString().slice(0, 10),
      notes,
    });

    setIsAddModalOpen(false);
    setPaidTo('');
    setNotes('');
  };

  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.expenses.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            কারখানা ও দোকানের গ্যাস, বিদ্যুৎ, ভাড়া, পরিবহন ও প্যাকেজিং ভাউচার ট্র্যাকিং
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.expenses.addExpense}</span>
        </Button>
      </div>

      {/* Summary Total */}
      <div className="bg-[#104C34] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-200">মোট পরিচালন ব্যয় (Total OPEX)</p>
          <h2 className="text-2xl font-black mt-0.5">{formatCurrency(totalOperatingExpenses, locale)}</h2>
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-200 bg-white/10 px-3 py-1.5 rounded-xl">
          <Receipt className="w-4 h-4" />
          <span>মোট ভাউচার: {expenses.length} টি</span>
        </div>
      </div>

      {/* Expense Vouchers Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">পরিচালন খরচ ও ইউটিলিটি ভাউচার তালিকা</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ভাউচার নম্বর</th>
                  <th className="py-3 px-3 font-semibold">তারিখ</th>
                  <th className="py-3 px-3 font-semibold">খরচের খাত</th>
                  <th className="py-3 px-3 font-semibold">প্রাপক</th>
                  <th className="py-3 px-3 font-semibold">টাকার পরিমাণ</th>
                  <th className="py-3 px-3 font-semibold">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-3 font-semibold">বিবরণ / নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {expenses.map((exp) => {
                  const cat = expenseCategories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">
                        {exp.voucherNumber}
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">{formatDate(exp.expenseDate, locale)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF5EE] text-[#104C34]">
                          {locale === 'bn' ? cat?.nameBn : cat?.nameEn}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#172B22]">{exp.paidTo}</td>
                      <td className="py-3 px-3 font-bold text-rose-700 text-sm">
                        {formatCurrency(exp.amount, locale)}
                      </td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-[#5C7567]">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">{exp.notes || '—'}</td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#5C7567] text-xs">
                      {locale === 'bn' ? 'কোনো খরচের ভাউচার রেকর্ড পাওয়া যায়নি।' : 'No expense records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন খরচ বা ভাউচার এন্ট্রি"
        description="খরচের খাত, প্রাপকের নাম এবং টাকার পরিমাণ লিপিবদ্ধ করুন।"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">খরচের খাত *</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn} ({c.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="টাকার পরিমাণ (৳) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label="প্রাপকের নাম *"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="যেমন: ডেসকো বিদ্যুৎ বিল"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">পেমেন্ট মাধ্যম</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              <option value="cash">নগদ ক্যাশ (Cash)</option>
              <option value="bkash">বিকাশ (bKash)</option>
              <option value="nagad">নগদ (Nagad)</option>
              <option value="bank">ব্যাংক একাউন্ট (Bank Transfer)</option>
            </select>
          </div>

          <Input
            label="বিবরণ / ভাউচার নোট"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="যেমন: কারখানা ওভেনের জন্য ২টি গ্যাস সিলিন্ডার ক্রয়"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              ভাউচার সংরক্ষণ করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

