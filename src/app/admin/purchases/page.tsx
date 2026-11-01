'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Supplier, Purchase } from '@/types';
import {
  Truck,
  Plus,
  DollarSign,
  Phone,
  MapPin,
  CheckCircle2,
  PackagePlus,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminPurchasesPage() {
  const { t, locale } = useTranslation();
  const {
    suppliers,
    rawMaterials,
    recordPurchase,
    addSupplier,
  } = useDatabase();
  const { currentUser } = useAuth();

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('50'); // 50 kg as per Scenario 1
  const [unitPrice, setUnitPrice] = useState('60');

  React.useEffect(() => {
    if ((!selectedSupplierId || !suppliers.some((s) => s.id === selectedSupplierId)) && suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
    if ((!selectedMaterialId || !rawMaterials.some((m) => m.id === selectedMaterialId)) && rawMaterials.length > 0) {
      setSelectedMaterialId(rawMaterials[0].id);
    }
  }, [suppliers, rawMaterials, selectedSupplierId, selectedMaterialId]);

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleRecordPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('অনুগ্রহ করে একটি সরবরাহকারী নির্বাচন করুন।');
      return;
    }
    if (!selectedMaterialId) {
      alert('অনুগ্রহ করে একটি কাঁচামাল নির্বাচন করুন।');
      return;
    }
    const qty = Number(purchaseQty);
    const price = Number(unitPrice);
    if (qty <= 0 || price <= 0) return;

    recordPurchase({
      supplierId: selectedSupplierId,
      rawMaterialId: selectedMaterialId,
      quantity: qty,
      unitPrice: price,
      destinationLocationId: 'loc-wh-01',
      actorId: currentUser.id,
    });

    const mat = rawMaterials.find((m) => m.id === selectedMaterialId);
    setIsPurchaseModalOpen(false);
    setSuccessToast(
      `ক্রয় সফল! ${qty} কেজি ${mat?.nameBn || 'কাঁচামাল'} গুদাম স্টকে যুক্ত হয়েছে এবং সরবরাহকারীর ব্যালেন্স আপডেট হয়েছে।`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;

    addSupplier({
      branchId: 'branch-khagan-01',
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      address: supAddress,
      openingBalance: 0,
      currentBalance: 0,
      isActive: true,
    });

    setIsAddSupplierModalOpen(false);
  };

  const totalPayableToSuppliers = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.purchases}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            কাঁচামাল ক্রয়, সরবরাহকারীর বাকি হিসাব এবং স্বয়ংক্রিয় মজুত রিসিভ
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddSupplierModalOpen(true)} size="sm" variant="outline" className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>নতুন সরবরাহকারী</span>
          </Button>
          <Button onClick={() => setIsPurchaseModalOpen(true)} size="sm" className="h-9 text-xs">
            <PackagePlus className="w-4 h-4 mr-1.5" />
            <span>কাঁচামাল ক্রয় চালান</span>
          </Button>
        </div>
      </div>

      {/* Total Payable Summary Card */}
      <div className="bg-[#176B45] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-100 font-medium">সকল সরবরাহকারীর মোট দেনা (Total Payable Balance)</p>
          <h2 className="text-2xl font-bold mt-1">{formatCurrency(totalPayableToSuppliers, locale)}</h2>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-black/20 text-xs font-semibold text-emerald-200">
          সাপ্লায়ার সংখ্যা: {suppliers.length} টি
        </div>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">নিবন্ধিত সরবরাহকারী তালিকা ও ব্যালেন্স</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">প্রতিষ্ঠানের নাম</th>
                  <th className="py-3 px-3 font-semibold">যোগাযোগ ব্যক্তি</th>
                  <th className="py-3 px-3 font-semibold">ফোন নম্বর</th>
                  <th className="py-3 px-3 font-semibold">ঠিকানা</th>
                  <th className="py-3 px-3 font-semibold">বর্তমান বাকি (Payable)</th>
                  <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#EAF5EE]/40">
                    <td className="py-3 px-4 font-bold text-[#172B22]">{s.name}</td>
                    <td className="py-3 px-3 text-[#5C7567]">{s.contactPerson || '—'}</td>
                    <td className="py-3 px-3 text-[#172B22] font-mono">{s.phone}</td>
                    <td className="py-3 px-3 text-[#5C7567]">{s.address || '—'}</td>
                    <td className="py-3 px-3 font-bold text-rose-700 text-sm">
                      {formatCurrency(s.currentBalance, locale)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSupplierId(s.id);
                          setIsPurchaseModalOpen(true);
                        }}
                        className="h-7 text-xs"
                      >
                        নতুন ক্রয় চালান
                      </Button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#5C7567] text-xs">
                      {locale === 'bn' ? 'কোনো সরবরাহকারী পাওয়া যায়নি।' : 'No suppliers registered.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="কাঁচামাল ক্রয় ও চালান গ্রহণ (Goods Receipt)"
        description="চালান সংরক্ষণ করা মাত্র কাঁচামাল স্টকে স্বয়ংক্রিয়ভাবে যুক্ত হবে (যেমন: ৫০ কেজি ময়দা বৃদ্ধি পাবে)।"
      >
        <form onSubmit={handleRecordPurchase} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">সরবরাহকারী প্রতিষ্ঠান *</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (বর্তমান বাকি: {formatCurrency(s.currentBalance, locale)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">কাঁচামাল নির্বাচন করুন *</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                const mat = rawMaterials.find((m) => m.id === e.target.value);
                if (mat) setUnitPrice(String(mat.avgCostPerUnit));
              }}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {rawMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameBn} ({m.nameEn}) — বর্তমান মজুত: {m.currentStock} {m.baseUnitId.replace('u-', '')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ক্রয়ের পরিমাণ (কেজি) *"
              type="number"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              required
            />
            <Input
              label="একক ক্রয়মূল্য (৳ / কেজি) *"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-[#EAF5EE] text-xs flex justify-between font-bold text-[#104C34]">
            <span>মোট চালান মূল্য:</span>
            <span>{formatCurrency(Number(purchaseQty) * Number(unitPrice), locale)}</span>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              চালান গ্রহণ ও স্টক বৃদ্ধি করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        title="নতুন সরবরাহকারী নিবন্ধন"
        description="সরবরাহকারী প্রতিষ্ঠানের নাম, ফোন নম্বর এবং যোগাযোগের তথ্য যোগ করুন।"
      >
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <Input
            label="সরবরাহকারী প্রতিষ্ঠানের নাম *"
            value={supName}
            onChange={(e) => setSupName(e.target.value)}
            placeholder="যেমন: মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="যোগাযোগের ব্যক্তি (Contact Person)"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
              placeholder="যেমন: মোঃ জাহিদ হাসান"
            />
            <Input
              label="ফোন নম্বর *"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              placeholder="01712-000000"
              required
            />
          </div>

          <Input
            label="কারখানা / অফিসের ঠিকানা"
            value={supAddress}
            onChange={(e) => setSupAddress(e.target.value)}
            placeholder="যেমন: পোস্তগোলা, ঢাকা"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddSupplierModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

