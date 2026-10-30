'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import {
  Package,
  Plus,
  Search,
  Filter,
  History,
  Archive,
  Barcode,
  Check,
  Edit2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminProductsPage() {
  const { t, locale } = useTranslation();
  const { products, categories, addProduct, updateProduct, getShopAvailableStock, getWarehouseAvailableStock } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('cat-bread');
  const [sellingPrice, setSellingPrice] = useState('85');
  const [costPrice, setCostPrice] = useState('48');
  const [standardWeightG, setStandardWeightG] = useState('400');
  const [shelfLifeDays, setShelfLifeDays] = useState('3');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameBn.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameBn('');
    setNameEn('');
    setSku(`PRD-${Date.now().toString().slice(-4)}`);
    setBarcode(`89411${Date.now().toString().slice(-6)}`);
    setSellingPrice('100');
    setCostPrice('60');
    setStandardWeightG('250');
    setShelfLifeDays('3');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNameBn(p.nameBn);
    setNameEn(p.nameEn);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setCategoryId(p.categoryId);
    setSellingPrice(String(p.sellingPrice));
    setCostPrice(String(p.costPrice));
    setStandardWeightG(String(p.standardPieceWeightG || '0'));
    setShelfLifeDays(String(p.shelfLifeDays));
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn || !nameEn || !sku) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        nameBn,
        nameEn,
        sku,
        barcode,
        categoryId,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice),
        standardPieceWeightG: Number(standardWeightG),
        shelfLifeDays: Number(shelfLifeDays),
      });
    } else {
      addProduct({
        branchId: 'branch-khagan-01',
        sku,
        barcode,
        nameBn,
        nameEn,
        categoryId,
        unitId: 'u-pcs',
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice),
        standardPieceWeightG: Number(standardWeightG),
        shelfLifeDays: Number(shelfLifeDays),
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
        isActive: true,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleToggleActive = (p: Product) => {
    updateProduct(p.id, { isActive: !p.isActive });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.products.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            বেকারির সকল উৎপাদিত পণ্য, বিক্রয়মূল্য, কস্ট প্রাইস ও ক্যাটালগ পরিচালনা
          </p>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.products.addProduct}</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C7567] absolute left-3 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পণ্য, এসকেইউ বা বারকোড খুঁজুন..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="h-8 text-xs shrink-0"
            >
              সব ক্যাটাগরি
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={selectedCategory === c.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(c.id)}
                className="h-8 text-xs shrink-0"
              >
                {locale === 'bn' ? c.nameBn : c.nameEn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">পণ্য ও এসকেইউ</th>
                  <th className="py-3 px-3 font-semibold">ক্যাটাগরি</th>
                  <th className="py-3 px-3 font-semibold">প্রমিত ওজন</th>
                  <th className="py-3 px-3 font-semibold">বিক্রয় মূল্য</th>
                  <th className="py-3 px-3 font-semibold">উৎপাদন ব্যয় (Cost)</th>
                  <th className="py-3 px-3 font-semibold">মার্জিন (%)</th>
                  <th className="py-3 px-3 font-semibold">মজুত (গুদাম / কাউন্টার)</th>
                  <th className="py-3 px-3 font-semibold">মেয়াদ</th>
                  <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {filteredProducts.map((p) => {
                  const whStock = getWarehouseAvailableStock(p.id);
                  const shopStock = getShopAvailableStock(p.id);
                  const marginPct =
                    p.sellingPrice > 0
                      ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr key={p.id} className="hover:bg-[#EAF5EE]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg bg-[#EAF5EE] border border-[#D1E2D7] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.nameEn} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-[#176B45]" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#172B22] text-xs">
                              {locale === 'bn' ? p.nameBn : p.nameEn}
                            </p>
                            <p className="text-[10px] text-[#5C7567] font-mono">
                              SKU: {p.sku} {p.barcode && `| Barcode: ${p.barcode}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#172B22]">
                        <span className="px-2 py-0.5 rounded-md bg-[#EAF5EE] text-[#104C34] text-[11px] font-medium">
                          {categories.find((c) => c.id === p.categoryId)?.nameBn || 'সাধারণ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#172B22]">
                        {p.standardPieceWeightG ? `${p.standardPieceWeightG} গ্রাম` : '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#176B45]">
                        {formatCurrency(p.sellingPrice, locale)}
                      </td>
                      <td className="py-3 px-3 text-[#5C7567] font-semibold">
                        {formatCurrency(p.costPrice, locale)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-medium text-[#104C34]">
                            গুদাম: <strong>{whStock}</strong>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-[11px] font-medium text-emerald-700">
                            দোকান: <strong>{shopStock}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">{p.shelfLifeDays} দিন</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="h-7 w-7 p-0 text-[#176B45] hover:bg-[#EAF5EE]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(p)}
                            className={`h-7 px-2 text-[10px] ${
                              p.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {p.isActive ? 'আর্কাইভ' : 'সক্রিয়'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যুক্ত করুন'}
        description="পণ্যের বাংলা ও ইংরেজি নাম, প্রমিত ওজন, বিক্রয় মূল্য এবং ক্যাটাগরি নির্ধারণ করুন।"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="পণ্যের নাম (বাংলা) *"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: স্পেশাল মিল্ক ব্রেড"
              required
            />
            <Input
              label="Product Name (English) *"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Special Milk Bread"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="এসকেইউ (SKU Code) *"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <Input
              label="বারকোড (Barcode / EAN)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">ক্যাটাগরি</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn} ({c.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="বিক্রয় মূল্য (Selling Price ৳) *"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
            <Input
              label="উৎপাদন প্রাক্কলিত ব্যয় (Cost Price ৳)"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="প্রমিত ওজন (গ্রাম - Std Weight g)"
              type="number"
              value={standardWeightG}
              onChange={(e) => setStandardWeightG(e.target.value)}
            />
            <Input
              label="মেয়াদকাল (দিন - Shelf Life Days)"
              type="number"
              value={shelfLifeDays}
              onChange={(e) => setShelfLifeDays(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
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
