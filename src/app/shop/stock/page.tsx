'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ShopStockPage() {
  const { t, locale } = useTranslation();
  const {
    products,
    categories,
    transfers,
    getShopAvailableStock,
    receiveStockTransfer,
  } = useDatabase();
  const { currentUser } = useAuth();

  const incomingTransfers = transfers.filter((t) => t.status === 'Dispatched');

  const handleReceive = (transferId: string) => {
    receiveStockTransfer(transferId, currentUser.id);
    alert('হস্তান্তরকৃত পণ্য দোকান কাউন্টারে সফলভাবে যুক্ত হয়েছে!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.shopStock}</h1>
        <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
          দোকান কাউন্টারে সরাসরি বিক্রয়যোগ্য পণ্যের বর্তমান মজুত এবং কারখানা হতে আগত চালান
        </p>
      </div>

      {/* Incoming Transfers Alert Section */}
      {incomingTransfers.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 shadow-xs">
          <CardHeader className="py-3 px-4 bg-amber-100/60 border-b border-amber-200">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-amber-700" />
              <CardTitle className="text-sm text-amber-900">
                প্রধান কারখানা হতে আগত নতুন চালান ({incomingTransfers.length} টি অপেক্ষমাণ)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {incomingTransfers.map((trf) => (
              <div
                key={trf.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#172B22]">
                      {trf.transferNumber}
                    </span>
                    <Badge variant="warning">পথিমধ্যে (Dispatched)</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-[#172B22]">
                    {trf.items.map((i) => (
                      <span key={i.id} className="bg-[#EAF5EE] px-2 py-0.5 rounded text-[#104C34] font-semibold">
                        {i.itemName}: {i.quantityRequested} পিস
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleReceive(trf.id)}
                  className="bg-[#176B45] hover:bg-[#104C34] text-xs font-semibold shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>চালান রিসিভ নিশ্চিত করুন</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Counter Stock Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">কাউন্টার পণ্যের তালিকা ও মজুত</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                <tr>
                  <th className="py-3 px-4 font-semibold">পণ্য ও এসকেইউ</th>
                  <th className="py-3 px-3 font-semibold">ক্যাটাগরি</th>
                  <th className="py-3 px-3 font-semibold">বিক্রয় মূল্য</th>
                  <th className="py-3 px-3 font-semibold">বর্তমান দোকান মজুত</th>
                  <th className="py-3 px-3 font-semibold">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]/60">
                {products.map((p) => {
                  const stock = getShopAvailableStock(p.id);
                  const isLow = stock <= 5;
                  const isOut = stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#172B22]">
                          {locale === 'bn' ? p.nameBn : p.nameEn}
                        </p>
                        <p className="text-[10px] text-[#5C7567] font-mono">{p.sku}</p>
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">
                        {categories.find((c) => c.id === p.categoryId)?.nameBn || 'সাধারণ'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#176B45]">
                        {formatCurrency(p.sellingPrice, locale)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sm">
                        <span
                          className={
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                          }
                        >
                          {stock} পিস
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                          {isOut ? 'মজুত শেষ' : isLow ? 'সীমিত স্টক' : 'উপলব্ধ'}
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
    </div>
  );
}
