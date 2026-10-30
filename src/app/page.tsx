'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth, DEMO_USERS } from '@/lib/auth/auth-context';
import { UserRole } from '@/types';
import {
  ShieldCheck,
  Store,
  Layers,
  ChefHat,
  Package,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { t, locale, toggleLocale } = useTranslation();
  const { currentUser, switchRole } = useAuth();

  const rolesList: { key: UserRole; label: string; desc: string }[] = [
    { key: 'super_admin', label: 'মালিক / Super Admin', desc: 'সকল প্যানেল ও রিপোর্টের পূর্ণ নিয়ন্ত্রণ' },
    { key: 'manager', label: 'ম্যানেজার / Manager', desc: 'সার্বিক পরিচালনা, অনুমোদন ও সমন্বয়' },
    { key: 'production_manager', label: 'হেড বেকার / Production', desc: 'রেসিপি, ব্যাচ ও কাঁচামাল ইস্যু' },
    { key: 'inventory_staff', label: 'ইনভেন্টরি কর্মী / Inventory', desc: 'মজুত গ্রহণ ও শাখা স্থানান্তর' },
    { key: 'cashier', label: 'ক্যাশিয়ার / Cashier', desc: 'শুধু দোকান বিক্রয় কাউন্টার (POS)' },
    { key: 'accountant', label: 'হিসাবরক্ষক / Accountant', desc: 'খরচ, পেরোল ও সাপ্লায়ার ব্যালেন্স' },
    { key: 'viewer', label: 'নিরীক্ষক / Viewer', desc: 'শুধুমাত্র রিপোর্ট দর্শন' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#D1E2D7] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B45] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              খ
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#172B22] leading-none">{t.common.appName}</h1>
              <p className="text-xs text-[#5C7567] mt-0.5">{t.common.tagline}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLocale}
              className="flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Globe className="w-4 h-4 text-[#176B45]" />
              <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#104C34] text-xs font-medium border border-[#D1E2D7]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#176B45]" />
            <span>লাইভ ডাটাবেজ ব্যাকড বেকারি ম্যানেজমেন্ট ইআরপি ও পিওএস</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B22] tracking-tight">
            খাগান লাইভ বেকারি ম্যানেজমেন্ট সিস্টেম
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#5C7567]">
            দৈনিক উৎপাদন, কাঁচামাল ও তৈরি পণ্যের স্বয়ংক্রিয় হিসাব, ফলন ট্র্যাকিং, টাচ-ফ্রেন্ডলি ক্যাশ পিওএস এবং নির্ভুল পরিচালন লাভ বিশ্লেষণ।
          </p>
        </div>

        {/* Active Role Quick Switch Bar */}
        <div className="bg-white p-5 rounded-2xl border border-[#D1E2D7] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#176B45]" />
              <h3 className="font-semibold text-sm text-[#172B22]">
                ভূমিকা নির্বাচন ও আরবিকিউ পরীক্ষা (RBAC Role Switcher):
              </h3>
            </div>
            <span className="text-xs text-[#5C7567]">
              বর্তমান সক্রিয়: <strong className="text-[#176B45]">{currentUser.fullName} ({currentUser.role})</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {rolesList.map((r) => {
              const isActive = currentUser.role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => switchRole(r.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34] ring-1 ring-[#176B45]'
                      : 'border-[#D1E2D7] bg-white hover:bg-[#F7F9F8] text-[#172B22]'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{r.label}</p>
                  <p className="text-[10px] text-[#5C7567] mt-1 leading-snug line-clamp-2">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two Portals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Portal Card */}
          <div className="bg-white rounded-2xl border border-[#D1E2D7] shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF5EE] text-[#176B45] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#172B22]">১. অ্যাডমিন ও ম্যানেজমেন্ট পোর্টাল (/admin)</h3>
                <p className="text-sm text-[#5C7567] mt-1">
                  মালিক ও ব্যবস্থাপকদের জন্য সম্পূর্ণ এন্টারপ্রাইজ সিস্টেম। উৎপাদন ফলন, বিওএম রেসিপি, কাঁচামাল ক্রয়, ইনভেন্টরি লেজার, পেরোল এবং লাভ-ক্ষতির বিশ্লেষণ।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#172B22] pt-2">
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-[#176B45]" />
                  <span>লাইভ কেপিআই ড্যাশবোর্ড</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ChefHat className="w-4 h-4 text-[#176B45]" />
                  <span>ব্যাচ ফলন ও ওজনের বিচ্যুতি</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-[#176B45]" />
                  <span>রেসিপি ও বিওএম সংস্করণ</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-[#176B45]" />
                  <span>কাঁচামাল ও গুদাম লেজার</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              {currentUser.role === 'cashier' ? (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-[#D94B4B] font-medium">
                  ক্যাশিয়ার রোলের জন্য অ্যাডমিন প্যানেল প্রবেশাধিকার নিষিদ্ধ (RLS Protected)
                </div>
              ) : (
                <Link href="/admin">
                  <Button className="w-full h-11 text-sm font-semibold">
                    অ্যাডমিন পোর্টালে প্রবেশ করুন &rarr;
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Shop POS Card */}
          <div className="bg-white rounded-2xl border border-[#D1E2D7] shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF5EE] text-[#176B45] flex items-center justify-center">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#172B22]">২. দোকান পিওএস কাউন্টার (/shop)</h3>
                <p className="text-sm text-[#5C7567] mt-1">
                  দোকান কর্মচারীদের জন্য অতি দ্রুত, টাচ-ফ্রেন্ডলি বিক্রয় কাউন্টার। লাইভ স্টক নজরদারি, বিকাশ/নগদ/কার্ড পেমেন্ট, রশিদ প্রিন্ট ও শিফট ক্যাশ মেলানো।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#172B22] pt-2">
                <div className="flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-[#176B45]" />
                  <span>দ্রুত পিওএস বিলিং ও রিসিট</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-[#176B45]" />
                  <span>কাউন্টার মজুত ও হস্তান্তর গ্রহণ</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#176B45]" />
                  <span>ক্যাশ শিফট ও ক্লোজিং ভ্যারিয়েন্স</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#176B45]" />
                  <span>নষ্ট পণ্য ও অনুমোদনযোগ্য রিটার্ন</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/shop">
                <Button variant="secondary" className="w-full h-11 text-sm font-semibold border border-[#D1E2D7]">
                  দোকান পিওএস কাউন্টারে প্রবেশ করুন &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* System Verification Highlights */}
        <div className="bg-[#104C34] text-white p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base">মাস্টার প্ল্যান অনুযায়ী প্রস্তুতকৃত আবশ্যকীয় নিয়মনীতি:</h4>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">অ্যাকসেপট্যান্স টেস্ট যাচাইযোগ্য</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-emerald-100">
            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-white">পারমাণবিক অনুমোদন (Atomic Batch)</p>
              <p className="text-[11px]">ব্যাচ অনুমোদন হওয়া মাত্র স্বয়ংক্রিয়ভাবে কাঁচামাল হ্রাস পাবে এবং তৈরি পণ্য যুক্ত হবে।</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-white">দ্বৈত-পোস্টিং প্রতিরোধ (Idempotency)</p>
              <p className="text-[11px]">নেটওয়ার্ক বিচ্ছিন্নতা বা রিট্রাই করলেও একই অর্ডার দুইবার ডেবিট হবে না।</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-white">শাখা স্থানান্তর (Stock Transfers)</p>
              <p className="text-[11px]">গুদাম থেকে কাউন্টারে পণ্য স্থানান্তরে কোনো কৃত্রিম স্টক বৃদ্ধি পায় না।</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-white">প্রকৃত লাভ ও কস্ট নিরূপণ</p>
              <p className="text-[11px]">কাঁচামাল, অপচয়, ইউটিলিটি ও কর্মীদের বেতন সমন্বিত করে নিখুঁত প্রফিট রিপোর্ট।</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D1E2D7] py-4 text-center text-xs text-[#5C7567]">
        খাগান লাইভ বেকারি ম্যানেজমেন্ট ইআরপি ও পিওএস &bull; সংস্করণ ১.০ &bull; বাংলাদেশ (এশিয়া/ঢাকা)
      </footer>
    </div>
  );
}

