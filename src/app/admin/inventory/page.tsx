'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Boxes,
  ArrowRightLeft,
  Sliders,
  History,
  AlertTriangle,
  Plus,
  Send,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminInventoryPage() {
  const { t, locale } = useTranslation();
  const {
    rawMaterials,
    products,
    locations,
    inventoryLots,
    inventoryMovements,
    transfers,
    dispatchStockTransfer,
    receiveStockTransfer,
    addRawMaterial,
    getWarehouseAvailableStock,
    getShopAvailableStock,
  } = useDatabase();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'raw' | 'finished' | 'transfers' | 'ledger'>('raw');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

  // Transfer Form State
  const [transferProductId, setTransferProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState('20');
  const [fromLocId, setFromLocId] = useState('loc-wh-01');
  const [toLocId, setToLocId] = useState('loc-shop-01');

  React.useEffect(() => {
    if ((!transferProductId || !products.some((p) => p.id === transferProductId)) && products.length > 0) {
      setTransferProductId(products[0].id);
    }
  }, [products, transferProductId]);

  // New Raw Material Form State
  const [rmNameBn, setRmNameBn] = useState('');
  const [rmNameEn, setRmNameEn] = useState('');
  const [rmCode, setRmCode] = useState(`RM-${Date.now().toString().slice(-4)}`);
  const [rmCategory, setRmCategory] = useState('Flour & Grains');
  const [rmStock, setRmStock] = useState('50');
  const [rmCost, setRmCost] = useState('75');
  const [rmReorder, setRmReorder] = useState('15');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(transferQty);
    if (qty <= 0) return;

    const availableAtSource = getWarehouseAvailableStock(transferProductId);
    if (availableAtSource < qty) {
      alert(`গুদামে পর্যাপ্ত স্টক নেই! উপলব্ধ: ${availableAtSource} পিস`);
      return;
    }

    dispatchStockTransfer(
      fromLocId,
      toLocId,
      [{ productId: transferProductId, quantity: qty }],
      currentUser.id
    );

    setIsTransferModalOpen(false);
    alert('স্টক স্থানান্তর সফলভাবে প্রেরণ (Dispatched) হয়েছে! দোকান কাউন্টারে এটি রিসিভ করা যাবে।');
  };

  const handleReceiveTransfer = (transferId: string) => {
    receiveStockTransfer(transferId, currentUser.id);
    alert('হস্তান্তরকৃত স্টক দোকান কাউন্টারে সফলভাবে যুক্ত হয়েছে!');
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmNameBn || !rmNameEn) return;

    addRawMaterial({
      branchId: 'branch-khagan-01',
      code: rmCode,
      nameBn: rmNameBn,
      nameEn: rmNameEn,
      category: rmCategory,
      baseUnitId: 'u-kg',
      purchaseUnitId: 'u-kg',
      conversionRatio: 1,
      currentStock: Number(rmStock),
      avgCostPerUnit: Number(rmCost),
      reorderPoint: Number(rmReorder),
      shelfLifeDays: 90,
      storageLocation: 'Dry Storage',
      isActive: true,
    });

    setIsAddMaterialModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.inventory.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            কাঁচামাল ও তৈরি পণ্যের সামগ্রিক মজুত, ইন্টার-লোকেশন স্থানান্তর এবং অপরিবর্তনীয় লেজার
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddMaterialModalOpen(true)} size="sm" variant="outline" className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>নতুন কাঁচামাল</span>
          </Button>
          <Button onClick={() => setIsTransferModalOpen(true)} size="sm" className="h-9 text-xs">
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />
            <span>স্টক স্থানান্তর</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#D1E2D7] pb-2">
        <Button
          variant={activeTab === 'raw' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('raw')}
          className="text-xs"
        >
          কাঁচামাল মজুত ({rawMaterials.length})
        </Button>
        <Button
          variant={activeTab === 'finished' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('finished')}
          className="text-xs"
        >
          তৈরি পণ্য ও লট ({inventoryLots.length})
        </Button>
        <Button
          variant={activeTab === 'transfers' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('transfers')}
          className="text-xs"
        >
          স্থানান্তর ট্র্যাকিং ({transfers.length})
        </Button>
        <Button
          variant={activeTab === 'ledger' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('ledger')}
          className="text-xs"
        >
          ইনভেন্টরি লেজার ({inventoryMovements.length})
        </Button>
      </div>

      {/* Tab 1: Raw Materials */}
      {activeTab === 'raw' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">কাঁচামাল কোড ও নাম</th>
                    <th className="py-3 px-3 font-semibold">ক্যাটাগরি</th>
                    <th className="py-3 px-3 font-semibold">বর্তমান মজুত</th>
                    <th className="py-3 px-3 font-semibold">পুনঃক্রয় সীমা</th>
                    <th className="py-3 px-3 font-semibold">একক ক্রয়মূল্য</th>
                    <th className="py-3 px-3 font-semibold">মোট মূল্যমান</th>
                    <th className="py-3 px-3 font-semibold">সংরক্ষণ স্থান</th>
                    <th className="py-3 px-3 font-semibold">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {rawMaterials.map((rm) => {
                    const isLow = rm.currentStock <= rm.reorderPoint;
                    const totalVal = rm.currentStock * rm.avgCostPerUnit;

                    return (
                      <tr key={rm.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-3 px-4 font-semibold text-[#172B22]">
                          <p>{locale === 'bn' ? rm.nameBn : rm.nameEn}</p>
                          <span className="text-[10px] text-[#5C7567] font-mono">{rm.code}</span>
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">{rm.category}</td>
                        <td className="py-3 px-3 font-mono font-bold text-sm">
                          <span className={isLow ? 'text-rose-600' : 'text-[#104C34]'}>
                            {rm.currentStock} {rm.baseUnitId.replace('u-', '')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">
                          {rm.reorderPoint} {rm.baseUnitId.replace('u-', '')}
                        </td>
                        <td className="py-3 px-3 text-[#172B22]">
                          {formatCurrency(rm.avgCostPerUnit, locale)}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#176B45]">
                          {formatCurrency(totalVal, locale)}
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">{rm.storageLocation || 'Main Kitchen'}</td>
                        <td className="py-3 px-3">
                          <Badge variant={isLow ? 'danger' : 'success'}>
                            {isLow ? 'কম মজুত' : 'পর্যাপ্ত'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Finished Goods & Lots */}
      {activeTab === 'finished' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">লট নম্বর ও পণ্য</th>
                    <th className="py-3 px-3 font-semibold">লোকেশন</th>
                    <th className="py-3 px-3 font-semibold">প্রারম্ভিক সংখ্যা</th>
                    <th className="py-3 px-3 font-semibold">বর্তমান মজুত</th>
                    <th className="py-3 px-3 font-semibold">পিস প্রতি উৎপাদন ব্যয়</th>
                    <th className="py-3 px-3 font-semibold">মেয়াদ উত্তীর্ণের তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {inventoryLots.map((lot) => {
                    const prod = products.find((p) => p.id === lot.itemId);
                    const loc = locations.find((l) => l.id === lot.locationId);

                    return (
                      <tr key={lot.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#172B22]">
                            {locale === 'bn' ? prod?.nameBn : prod?.nameEn}
                          </p>
                          <span className="text-[10px] text-[#5C7567] font-mono">{lot.lotNumber}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF5EE] text-[#104C34]">
                            {loc?.name.split('(')[0] || 'লোকেশন'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">{lot.initialQuantity} পিস</td>
                        <td className="py-3 px-3 font-mono font-bold text-sm text-emerald-800">
                          {lot.currentQuantity} পিস
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#172B22]">
                          {formatCurrency(lot.unitCost, locale)}
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">{lot.expiryDate || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Inter-Location Transfers */}
      {activeTab === 'transfers' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">শাখা ও কাউন্টার স্টক স্থানান্তর ট্র্যাকিং</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transfers.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#5C7567]">
                বর্তমানে কোনো স্টক স্থানান্তর রেকর্ড নেই। উপরের "স্টক স্থানান্তর" বাটনে ক্লিক করে গুদাম থেকে দোকানে পণ্য পাঠান।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">হস্তান্তর নম্বর</th>
                      <th className="py-3 px-3 font-semibold">উৎস হতে গন্তব্য</th>
                      <th className="py-3 px-3 font-semibold">পণ্য ও পরিমাণ</th>
                      <th className="py-3 px-3 font-semibold">প্রেরণের সময়</th>
                      <th className="py-3 px-3 font-semibold">অবস্থা</th>
                      <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1E2D7]/60">
                    {transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-3 px-4 font-mono font-bold text-[#172B22]">
                          {trf.transferNumber}
                        </td>
                        <td className="py-3 px-3 text-[#172B22]">
                          <span className="font-semibold text-rose-700">গুদাম</span> &rarr;{' '}
                          <span className="font-semibold text-emerald-700">দোকান কাউন্টার</span>
                        </td>
                        <td className="py-3 px-3">
                          {trf.items.map((i) => (
                            <div key={i.id} className="font-medium text-[#172B22]">
                              {i.itemName}: <strong>{i.quantityRequested} পিস</strong>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">
                          {formatDateTime(trf.dispatchedAt || trf.createdAt, locale)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={trf.status === 'Received' ? 'success' : 'warning'}>
                            {trf.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {trf.status === 'Dispatched' && (
                            <Button
                              size="sm"
                              onClick={() => handleReceiveTransfer(trf.id)}
                              className="h-7 text-xs bg-[#176B45]"
                            >
                              রিসিভ নিশ্চিত করুন
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Immutable Movement Ledger */}
      {activeTab === 'ledger' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">অপরিবর্তনীয় ইনভেন্টরি মুভমেন্ট লেজার (Immutable Ledger)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inventoryMovements.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#5C7567]">
                লেজারে এখনও কোনো ট্রানজ্যাকশন পোস্ট হয়নি। ব্যাচ অনুমোদন বা স্টক স্থানান্তর করলে স্বয়ংক্রিয়ভাবে লেজার তৈরি হবে।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">তারিখ ও সময়</th>
                      <th className="py-3 px-3 font-semibold">মুভমেন্টের ধরণ</th>
                      <th className="py-3 px-3 font-semibold">পণ্য / কাঁচামাল</th>
                      <th className="py-3 px-3 font-semibold">পরিমাণ</th>
                      <th className="py-3 px-3 font-semibold">একক মূল্য</th>
                      <th className="py-3 px-3 font-semibold">মোট মূল্য</th>
                      <th className="py-3 px-3 font-semibold">নোট / রেফারেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1E2D7]/60">
                    {inventoryMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-3 px-4 text-[#5C7567]">
                          {formatDateTime(mov.createdAt, locale)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono px-2 py-0.5 rounded text-[10px] bg-[#EAF5EE] text-[#104C34] font-semibold">
                            {mov.movementType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#172B22]">
                          {mov.itemName || mov.itemId}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sm text-[#104C34]">
                          {mov.quantity}
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">
                          {formatCurrency(mov.unitCost, locale)}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#172B22]">
                          {formatCurrency(mov.totalCost, locale)}
                        </td>
                        <td className="py-3 px-3 text-[#5C7567]">{mov.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="গুদাম হতে দোকান কাউন্টারে স্টক স্থানান্তর"
        description="পণ্য ও সংখ্যা নির্ধারণ করুন। প্রেরণের পর গুদাম হতে হ্রাস পাবে এবং দোকানে রিসিভ হবে।"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">স্থানান্তরযোগ্য পণ্য *</label>
            <select
              value={transferProductId}
              onChange={(e) => setTransferProductId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {products.map((p) => {
                const whStock = getWarehouseAvailableStock(p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.nameBn} (গুদাম মজুত: {whStock} পিস)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172B22]">উৎস লোকেশন</label>
              <input
                disabled
                value="প্রধান গুদাম (loc-wh-01)"
                className="w-full h-10 px-3 text-xs rounded-lg border border-[#D1E2D7] bg-gray-50 text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172B22]">গন্তব্য লোকেশন</label>
              <input
                disabled
                value="দোকান কাউন্টার (loc-shop-01)"
                className="w-full h-10 px-3 text-xs rounded-lg border border-[#D1E2D7] bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <Input
            label="স্থানান্তরের সংখ্যা (পিস) *"
            type="number"
            value={transferQty}
            onChange={(e) => setTransferQty(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              প্রেরণ নিশ্চিত করুন (Dispatch) &rarr;
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Raw Material Modal */}
      <Modal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        title="নতুন কাঁচামাল নিবন্ধন"
        description="কাঁচামালের নাম, কোড, একক ক্রয়মূল্য ও পুনঃক্রয় সীমা নির্ধারণ করুন।"
      >
        <form onSubmit={handleAddMaterial} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="কাঁচামালের নাম (বাংলা) *"
              value={rmNameBn}
              onChange={(e) => setRmNameBn(e.target.value)}
              placeholder="যেমন: কোকো পাউডার"
              required
            />
            <Input
              label="Material Name (English) *"
              value={rmNameEn}
              onChange={(e) => setRmNameEn(e.target.value)}
              placeholder="e.g. Cocoa Powder"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="কোড (Item Code) *"
              value={rmCode}
              onChange={(e) => setRmCode(e.target.value)}
              required
            />
            <Input
              label="ক্যাটাগরি"
              value={rmCategory}
              onChange={(e) => setRmCategory(e.target.value)}
              placeholder="Flour, Dairy, etc."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="প্রারম্ভিক মজুত (কেজি)"
              type="number"
              value={rmStock}
              onChange={(e) => setRmStock(e.target.value)}
            />
            <Input
              label="একক মূল্য (৳ / কেজি)"
              type="number"
              value={rmCost}
              onChange={(e) => setRmCost(e.target.value)}
            />
            <Input
              label="পুনঃক্রয় সীমা (কেজি)"
              type="number"
              value={rmReorder}
              onChange={(e) => setRmReorder(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMaterialModalOpen(false)}>
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

