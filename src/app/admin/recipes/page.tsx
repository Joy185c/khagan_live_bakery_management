'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency } from '@/lib/utils';
import { Recipe, RecipeIngredient } from '@/types';
import {
  BookOpen,
  Plus,
  Scale,
  DollarSign,
  Layers,
  Info,
  Clock,
  Trash2,
  ChefHat,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminRecipesPage() {
  const { t, locale } = useTranslation();
  const { recipes, products, rawMaterials } = useDatabase();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Recipe Form
  const [recipeNameBn, setRecipeNameBn] = useState('');
  const [recipeNameEn, setRecipeNameEn] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [expectedCount, setExpectedCount] = useState('50');
  const [expectedWeightKg, setExpectedWeightKg] = useState('20.0');
  const [laborCost, setLaborCost] = useState('250');
  const [overheadCost, setOverheadCost] = useState('150');
  const [ingredients, setIngredients] = useState<{ rawMaterialId: string; quantity: number }[]>([
    { rawMaterialId: 'rm-flour', quantity: 12.5 },
    { rawMaterialId: 'rm-sugar', quantity: 1.5 },
    { rawMaterialId: 'rm-milk', quantity: 6.0 },
  ]);

  const activeVersion = selectedRecipe?.activeVersion;

  // Calculate live ingredient costs for selected recipe
  const rawCostTotal =
    activeVersion?.ingredients.reduce((sum, item) => {
      const rm = rawMaterials.find((m) => m.id === item.rawMaterialId);
      const unitCost = rm ? rm.avgCostPerUnit : item.costSnapshot;
      return sum + unitCost * item.quantity;
    }, 0) || 0;

  const totalBatchCost =
    rawCostTotal + (activeVersion?.laborCostPerBatch || 0) + (activeVersion?.overheadCostPerBatch || 0);

  const costPerPiece =
    activeVersion && activeVersion.expectedOutputCount > 0
      ? totalBatchCost / activeVersion.expectedOutputCount
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.recipes.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            প্রমিত উৎপাদন কাঠামো (BOM), কাঁচামালের সঠিক অনুপাত ও সংস্করণ নিয়ন্ত্রণ
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.recipes.addRecipe}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recipe List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-[#172B22] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#176B45]" />
            <span>বিদ্যমান রেসিপিসমূহ ({recipes.length})</span>
          </h3>

          <div className="space-y-2">
            {recipes.map((r) => {
              const isSelected = selectedRecipe?.id === r.id;
              const prod = products.find((p) => p.id === r.productId);

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecipe(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#176B45] bg-[#EAF5EE] shadow-xs ring-1 ring-[#176B45]'
                      : 'border-[#D1E2D7] bg-white hover:bg-[#F7F9F8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#172B22]">
                      {locale === 'bn' ? r.nameBn : r.nameEn}
                    </h4>
                    <Badge variant="default">v{r.activeVersion?.versionNumber || 1}</Badge>
                  </div>
                  <p className="text-[11px] text-[#5C7567] mt-1">
                    পণ্য: <strong>{locale === 'bn' ? prod?.nameBn : prod?.nameEn}</strong>
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#176B45] font-semibold">
                    <span>প্রত্যাশিত আউটপুট: {r.expectedOutputCount} পিস</span>
                    <span>ওজন: {r.expectedOutputWeightKg} কেজি</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recipe Detail & BOM Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRecipe ? (
            <>
              {/* Cost Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-[#EAF5EE]/60 border-[#176B45]/20">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] text-[#5C7567]">কাঁচামাল খরচ (Raw Cost)</p>
                    <p className="text-lg font-bold text-[#176B45] mt-0.5">
                      {formatCurrency(rawCostTotal, locale)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#EAF5EE]/60 border-[#176B45]/20">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] text-[#5C7567]">মোট ব্যাচ খরচ (Total Cost)</p>
                    <p className="text-lg font-bold text-[#104C34] mt-0.5">
                      {formatCurrency(totalBatchCost, locale)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-300">
                  <CardContent className="p-3.5">
                    <p className="text-[11px] text-[#5C7567]">পিস প্রতি খরচ (Cost / Pc)</p>
                    <p className="text-lg font-bold text-emerald-800 mt-0.5">
                      {formatCurrency(costPerPiece, locale)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recipe Specifications Card */}
              <Card>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {locale === 'bn' ? selectedRecipe.nameBn : selectedRecipe.nameEn}
                      </CardTitle>
                      <p className="text-xs text-[#5C7567] mt-0.5">
                        কার্যকরী তারিখ: {activeVersion?.effectiveDate || '2026-10-01'} | প্রমিত অপচয়:{' '}
                        {selectedRecipe.standardWastePct}%
                      </p>
                    </div>
                    <Badge variant="success">সক্রিয় সংস্করণ (v{activeVersion?.versionNumber})</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Notes / Description */}
                  {activeVersion?.notes && (
                    <div className="p-3 rounded-lg bg-[#F7F9F8] border border-[#D1E2D7] text-xs text-[#5C7567] flex items-start space-x-2">
                      <Info className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                      <span>{activeVersion.notes}</span>
                    </div>
                  )}

                  {/* Bill of Materials Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                        <tr>
                          <th className="py-2.5 px-3">কাঁচামালের নাম</th>
                          <th className="py-2.5 px-3">প্রয়োজনীয় পরিমাণ</th>
                          <th className="py-2.5 px-3">একক মূল্য</th>
                          <th className="py-2.5 px-3 text-right">মোট কাঁচামাল ব্যয়</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1E2D7]/60">
                        {activeVersion?.ingredients.map((ing) => {
                          const rm = rawMaterials.find((m) => m.id === ing.rawMaterialId);
                          const unitPrice = rm ? rm.avgCostPerUnit : ing.costSnapshot;
                          const lineCost = unitPrice * ing.quantity;

                          return (
                            <tr key={ing.id} className="hover:bg-[#EAF5EE]/30">
                              <td className="py-2.5 px-3 font-semibold text-[#172B22]">
                                {rm ? (locale === 'bn' ? rm.nameBn : rm.nameEn) : 'কাঁচামাল'}
                                <span className="block text-[10px] text-[#5C7567]">
                                  {rm?.code || 'RM'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-[#104C34]">
                                {ing.quantity} {ing.unitId.replace('u-', '')}
                              </td>
                              <td className="py-2.5 px-3 text-[#5C7567]">
                                {formatCurrency(unitPrice, locale)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#172B22]">
                                {formatCurrency(lineCost, locale)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Overheads & Labor Details */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D1E2D7] text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-[#F7F9F8]">
                      <span className="text-[#5C7567]">শ্রম ব্যয় (Labor per Batch):</span>
                      <span className="font-semibold text-[#172B22]">
                        {formatCurrency(activeVersion?.laborCostPerBatch || 0, locale)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-[#F7F9F8]">
                      <span className="text-[#5C7567]">ওভারহেড ও গ্যাস বিল (Overheads):</span>
                      <span className="font-semibold text-[#172B22]">
                        {formatCurrency(activeVersion?.overheadCostPerBatch || 0, locale)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-[#5C7567]">
              কোনো রেসিপি নির্বাচন করা হয়নি।
            </div>
          )}
        </div>
      </div>

      {/* Add Recipe Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন রেসিপি ও বিওএম তৈরি করুন"
        description="পণ্য নির্বাচন করে প্রমিত ব্যাচ আকার, কাঁচামালের পরিমাণ এবং ব্যয় নির্ধারণ করুন।"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="রেসিপির নাম (বাংলা) *"
              value={recipeNameBn}
              onChange={(e) => setRecipeNameBn(e.target.value)}
              placeholder="যেমন: স্পেশাল বাটার কুকিজ রেসিপি"
            />
            <Input
              label="Recipe Name (English) *"
              value={recipeNameEn}
              onChange={(e) => setRecipeNameEn(e.target.value)}
              placeholder="e.g. Special Butter Cookies Recipe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">লক্ষ্য পণ্য (Target Product)</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameBn} ({p.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="প্রত্যাশিত সংখ্যা (পিস) *"
              type="number"
              value={expectedCount}
              onChange={(e) => setExpectedCount(e.target.value)}
            />
            <Input
              label="প্রত্যাশিত মোট ওজন (কেজি) *"
              type="number"
              value={expectedWeightKg}
              onChange={(e) => setExpectedWeightKg(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ব্যাচ শ্রম ব্যয় (৳)"
              type="number"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
            />
            <Input
              label="ইউটিলিটি ও গ্যাস ব্যয় (৳)"
              type="number"
              value={overheadCost}
              onChange={(e) => setOverheadCost(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button
              size="sm"
              onClick={() => {
                alert('নতুন রেসিপি সফলভাবে সংরক্ষিত হয়েছে!');
                setIsAddModalOpen(false);
              }}
            >
              সংরক্ষণ করুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

