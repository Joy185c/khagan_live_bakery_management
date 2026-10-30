'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/auth-context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  Receipt,
  Boxes,
  Trash2,
  DollarSign,
  Settings,
  Globe,
  ShieldCheck,
  CircleDot,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, toggleLocale } = useTranslation();
  const { currentUser, canAccessAdmin } = useAuth();
  const { activeCashSession } = useDatabase();

  const navItems = [
    { href: '/shop', label: t.nav.pos, icon: ShoppingCart },
    { href: '/shop/sales', label: t.nav.shopSales, icon: Receipt },
    { href: '/shop/stock', label: t.nav.shopStock, icon: Boxes },
    { href: '/shop/waste', label: t.nav.shopWaste, icon: Trash2 },
    { href: '/shop/cash', label: t.nav.cashShift, icon: DollarSign },
    { href: '/shop/settings', label: t.nav.shopSettings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col">
      {/* POS Top Header */}
      <header className="bg-[#104C34] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Counter Info */}
          <div className="flex items-center space-x-3">
            <Link href="/shop" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold flex items-center justify-center text-lg shadow-xs">
                খ
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm tracking-wide leading-none">খাগান লাইভ বেকারি</h1>
                <p className="text-[10px] text-emerald-300/80 mt-0.5">বিক্রয় কাউন্টার ও পিওএস (Shop POS)</p>
              </div>
            </Link>

            {/* Shift Status Badge */}
            <div className="ml-2 sm:ml-4 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/20 border border-white/10 text-[11px]">
              <CircleDot
                className={`w-3 h-3 ${activeCashSession ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}
              />
              <span className="font-medium text-emerald-100">
                {activeCashSession
                  ? `শিফট চালু (${formatCurrency(activeCashSession.totalCashSales, locale)})`
                  : 'শিফট বন্ধ (Shift Closed)'}
              </span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cashier Info */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser.fullName}</span>
            </div>

            {/* Switch Language */}
            <button
              onClick={toggleLocale}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>{locale === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            {/* Admin Switcher if authorized */}
            {canAccessAdmin && (
              <Link href="/admin">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-emerald-900 hover:bg-emerald-800 text-white border-emerald-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  <span>অ্যাডমিন</span>
                </Button>
              </Link>
            )}

            <Link href="/">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-emerald-200 hover:text-white hover:bg-white/10"
              >
                প্রস্থান
              </Button>
            </Link>
          </div>
        </div>

        {/* POS Sub Navigation Tabs */}
        <div className="bg-[#176B45] border-t border-emerald-600/40 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white text-[#104C34] shadow-xs font-semibold'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Shop Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">{children}</main>
    </div>
  );
}

