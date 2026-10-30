'use client';

import React, { useState, useId } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Product, CartItem, Sale } from '@/types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function ShopPosPage() {
  const { t, locale } = useTranslation();
  const {
    products,
    categories,
    activeCashSession,
    getShopAvailableStock,
    processPOSSale,
    openCashShift,
  } = useDatabase();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'card' | 'split'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState('সাধারণ ক্রেতা');
  const [customerPhone, setCustomerPhone] = useState('');

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cart operations
  const addToCart = (product: Product) => {
    const available = getShopAvailableStock(product.id);
    if (available <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= available) {
          alert(`সর্বোচ্চ উপলব্ধ মজুত (${available} পিস) কার্টে যোগ করা হয়েছে।`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, discount: 0, availableStock: available }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const available = getShopAvailableStock(productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > available) {
              alert(`দোকানে সর্বোচ্চ ${available} পিস মজুত রয়েছে!`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const totalPayable = Math.max(0, subtotal - discountAmount);
  const tenderedNumeric = Number(paidAmount) || 0;
  const changeDue = Math.max(0, tenderedNumeric - totalPayable);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameBn.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return p.isActive && matchesCat && matchesSearch;
  });

  const handleOpenCheckout = () => {
    if (!activeCashSession) {
      alert('বিক্রয় শুরু করার আগে দয়া করে ক্যাশ শিফট চালু করুন।');
      return;
    }
    if (cart.length === 0) return;
    setPaidAmount(String(totalPayable));
    setIsCheckoutModalOpen(true);
  };

  const handleCompleteSale = () => {
    setErrorMessage(null);
    const idempotencyKey = `sale-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const result = processPOSSale({
      cart,
      paymentMethod,
      paidAmount: tenderedNumeric,
      discountAmount,
      customerName,
      customerPhone,
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      idempotencyKey,
    });

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setIsCheckoutModalOpen(false);
      clearCart();
      setIsReceiptModalOpen(true);
    } else {
      setErrorMessage(result.message || 'বিক্রয় সম্পন্ন হতে ব্যর্থ হয়েছে।');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Shift Alert if shift is closed */}
      {!activeCashSession && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">ক্যাশ শিফট চালু করা নেই (Shift Closed)</p>
              <p className="text-[11px] text-amber-700">
                বিক্রয় ট্রানজ্যাকশন ও ক্যাশ ড্রয়ার হিসাব মেলানোর জন্য শিফট চালু করা বাধ্যতামূলক।
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => openCashShift(2000, currentUser.id, currentUser.fullName)}
            className="text-xs bg-[#176B45]"
          >
            ৳২,০০০ ফ্লোট দিয়ে শিফট খুলুন
          </Button>
        </div>
      )}

      {/* POS Grid: Left Products / Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Products & Search */}
        <div className="lg:col-span-2 space-y-3">
          {/* Top Search & Category Pills */}
          <div className="bg-white p-3 rounded-xl border border-[#D1E2D7] shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5C7567] absolute left-3 top-3" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.pos.searchPlaceholder}
                className="pl-9 h-10 text-xs bg-[#F7F9F8]"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#176B45] text-white shadow-xs'
                    : 'bg-[#F7F9F8] text-[#172B22] hover:bg-[#EAF5EE]'
                }`}
              >
                সব পণ্য ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-[#176B45] text-white shadow-xs'
                      : 'bg-[#F7F9F8] text-[#172B22] hover:bg-[#EAF5EE]'
                  }`}
                >
                  {locale === 'bn' ? c.nameBn : c.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const shopStock = getShopAvailableStock(p.id);
              const inStock = shopStock > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => inStock && addToCart(p)}
                  className={`bg-white rounded-xl border p-3 flex flex-col justify-between select-none transition-all ${
                    inStock
                      ? 'border-[#D1E2D7] hover:border-[#176B45] hover:shadow-md cursor-pointer active:scale-98'
                      : 'border-gray-200 opacity-60 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-[#EAF5EE] flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-[#176B45]" />
                      )}
                      <span
                        className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inStock ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {inStock ? `${shopStock} টি` : 'স্টক শেষ'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#172B22] line-clamp-1 leading-tight">
                        {locale === 'bn' ? p.nameBn : p.nameEn}
                      </h4>
                      <p className="text-[10px] text-[#5C7567] mt-0.5">
                        {p.standardPieceWeightG ? `${p.standardPieceWeightG}g` : 'Standard'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#D1E2D7]/60 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#176B45]">
                      {formatCurrency(p.sellingPrice, locale)}
                    </span>
                    <button
                      disabled={!inStock}
                      className="w-7 h-7 rounded-lg bg-[#EAF5EE] text-[#176B45] hover:bg-[#176B45] hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Shopping Cart Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between border-[#D1E2D7] shadow-sm sticky top-20">
            {/* Cart Header */}
            <CardHeader className="py-3 px-4 border-b border-[#D1E2D7] bg-[#F7F9F8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-[#176B45]" />
                  <CardTitle className="text-sm">{t.pos.cart}</CardTitle>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                  >
                    খালি করুন
                  </button>
                )}
              </div>
            </CardHeader>

            {/* Cart Items List */}
            <div className="p-3 flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-420px)]">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#5C7567] space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs">{t.pos.emptyCart}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl border border-[#D1E2D7] bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-xs text-[#172B22] truncate">
                        {locale === 'bn' ? item.product.nameBn : item.product.nameEn}
                      </p>
                      <p className="text-[11px] text-[#5C7567] font-semibold">
                        {formatCurrency(item.product.sellingPrice, locale)} &times; {item.quantity} ={' '}
                        <strong className="text-[#104C34]">
                          {formatCurrency(item.product.sellingPrice * item.quantity, locale)}
                        </strong>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-[#F7F9F8] border border-[#D1E2D7] text-[#172B22] flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-md bg-[#F7F9F8] border border-[#D1E2D7] text-[#172B22] flex items-center justify-center hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 text-rose-500 hover:text-rose-700 ml-1 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Financial Breakdown & Checkout Button */}
            <div className="p-4 border-t border-[#D1E2D7] bg-[#F7F9F8]/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5C7567]">
                  <span>{t.pos.subtotal}:</span>
                  <span className="font-semibold text-[#172B22]">
                    {formatCurrency(subtotal, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#5C7567]">
                  <span>{t.pos.discount} (৳):</span>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-20 h-7 text-right px-2 rounded-md border border-[#D1E2D7] bg-white text-xs font-semibold focus:border-[#176B45] focus:outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-[#D1E2D7] flex justify-between items-center">
                  <span className="font-bold text-sm text-[#104C34]">{t.pos.payable}:</span>
                  <span className="font-extrabold text-lg text-[#176B45]">
                    {formatCurrency(totalPayable, locale)}
                  </span>
                </div>
              </div>

              <Button
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className="w-full h-11 text-sm font-bold shadow-md bg-[#176B45] hover:bg-[#104C34]"
              >
                <span>{t.pos.checkout}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Checkout & Payment Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="বিল পরিশোধ ও অর্ডার চূড়ান্তকরণ (Checkout)"
        description="পেমেন্ট মাধ্যম ও প্রাপ্ত টাকার পরিমাণ নির্বাচন করুন।"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-[#D94B4B] font-medium">
              {errorMessage}
            </div>
          )}

          {/* Payable Amount Highlight */}
          <div className="p-4 rounded-xl bg-[#EAF5EE] border border-[#176B45]/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5C7567]">মোট পরিশোধযোগ্য টাকা</p>
              <h2 className="text-2xl font-black text-[#104C34]">
                {formatCurrency(totalPayable, locale)}
              </h2>
            </div>
            <Badge variant="success">{cart.length} টি পণ্য</Badge>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">পেমেন্ট মাধ্যম (Payment Tender)</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'নগদ ক্যাশ' },
                { id: 'bkash', label: 'বিকাশ' },
                { id: 'nagad', label: 'নগদ' },
                { id: 'card', label: 'কার্ড' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === m.id
                      ? 'border-[#176B45] bg-[#176B45] text-white shadow-xs'
                      : 'border-[#D1E2D7] bg-white text-[#172B22] hover:bg-gray-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid & Quick Buttons */}
          <div className="space-y-2">
            <Input
              label="প্রাপ্ত টাকা (Tendered Amount ৳) *"
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              required
            />

            {/* Quick numeric buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#5C7567]">দ্রুত ক্যাশ:</span>
              {[totalPayable, 100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPaidAmount(String(amt))}
                  className="px-2.5 py-1 rounded-md bg-[#F7F9F8] border border-[#D1E2D7] text-xs font-bold text-[#172B22] hover:bg-[#EAF5EE]"
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Change Due Display */}
          <div className="p-3 rounded-lg bg-gray-50 border border-[#D1E2D7] flex items-center justify-between text-xs">
            <span className="font-medium text-[#5C7567]">ফেরত টাকা (Change Due):</span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatCurrency(changeDue, locale)}
            </span>
          </div>

          {/* Customer info (Optional) */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D1E2D7]">
            <Input
              label="ক্রেতার নাম"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="সাধারণ ক্রেতা"
            />
            <Input
              label="মোবাইল নম্বর"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="01712-000000"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button variant="outline" size="sm" onClick={() => setIsCheckoutModalOpen(false)}>
              বাতিল
            </Button>
            <Button size="sm" onClick={handleCompleteSale} className="bg-[#176B45]">
              পেমেন্ট গ্রহণ ও রশিদ নিশ্চিত করুন &rarr;
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printable Thermal Receipt Modal */}
      {completedSale && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="বিক্রয় সফল — ক্যাশ মেমো / রশিদ"
          description="থার্মাল রিসিট প্রিন্ট করুন বা পরবর্তী অর্ডারে ফিরে যান।"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {/* The Printable Receipt Box (80mm width standard) */}
            <div
              id="printable-receipt"
              className="p-4 bg-white border border-gray-300 rounded-lg text-black font-mono text-xs space-y-3"
            >
              <div className="text-center space-y-0.5">
                <h2 className="font-extrabold text-base tracking-wide uppercase">খাগান লাইভ বেকারি</h2>
                <p className="text-[11px]">খাগান বাজার, বিরুলিয়া, সাভার, ঢাকা</p>
                <p className="text-[10px]">ফোন: ০১৭১২-৩৪৫৬৭৮</p>
                <div className="border-b border-dashed border-gray-400 my-2" />
                <div className="flex justify-between text-[10px]">
                  <span>ইনভয়েস: {completedSale.invoiceNumber}</span>
                  <span>{formatDateTime(completedSale.createdAt, locale)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>ক্যাশিয়ার: {completedSale.cashierName}</span>
                  <span>ক্রেতা: {completedSale.customerName}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1" />

              {/* Items Table */}
              <div className="space-y-1">
                {completedSale.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {it.productNameBn} &times; {it.quantity}
                    </span>
                    <span className="font-bold shrink-0">{formatCurrency(it.totalPrice, locale)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-400 my-1" />

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>উপ-মোট (Subtotal):</span>
                  <span>{formatCurrency(completedSale.subtotal, locale)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ছাড় (Discount):</span>
                    <span>-{formatCurrency(completedSale.discountAmount, locale)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm border-t border-black pt-1">
                  <span>সর্বমোট (Total):</span>
                  <span>{formatCurrency(completedSale.grandTotal, locale)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>প্রাপ্ত টাকা (Paid):</span>
                  <span>{formatCurrency(completedSale.paidAmount, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ফেরত (Change):</span>
                  <span>{formatCurrency(completedSale.changeAmount, locale)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>পেমেন্ট মাধ্যম:</span>
                  <span className="uppercase">{completedSale.payments[0]?.paymentMethod}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="text-center text-[10px] space-y-0.5">
                <p className="font-bold">আমাদের সুস্বাদু পণ্য বেছে নেওয়ার জন্য ধন্যবাদ!</p>
                <p>দয়া করে রশিদটি সংরক্ষণ করুন।</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                নতুন অর্ডার শুরু করুন
              </Button>
              <Button size="sm" onClick={handlePrintReceipt} className="bg-[#176B45]">
                <Printer className="w-4 h-4 mr-1.5" />
                <span>প্রিন্ট করুন</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
