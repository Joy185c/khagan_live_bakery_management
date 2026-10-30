'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ProductionBatch } from '@/types';
import {
  ChefHat,
  Plus,
  CheckCircle2,
  Clock,
  Scale,
  DollarSign,
  AlertCircle,
  Eye,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminProductionPage() {
  const { t, locale } = useTranslation();
  const { batches, recipes, products, rawMaterials, createProductionBatch, approveProductionBatch } = useDatabase();
  const { currentUser, canApproveBatches } = useAuth();

  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [approvalModalBatch, setApprovalModalBatch] = useState<ProductionBatch | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Batch Form State
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id || '');
  const [shift, setShift] = useState('Morning');
  const [plannedQty, setPlannedQty] = useState('50');
  const [actualQty, setActualQty] = useState('48');
  const [rejectedQty, setRejectedQty] = useState('2');
  const [actualWeightKg, setActualWeightKg] = useState('19.2');
  const [remarks, setRemarks] = useState('');

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return;

    const targetProduct = products.find((p) => p.id === recipe.productId);

    // Build batch inputs from recipe version
    const inputs = recipe.activeVersion?.ingredients.map((ing) => {
      const rm = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      const unitCost = rm ? rm.avgCostPerUnit : ing.costSnapshot;
      return {
        id: `in-${Date.now()}-${ing.rawMaterialId}`,
        batchId: '',
        rawMaterialId: ing.rawMaterialId,
        plannedQuantity: ing.quantity,
        actualQuantity: ing.quantity,
        unitId: ing.unitId,
        unitCost,
        totalCost: unitCost * ing.quantity,
      };
    });

    const rawCost = inputs?.reduce((sum, i) => sum + i.totalCost, 0) || 2185.0;

    const newBatch = createProductionBatch({
      recipeVersionId: recipe.activeVersion?.id || 'rec-ver-mb-01',
      recipeName: recipe.nameBn,
      productNameEn: targetProduct?.nameEn || 'Special Milk Bread 400g',
      productNameBn: targetProduct?.nameBn || 'স্পেশাল মিল্ক ব্রেড ৪০০ গ্রাম',
      shift,
      operatorId: currentUser.id,
      plannedQuantity: Number(plannedQty),
      actualSaleableOutput: Number(actualQty),
      rejectedQuantity: Number(rejectedQty),
      actualOutputWeightKg: Number(actualWeightKg),
      rawMaterialCost: rawCost,
      laborCost: recipe.activeVersion?.laborCostPerBatch || 250,
      utilityCost: recipe.activeVersion?.overheadCostPerBatch || 150,
      remarks,
      inputs,
    });

    setIsNewBatchModalOpen(false);
    setSuccessToast(`নতুন ব্যাচ ${newBatch.batchNumber} সফলভাবে প্রস্তুত করা হয়েছে!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleApprove = (batch: ProductionBatch) => {
    const result = approveProductionBatch(batch.id, currentUser.id);
    if (result.success) {
      setApprovalModalBatch(null);
      setSuccessToast(
        `ব্যাচ ${batch.batchNumber} সফলভাবে অনুমোদিত হয়েছে! কাঁচামাল স্টক কর্তন এবং তৈরি পণ্য গুদামে জমা হয়েছে।`
      );
      setTimeout(() => setSuccessToast(null), 5000);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top">
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
          <h1 className="text-2xl font-bold text-[#172B22]">{t.production.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            ব্যাচভিত্তিক উৎপাদন, পারমাণবিক ইনভেন্টরি কর্তন ও ফলন (Yield) বিশ্লেষণ
          </p>
        </div>
        <Button onClick={() => setIsNewBatchModalOpen(true)} size="sm" className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.production.newBatch}</span>
        </Button>
      </div>

      {/* Yield & Efficiency Highlight Card */}
      <div className="bg-[#104C34] text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm">উৎপাদন ফলন ও প্রমিত ওজনের তুলনা (Yield & Variance Rule)</h3>
          </div>
          <span className="text-[11px] bg-emerald-900/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
            রিয়েল-টাইম ট্র্যাকিং
          </span>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          মাস্টার প্ল্যান নিয়ম: যদি ১০ কেজি কাঁচামাল দিয়ে প্রথম দিন ১০ পিস এবং দ্বিতীয় দিন ১২ পিস উৎপাদিত হয়, তবে ফলন (+২০%) হলেও প্রমিত পিস ওজন ও উপাদানের অনুপাত অপরিবর্তিত আছে কিনা সিস্টেম তা সতর্ক করে।
        </p>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">দৈনিক উৎপাদন ব্যাচসমূহ ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ব্যাচ নম্বর ও তারিখ</th>
                  <th className="py-3 px-3 font-semibold">পণ্য ও রেসিপি</th>
                  <th className="py-3 px-3 font-semibold">শিফট</th>
                  <th className="py-3 px-3 font-semibold">পরিকল্পিত সংখ্যা</th>
                  <th className="py-3 px-3 font-semibold">বিক্রয়যোগ্য সংখ্যা</th>
                  <th className="py-3 px-3 font-semibold">বাতিল / অপচয়</th>
                  <th className="py-3 px-3 font-semibold">ফলন (Yield %)</th>
                  <th className="py-3 px-3 font-semibold">পিস প্রতি ব্যয়</th>
                  <th className="py-3 px-3 font-semibold">অবস্থা</th>
                  <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#EAF5EE]/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-[#172B22]">{b.batchNumber}</p>
                      <p className="text-[10px] text-[#5C7567]">{b.productionDate}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#172B22]">
                        {locale === 'bn' ? b.productNameBn : b.productNameEn}
                      </p>
                      <p className="text-[10px] text-[#5C7567]">{b.recipeName}</p>
                    </td>
                    <td className="py-3 px-3 text-[#172B22]">{b.shift}</td>
                    <td className="py-3 px-3 font-semibold text-[#172B22]">{b.plannedQuantity} পিস</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{b.actualSaleableOutput} পিস</td>
                    <td className="py-3 px-3 text-rose-600 font-semibold">{b.rejectedQuantity} পিস</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          b.yieldPercentage >= 95 ? 'text-emerald-700' : 'text-amber-600'
                        }`}
                      >
                        {b.yieldPercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#172B22]">
                      {formatCurrency(b.costPerPiece, locale)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={b.status === 'Approved' ? 'success' : 'default'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.status === 'Approved' ? (
                        <div className="flex items-center justify-end text-[11px] text-emerald-700 font-semibold space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অনুমোদিত</span>
                        </div>
                      ) : canApproveBatches ? (
                        <Button
                          size="sm"
                          onClick={() => setApprovalModalBatch(b)}
                          className="h-7 text-xs bg-[#176B45] hover:bg-[#104C34]"
                        >
                          অনুমোদন করুন
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#5C7567]">অনুমোদনাধীন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Approval Confirmation Modal */}
      {approvalModalBatch && (
        <Modal
          isOpen={true}
          onClose={() => setApprovalModalBatch(null)}
          title={`ব্যাচ অনুমোদন ও পোস্টিং — ${approvalModalBatch.batchNumber}`}
          description="অনুমোদনের পর কাঁচামাল স্বয়ংক্রিয়ভাবে ইনভেন্টরি থেকে হ্রাস পাবে এবং সমাপ্ত পণ্য গুদাম মজুতে যুক্ত হবে।"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>পারমাণবিক ডেটাবেজ লেনদেন (Atomic Transaction)</span>
              </p>
              <p>
                অনুমোদনের সাথে সাথে ইনভেন্টরি লেজারে `production_issue` এবং `finished_production_receipt` পোস্ট হবে। ডাবল পোস্টিং প্রতিরোধ সুরক্ষিত।
              </p>
            </div>

            {/* Consumption and Output Preview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#D1E2D7] space-y-2">
                <p className="font-bold text-[#172B22]">কাঁচামাল কর্তন (Inputs):</p>
                {approvalModalBatch.inputs?.map((inp) => (
                  <div key={inp.id} className="flex justify-between text-[#5C7567]">
                    <span>
                      {rawMaterials.find((m) => m.id === inp.rawMaterialId)?.nameBn || 'উপাদান'}
                    </span>
                    <strong className="text-rose-600">
                      -{inp.actualQuantity} {inp.unitId.replace('u-', '')}
                    </strong>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-[#D1E2D7] flex justify-between font-bold text-[#172B22]">
                  <span>মোট কাঁচামাল খরচ:</span>
                  <span>{formatCurrency(approvalModalBatch.rawMaterialCost, locale)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#D1E2D7] space-y-2">
                <p className="font-bold text-[#172B22]">সমাপ্ত পণ্য প্রাপ্তি (Finished Goods):</p>
                <div className="flex justify-between text-[#5C7567]">
                  <span>বিক্রয়যোগ্য সংখ্যা:</span>
                  <strong className="text-emerald-700">+{approvalModalBatch.actualSaleableOutput} পিস</strong>
                </div>
                <div className="flex justify-between text-[#5C7567]">
                  <span>প্রকৃত ওজন:</span>
                  <strong>{approvalModalBatch.actualOutputWeightKg} কেজি</strong>
                </div>
                <div className="flex justify-between text-[#5C7567]">
                  <span>উৎপাদন ফলন (Yield):</span>
                  <strong className="text-emerald-700">{approvalModalBatch.yieldPercentage}%</strong>
                </div>
                <div className="pt-1.5 border-t border-[#D1E2D7] flex justify-between font-bold text-[#172B22]">
                  <span>চূড়ান্ত পিস প্রতি ব্যয়:</span>
                  <span className="text-[#176B45]">
                    {formatCurrency(approvalModalBatch.costPerPiece, locale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
              <Button variant="outline" size="sm" onClick={() => setApprovalModalBatch(null)}>
                বাতিল
              </Button>
              <Button size="sm" onClick={() => handleApprove(approvalModalBatch)}>
                নিশ্চিত অনুমোদন ও পোস্টিং &rarr;
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Batch Wizard Modal */}
      <Modal
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        title="নতুন উৎপাদন ব্যাচ তৈরি করুন"
        description="রেসিপি নির্বাচন করুন এবং উৎপাদনের পরিমাণ ও শিফট নির্ধারণ করুন।"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">রেসিপি নির্বাচন করুন *</label>
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameBn} ({r.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172B22]">শিফট (Shift) *</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
              >
                <option value="Morning">সকাল (Morning Shift)</option>
                <option value="Evening">সন্ধ্যা (Evening Shift)</option>
                <option value="Night">রাত (Night Baking)</option>
              </select>
            </div>
            <Input
              label="পরিকল্পিত সংখ্যা (Planned Pcs) *"
              type="number"
              value={plannedQty}
              onChange={(e) => setPlannedQty(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="প্রকৃত বিক্রয়যোগ্য সংখ্যা *"
              type="number"
              value={actualQty}
              onChange={(e) => setActualQty(e.target.value)}
              required
            />
            <Input
              label="বাতিল / অপচয় সংখ্যা"
              type="number"
              value={rejectedQty}
              onChange={(e) => setRejectedQty(e.target.value)}
            />
            <Input
              label="মোট ওজন (কেজি)"
              type="number"
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(e.target.value)}
            />
          </div>

          <Input
            label="উৎপাদন মন্তব্য / ওভেন তাপমাত্রা বা ব্যাচ নোট"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="যেমন: ডেক ওভেন ২০০ ডিগ্রি সেলসিয়াসে বেক করা হয়েছে।"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewBatchModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              ব্যাচ প্রস্তুত করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
