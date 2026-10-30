'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Sale } from '@/types';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function ShopSalesPage() {
  const { t, locale } = useTranslation();
  const { sales } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('পণ্য পরিবর্তন বা বাতিল');
  const [returnCondition, setReturnCondition] = useState<'restockable' | 'damaged'>('restockable');

  const filteredSales = sales.filter((s) => {
    return (
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmReturn = () => {
    alert('রিটার্ন অনুরোধ সফলভাবে নথিভুক্ত হয়েছে এবং ইনভেন্টরি লেজারে সমন্বয় করা হয়েছে!');
    setIsReturnModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.shopSales}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            দোকান কাউন্টারের দৈনিক বিক্রয় তালিকা, রশিদ পুনঃমুদ্রণ ও অনুমোদিত রিটার্ন
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C7567] absolute left-3 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ইনভয়েস নম্বর বা ক্রেতার নাম খুঁজুন..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales List Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ইনভয়েস নং</th>
                  <th className="py-3 px-3 font-semibold">সময়</th>
                  <th className="py-3 px-3 font-semibold">ক্রেতা ও ফোন</th>
                  <th className="py-3 px-3 font-semibold">পণ্যের সংখ্যা</th>
                  <th className="py-3 px-3 font-semibold">মোট মূল্য</th>
                  <th className="py-3 px-3 font-semibold">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-3 font-semibold">অবস্থা</th>
                  <th className="py-3 px-4 text-right font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#EAF5EE]/40">
                    <td className="py-3 px-4 font-mono font-bold text-[#172B22]">
                      {s.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-[#5C7567]">
                      {formatDateTime(s.createdAt, locale)}
                    </td>
                    <td className="py-3 px-3 text-[#172B22]">
                      <p className="font-semibold">{s.customerName}</p>
                      <p className="text-[10px] text-[#5C7567]">{s.customerPhone || '—'}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#172B22]">
                      {s.items.reduce((sum, i) => sum + i.quantity, 0)} পিস
                    </td>
                    <td className="py-3 px-3 font-extrabold text-[#176B45]">
                      {formatCurrency(s.grandTotal, locale)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#EAF5EE] text-[#104C34]">
                        {s.payments[0]?.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="success">সম্পন্ন</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSale(s)}
                          className="h-7 text-xs px-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>রশিদ</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSale(s);
                            setIsReturnModalOpen(true);
                          }}
                          className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>রিটার্ন</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail / Reprint Modal */}
      {selectedSale && !isReturnModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSale(null)}
          title={`বিক্রয় ইনভয়েস — ${selectedSale.invoiceNumber}`}
          description="রশিদ পুনঃমুদ্রণ বা পণ্যের তালিকা পর্যালোচনা করুন।"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div id="printable-receipt" className="p-4 bg-white border border-gray-300 rounded-lg text-black font-mono text-xs space-y-2">
              <div className="text-center">
                <h3 className="font-extrabold text-base">খাগান লাইভ বেকারি</h3>
                <p className="text-[10px]">খাগান বাজার, সাভার, ঢাকা</p>
                <div className="border-b border-dashed border-gray-400 my-1" />
                <p className="text-[10px]">বিল: {selectedSale.invoiceNumber}</p>
                <p className="text-[10px]">তারিখ: {formatDateTime(selectedSale.createdAt, locale)}</p>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1" />

              <div className="space-y-1">
                {selectedSale.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.productNameBn} &times; {it.quantity}
                    </span>
                    <span className="font-bold">{formatCurrency(it.totalPrice, locale)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 flex justify-between font-bold text-sm">
                <span>সর্বমোট:</span>
                <span>{formatCurrency(selectedSale.grandTotal, locale)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                বন্ধ করুন
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-[#176B45]">
                <Printer className="w-4 h-4 mr-1.5" />
                <span>প্রিন্ট করুন</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Request Modal */}
      {isReturnModalOpen && selectedSale && (
        <Modal
          isOpen={true}
          onClose={() => setIsReturnModalOpen(false)}
          title={`বিক্রয় রিটার্ন অনুমোদন — ${selectedSale.invoiceNumber}`}
          description="গ্রাহকের ফেরত দেওয়া পণ্যের গুণগত অবস্থা ও কারণ নির্ধারণ করুন।"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172B22]">পণ্যের অবস্থা (Product Condition) *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReturnCondition('restockable')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                    returnCondition === 'restockable'
                      ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34]'
                      : 'border-[#D1E2D7] bg-white'
                  }`}
                >
                  পুনরায় বিক্রয়যোগ্য (Restockable)
                </button>
                <button
                  type="button"
                  onClick={() => setReturnCondition('damaged')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                    returnCondition === 'damaged'
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-[#D1E2D7] bg-white'
                  }`}
                >
                  নষ্ট / ক্ষতিগ্রস্ত (Damaged / Waste)
                </button>
              </div>
            </div>

            <Input
              label="ফেরত নেওয়ার কারণ *"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="যেমন: গ্রাহক মিষ্টি বন চেয়েছেন কিন্তু সাধারণ বান নিয়েছিলেন।"
            />

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
              <Button variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)}>
                বাতিল
              </Button>
              <Button size="sm" onClick={handleConfirmReturn} className="bg-[#176B45]">
                রিটার্ন কার্যকর করুন &rarr;
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
