'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency } from '@/lib/utils';
import { Recipe, RecipeIngredient, Product } from '@/types';
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
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminRecipesPage() {
  const { t, locale } = useTranslation();
  const { recipes, products, rawMaterials, addRecipe, addProduct } = useDatabase();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Recipe Form State
  const [recipeNameBn, setRecipeNameBn] = useState('');
  const [recipeNameEn, setRecipeNameEn] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);

  const [expectedCount, setExpectedCount] = useState('50');
  const [expectedWeightKg, setExpectedWeightKg] = useState('20.0');
  const [laborCost, setLaborCost] = useState('250');
  const [overheadCost, setOverheadCost] = useState('150');
  const [ingredients, setIngredients] = useState<{ rawMaterialId: string; name: string; quantity: number; unitCost: number }[]>([
    { rawMaterialId: 'rm-flour', name: 'ময়দা (Flour)', quantity: 12.5, unitCost: 60 },
    { rawMaterialId: 'rm-sugar', name: 'চিনি (Sugar)', quantity: 1.5, unitCost: 130 },
    { rawMaterialId: 'rm-milk', name: 'দুধ (Milk)', quantity: 6.0, unitCost: 90 },
  ]);

  // Keep selected recipe in sync
  useEffect(() => {
    if (!selectedRecipe && recipes.length > 0) {
      setSelectedRecipe(recipes[0]);
    } else if (selectedRecipe) {
      const found = recipes.find((r) => r.id === selectedRecipe.id);
      if (found) setSelectedRecipe(found);
    }
  }, [recipes, selectedRecipe]);

  // Set default product when modal opens
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const activeVersion = selectedRecipe?.activeVersion;

  // Calculate live ingredient costs for selected recipe
  const rawCostTotal =
    activeVersion?.ingredients?.reduce((sum, item) => {
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

  const handleOpenAddModal = () => {
    setRecipeNameBn('');
    setRecipeNameEn('');
    setNewProductName('');
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setIsCreatingNewProduct(false);
    } else {
      setIsCreatingNewProduct(true);
    }
    setExpectedCount('50');
    setExpectedWeightKg('20.0');
    setLaborCost('250');
    setOverheadCost('150');
    setIsAddModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { rawMaterialId: `rm-custom-${Date.now()}`, name: 'নতুন উপকরণ', quantity: 1, unitCost: 50 },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeNameBn.trim()) {
      alert('অনুগ্রহ করে রেসিপির নাম (বাংলা) লিখুন।');
      return;
    }

    let targetProdId = selectedProductId;

    // If creating a new product on the fly
    if (isCreatingNewProduct || !targetProdId) {
      const prodName = newProductName.trim() || recipeNameBn.trim();
      const createdProd = addProduct({
        branchId: 'branch-khagan-01',
        sku: `PRD-${Date.now().toString().slice(-4)}`,
        nameBn: prodName,
        nameEn: recipeNameEn.trim() || prodName,
        categoryId: 'cat-bread',
        unitId: 'u-pcs',
        standardPieceWeightG: Math.round((Number(expectedWeightKg) * 1000) / (Number(expectedCount) || 1)),
        sellingPrice: Math.round(((Number(laborCost) + Number(overheadCost) + 500) / (Number(expectedCount) || 1)) * 1.5),
        costPrice: Math.round((Number(laborCost) + Number(overheadCost) + 500) / (Number(expectedCount) || 1)),
        shelfLifeDays: 3,
        isActive: true,
      });
      targetProdId = createdProd.id;
    }

    const versionIngredients: RecipeIngredient[] = ingredients.map((ing, idx) => ({
      id: `ri-${Date.now()}-${idx}`,
      recipeVersionId: `rv-${Date.now()}`,
      rawMaterialId: ing.rawMaterialId,
      quantity: Number(ing.quantity) || 1,
      unitId: 'u-kg',
      costSnapshot: Number(ing.unitCost) || 50,
    }));

    const created = addRecipe({
      productId: targetProdId,
      nameBn: recipeNameBn.trim(),
      nameEn: recipeNameEn.trim() || recipeNameBn.trim(),
      standardBatchSize: 1,
      expectedOutputCount: Number(expectedCount) || 50,
      expectedOutputWeightKg: Number(expectedWeightKg) || 20.0,
      standardWastePct: 2.0,
      isActive: true,
      activeVersion: {
        id: `rv-${Date.now()}`,
        recipeId: '',
        versionNumber: 1,
        expectedOutputCount: Number(expectedCount) || 50,
        expectedOutputWeightKg: Number(expectedWeightKg) || 20.0,
        laborCostPerBatch: Number(laborCost) || 0,
        overheadCostPerBatch: Number(overheadCost) || 0,
        effectiveDate: new Date().toISOString().slice(0, 10),
        ingredients: versionIngredients,
      },
    });

    setSelectedRecipe(created);
    setIsAddModalOpen(false);
    setToastMessage(`"${created.nameBn}" রেসিপি সফলভাবে তৈরি ও সংরক্ষিত হয়েছে!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
        <Button size="sm" onClick={handleOpenAddModal} className="h-9 text-xs bg-[#176B45] hover:bg-[#104C34] text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.recipes.addRecipe}</span>
        </Button>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recipe List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-[#172B22] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#176B45]" />
            <span>বিদ্যমান রেসিপিসমূহ ({recipes.length})</span>
          </h3>

          <div className="space-y-2">
            {recipes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D1E2D7] space-y-2">
                <ChefHat className="w-8 h-8 text-[#5C7567]/50 mx-auto" />
                <p className="text-xs text-[#5C7567] font-medium">কোনো রেসিপি তৈরি করা হয়নি।</p>
                <Button size="sm" variant="outline" onClick={handleOpenAddModal} className="text-xs mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>প্রথম রেসিপি যোগ করুন</span>
                </Button>
              </div>
            ) : (
              recipes.map((r) => {
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
                      পণ্য: <strong>{prod ? (locale === 'bn' ? prod.nameBn : prod.nameEn) : r.nameBn}</strong>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#176B45] font-semibold">
                      <span>প্রত্যাশিত আউটপুট: {r.expectedOutputCount} পিস</span>
                      <span>ওজন: {r.expectedOutputWeightKg} কেজি</span>
                    </div>
                  </div>
                );
              })
            )}
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

              {/* Recipe Version Details & Ingredients Table */}
              <Card>
                <CardHeader className="pb-3 border-b border-[#D1E2D7]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-[#172B22]">
                        {locale === 'bn' ? selectedRecipe.nameBn : selectedRecipe.nameEn}
                      </CardTitle>
                      <p className="text-xs text-[#5C7567] mt-0.5">
                        প্রমিত ব্যাচ আউটপুট: {selectedRecipe.expectedOutputCount} পিস ({selectedRecipe.expectedOutputWeightKg} কেজি) | স্ট্যান্ডার্ড অপচয়: {selectedRecipe.standardWastePct}%
                      </p>
                    </div>
                    <Badge variant="success">সক্রিয় ফর্মুলা</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-xs text-[#172B22]">
                    <thead className="bg-[#F7F9F8] border-b border-[#D1E2D7] text-[#5C7567] font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">কাঁচামাল</th>
                        <th className="py-2.5 px-4">পরিমাণ (পরিমাপ)</th>
                        <th className="py-2.5 px-4">দর (৳)</th>
                        <th className="py-2.5 px-4 text-right">উপকরণ মোট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1E2D7]">
                      {activeVersion?.ingredients && activeVersion.ingredients.length > 0 ? (
                        activeVersion.ingredients.map((ing) => {
                          const rm = rawMaterials.find((m) => m.id === ing.rawMaterialId);
                          const name = rm ? (locale === 'bn' ? rm.nameBn : rm.nameEn) : 'উপকরণ';
                          const unitCost = rm ? rm.avgCostPerUnit : ing.costSnapshot;
                          const lineTotal = unitCost * ing.quantity;

                          return (
                            <tr key={ing.id} className="hover:bg-[#F7F9F8]/50">
                              <td className="py-2.5 px-4 font-medium">{name}</td>
                              <td className="py-2.5 px-4">
                                {ing.quantity} {rm?.baseUnitId?.replace('u-', '') || 'কেজি'}
                              </td>
                              <td className="py-2.5 px-4">{formatCurrency(unitCost, locale)}</td>
                              <td className="py-2.5 px-4 text-right font-bold text-[#176B45]">
                                {formatCurrency(lineTotal, locale)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[#5C7567]">
                            কোনো উপকরণ তালিকাভুক্ত নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-[#F7F9F8] font-bold border-t border-[#D1E2D7]">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-4 text-right">
                          মোট কাঁচামাল খরচ:
                        </td>
                        <td className="py-2.5 px-4 text-right text-[#176B45]">
                          {formatCurrency(rawCostTotal, locale)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#D1E2D7] rounded-2xl bg-white text-[#5C7567] text-xs space-y-2">
              <BookOpen className="w-8 h-8 text-[#5C7567]/40" />
              <span>কোনো রেসিপি নির্বাচন করা হয়নি।</span>
            </div>
          )}
        </div>
      </div>

      {/* Add New Recipe Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন রেসিপি ও বিওএম তৈরি করুন"
      >
        <form onSubmit={handleSaveRecipe} className="space-y-4 pt-2">
          <p className="text-xs text-[#5C7567]">
            পণ্য নির্বাচন করে প্রমিত ব্যাচ আকার, কাঁচামালের পরিমাণ এবং ব্যয় নির্ধারণ করুন।
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="রেসিপির নাম (বাংলা) *"
              required
              placeholder="উদাঃ স্পেশাল মিল্ক ব্রেড"
              value={recipeNameBn}
              onChange={(e) => setRecipeNameBn(e.target.value)}
            />
            <Input
              label="Recipe Name (English) *"
              placeholder="e.g. Special Milk Bread"
              value={recipeNameEn}
              onChange={(e) => setRecipeNameEn(e.target.value)}
            />
          </div>

          {/* Target Product Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#172B22]">লক্ষ্য পণ্য (Target Product) *</label>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewProduct(!isCreatingNewProduct)}
                  className="text-[11px] text-[#176B45] hover:underline font-semibold"
                >
                  {isCreatingNewProduct ? 'বিদ্যমান পণ্য থেকে বাছুন' : '+ নতুন পণ্য তৈরি করুন'}
                </button>
              )}
            </div>

            {isCreatingNewProduct || products.length === 0 ? (
              <div className="space-y-1 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-medium">
                  {products.length === 0 ? 'বেকারিতে এখনও কোনো পণ্য যুক্ত নেই। রেসিপির সাথে স্বয়ংক্রিয়ভাবে পণ্যটি তৈরি হয়ে যাবে:' : 'নতুন পণ্যের নাম লিখুন:'}
                </span>
                <Input
                  placeholder="উদাঃ স্পেশাল মিল্ক ব্রেড ৪০০ গ্রাম"
                  value={newProductName || recipeNameBn}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>
            ) : (
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
            )}
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

          {/* Ingredients Sub-form */}
          <div className="space-y-2 border-t border-[#D1E2D7] pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172B22]">কাঁচামাল ও ফর্মুলা অনুপাত (Ingredients)</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredientRow} className="h-7 text-[11px] px-2">
                <Plus className="w-3 h-3 mr-1" />
                <span>উপকরণ যোগ করুন</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Input
                    placeholder="উপকরণের নাম"
                    value={ing.name}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].name = e.target.value;
                      setIngredients(updated);
                    }}
                    className="text-xs h-8 flex-1"
                  />
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="কেজি/একক"
                      value={ing.quantity}
                      onChange={(e) => {
                        const updated = [...ingredients];
                        updated[idx].quantity = Number(e.target.value);
                        setIngredients(updated);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="দর (৳)"
                      value={ing.unitCost}
                      onChange={(e) => {
                        const updated = [...ingredients];
                        updated[idx].unitCost = Number(e.target.value);
                        setIngredients(updated);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button size="sm" type="submit" className="bg-[#176B45] hover:bg-[#104C34] text-white">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
