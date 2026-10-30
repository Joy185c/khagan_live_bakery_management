'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Settings,
  Printer,
  Globe,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ShopSettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const { currentUser } = useAuth();

  const [printerWidth, setPrinterWidth] = useState<'80mm' | '58mm'>('80mm');
  const [autoPrint, setAutoPrint] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172B22]">{t.nav.shopSettings}</h1>
        <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
          দোকান বিক্রয় কাউন্টার, থার্মাল রিসিট প্রিন্টার ও ভাষা কনফিগারেশন
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
        </div>
      )}

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#176B45]" />
            <CardTitle className="text-base">ভাষা নির্বাচন (Language Preferences)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[#5C7567]">
            পিওএস স্ক্রিন, পণ্য তালিকা ও ক্যাশ মেমোর ডিফল্ট ডিসপ্লে ভাষা নির্বাচন করুন:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocale('bn')}
              className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                locale === 'bn'
                  ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34] ring-1 ring-[#176B45]'
                  : 'border-[#D1E2D7] bg-white'
              }`}
            >
              <p>বাংলা (Bangla - ডিফল্ট)</p>
              <p className="text-[10px] text-[#5C7567] font-normal mt-0.5">রশিদ ও কাউন্টার বাংলায় প্রদর্শিত হবে</p>
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`p-3 rounded-xl border text-left font-bold text-xs transition-all ${
                locale === 'en'
                  ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34] ring-1 ring-[#176B45]'
                  : 'border-[#D1E2D7] bg-white'
              }`}
            >
              <p>English (ইংরেজি)</p>
              <p className="text-[10px] text-[#5C7567] font-normal mt-0.5">Receipt and counter in English</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Printer Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#176B45]" />
            <CardTitle className="text-base">থার্মাল প্রিন্টার সেটিংস (POS Printer)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#172B22]">কাগজের প্রস্থ (Paper Width)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrinterWidth('80mm')}
                className={`p-3 rounded-xl border text-xs font-bold ${
                  printerWidth === '80mm'
                    ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34]'
                    : 'border-[#D1E2D7] bg-white'
                }`}
              >
                ৮০ মিমি (80mm Standard POS)
              </button>
              <button
                type="button"
                onClick={() => setPrinterWidth('58mm')}
                className={`p-3 rounded-xl border text-xs font-bold ${
                  printerWidth === '58mm'
                    ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34]'
                    : 'border-[#D1E2D7] bg-white'
                }`}
              >
                ৫৮ মিমি (58mm Mini Thermal)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-[#172B22]">অটো প্রিন্ট ডায়ালগ</p>
              <p className="text-[10px] text-[#5C7567]">বিক্রয় সম্পন্ন হওয়া মাত্র সরাসরি প্রিন্ট উইন্ডো খুলবে</p>
            </div>
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-4 h-4 text-[#176B45] rounded"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cashier Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#176B45]" />
            <CardTitle className="text-base">বর্তমান ক্যাশিয়ার প্রোফাইল</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[#D1E2D7]/60">
            <span className="text-[#5C7567]">নাম:</span>
            <span className="font-bold text-[#172B22]">{currentUser.fullName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#D1E2D7]/60">
            <span className="text-[#5C7567]">মোবাইল:</span>
            <span className="font-mono text-[#172B22]">{currentUser.phone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#D1E2D7]/60">
            <span className="text-[#5C7567]">নির্ধারিত ভূমিকা (Role):</span>
            <span className="uppercase font-bold text-[#176B45]">{currentUser.role}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#5C7567]">কাউন্টার লোকেশন:</span>
            <span>খাগান বাজার ফ্রন্ট শপ কাউন্টার (KB-POS-01)</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-[#176B45] h-10 px-6 font-bold">
          সেটিংস সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}
