'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Settings,
  Scale,
  Shield,
  MapPin,
  FileText,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  const { t, locale, toggleLocale } = useTranslation();
  const { units, locations } = useDatabase();
  const { currentUser, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'units' | 'roles' | 'locations' | 'audit'>('roles');

  const rolesMatrix = [
    {
      role: 'Super Admin (মালিক)',
      adminAccess: 'সম্পূর্ণ নিয়ন্ত্রণ',
      posAccess: 'সম্পূর্ণ অ্যাক্সেস',
      production: 'অনুমোদন ও তৈরি',
      inventory: 'সম্পূর্ণ নিয়ন্ত্রণ',
      financials: 'পূর্ণ আয়-ব্যয় ও লাভ',
    },
    {
      role: 'Manager (ব্যবস্থাপক)',
      adminAccess: 'সার্বিক পরিচালনা',
      posAccess: 'সম্পূর্ণ অ্যাক্সেস',
      production: 'অনুমোদন ও তদারকি',
      inventory: 'অনুমোদন ও স্থানান্তর',
      financials: 'দৈনিক বিক্রয় ও খরচ',
    },
    {
      role: 'Production Manager (হেড বেকার)',
      adminAccess: 'সীমিত',
      posAccess: 'নিষিদ্ধ',
      production: 'রেসিপি ও ব্যাচ তৈরি',
      inventory: 'কাঁচামাল ইস্যু',
      financials: 'নিষিদ্ধ',
    },
    {
      role: 'Inventory Staff (স্টোরকিপার)',
      adminAccess: 'সীমিত',
      posAccess: 'নিষিদ্ধ',
      production: 'ব্যাচ দর্শন',
      inventory: 'ক্রয় চালান গ্রহণ ও স্থানান্তর',
      financials: 'নিষিদ্ধ',
    },
    {
      role: 'Cashier (দোকান ক্যাশিয়ার)',
      adminAccess: 'সম্পূর্ণ নিষিদ্ধ (Denied)',
      posAccess: 'বিক্রয় ও ক্যাশ শিফট',
      production: 'নিষিদ্ধ',
      inventory: 'দোকান মজুত দর্শন',
      financials: 'শুধুমাত্র শিফট ক্যাশ',
    },
    {
      role: 'Accountant (হিসাবরক্ষক)',
      adminAccess: 'আর্থিক মডিউল',
      posAccess: 'দর্শন',
      production: 'উৎপাদন ব্যয় দর্শন',
      inventory: 'মূল্যায়ন দর্শন',
      financials: 'ভাউচার, পেরোল ও লাভ-ক্ষতি',
    },
    {
      role: 'Viewer (নিরীক্ষক)',
      adminAccess: 'শুধুমাত্র দর্শন',
      posAccess: 'নিষিদ্ধ',
      production: 'রিপোর্ট দর্শন',
      inventory: 'রিপোর্ট দর্শন',
      financials: 'অনুমোদিত রিপোর্ট',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.settings.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            পরিমাপের একক, ভূমিকা ও পারমিশন কন্ট্রোল (RBAC), স্টোরেজ লোকেশন ও নিরাপত্তা
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#D1E2D7] pb-2">
        <Button
          variant={activeTab === 'roles' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('roles')}
          className="text-xs"
        >
          ভূমিকা ও পারমিশন (RBAC Matrix)
        </Button>
        <Button
          variant={activeTab === 'units' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('units')}
          className="text-xs"
        >
          পরিমাপের একক ও রূপান্তর
        </Button>
        <Button
          variant={activeTab === 'locations' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('locations')}
          className="text-xs"
        >
          শাখা ও স্টোরেজ লোকেশন
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('audit')}
          className="text-xs"
        >
          অডিট লগ ট্রেইল
        </Button>
      </div>

      {/* Tab 1: Roles Matrix */}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#176B45]" />
              <span>রো-লেভেল সিকিউরিটি ও অনুমতি ম্যাট্রিক্স (RLS Matrix)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ব্যবহারকারী ভূমিকা (Role)</th>
                    <th className="py-3 px-3 font-semibold">অ্যাডমিন পোর্টাল</th>
                    <th className="py-3 px-3 font-semibold">দোকান পিওএস</th>
                    <th className="py-3 px-3 font-semibold">উৎপাদন ও রেসিপি</th>
                    <th className="py-3 px-3 font-semibold">মজুত ও স্থানান্তর</th>
                    <th className="py-3 px-3 font-semibold">আর্থিক ও বেতন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {rolesMatrix.map((rm, idx) => (
                    <tr key={idx} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-bold text-[#172B22]">{rm.role}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            rm.adminAccess.includes('নিষিদ্ধ') ? 'text-rose-600' : 'text-[#104C34]'
                          }`}
                        >
                          {rm.adminAccess}
                        </span>
                      </td>
                      <td className="py-3 px-3">{rm.posAccess}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{rm.production}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{rm.inventory}</td>
                      <td className="py-3 px-3 font-semibold">
                        <span
                          className={rm.financials.includes('নিষিদ্ধ') ? 'text-rose-600' : 'text-emerald-700'}
                        >
                          {rm.financials}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Units */}
      {activeTab === 'units' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center space-x-2">
              <Scale className="w-5 h-5 text-[#176B45]" />
              <span>প্রমিত পরিমাপের একক ও স্বয়ংক্রিয় নরমালাইজেশন</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">একক কোড</th>
                    <th className="py-3 px-3 font-semibold">বাংলা নাম</th>
                    <th className="py-3 px-3 font-semibold">English Name</th>
                    <th className="py-3 px-3 font-semibold">প্রতীক (Symbol)</th>
                    <th className="py-3 px-3 font-semibold">ধরণ</th>
                    <th className="py-3 px-3 font-semibold">রূপান্তর নিয়ম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">{u.code}</td>
                      <td className="py-3 px-3 font-bold text-[#176B45]">{u.nameBn}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{u.nameEn}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{u.symbol}</td>
                      <td className="py-3 px-3 capitalize text-[#5C7567]">{u.type}</td>
                      <td className="py-3 px-3 font-mono text-emerald-800">
                        {u.code === 'kg'
                          ? '১ কেজি = ১,০০০ গ্রাম'
                          : u.code === 'l'
                          ? '১ লিটার = ১,০০০ মিলি'
                          : 'স্ট্যান্ডার্ড ইউনিট'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Storage Locations */}
      {activeTab === 'locations' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#176B45]" />
              <span>শাখা ও অভ্যন্তরীণ স্টোরেজ লোকেশন</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">লোকেশন আইডি</th>
                    <th className="py-3 px-3 font-semibold">নাম</th>
                    <th className="py-3 px-3 font-semibold">ধরণ (Type)</th>
                    <th className="py-3 px-3 font-semibold">পিওএস কাউন্টার</th>
                    <th className="py-3 px-3 font-semibold">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">{loc.id}</td>
                      <td className="py-3 px-3 font-semibold text-[#172B22]">{loc.name}</td>
                      <td className="py-3 px-3 capitalize text-[#5C7567]">{loc.type}</td>
                      <td className="py-3 px-3">
                        {loc.isDefaultPos ? (
                          <Badge variant="success">প্রধান পিওএস</Badge>
                        ) : (
                          <span className="text-[#5C7567]">না</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success">সক্রিয়</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#176B45]" />
              <span>নিরাপত্তা ও লেনদেন অডিট লগ (Security Audit Trail)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#D1E2D7] text-xs space-y-1">
              <div className="flex justify-between font-mono font-semibold text-[#172B22]">
                <span>BATCH_APPROVAL</span>
                <span className="text-[#5C7567]">2026-10-30 09:00:00</span>
              </div>
              <p className="text-[#5C7567]">
                ব্যবহারকারী <strong>Shuvo Ahmed (Owner)</strong> ব্যাচ <code>PB-20261030-01</code> অনুমোদন করেছেন। কাঁচামাল স্টক স্বয়ংক্রিয়ভাবে হ্রাস এবং ৪৮ পিস তৈরি পণ্য গুদামে জমা হয়েছে।
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#D1E2D7] text-xs space-y-1">
              <div className="flex justify-between font-mono font-semibold text-[#172B22]">
                <span>STOCK_TRANSFER</span>
                <span className="text-[#5C7567]">2026-10-30 08:30:00</span>
              </div>
              <p className="text-[#5C7567]">
                গুদাম হতে দোকান কাউন্টারে ৪০ পিস স্পেশাল মিল্ক ব্রেড স্থানান্তর সম্পন্ন হয়েছে।
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#D1E2D7] text-xs space-y-1">
              <div className="flex justify-between font-mono font-semibold text-[#172B22]">
                <span>SHIFT_OPEN</span>
                <span className="text-[#5C7567]">2026-10-30 08:00:00</span>
              </div>
              <p className="text-[#5C7567]">
                ক্যাশিয়ার <strong>Fatema Khatun</strong> ৳২,০০০ প্রারম্ভিক ফ্লোট দিয়ে কাউন্টার শিফট চালু করেছেন।
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
