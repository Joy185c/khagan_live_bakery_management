'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/auth-context';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  ChefHat,
  Boxes,
  Truck,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Store,
  Globe,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, toggleLocale } = useTranslation();
  const { currentUser, switchRole, canAccessAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/admin/products', label: t.nav.products, icon: Package },
    { href: '/admin/recipes', label: t.nav.recipes, icon: BookOpen },
    { href: '/admin/production', label: t.nav.production, icon: ChefHat },
    { href: '/admin/inventory', label: t.nav.inventory, icon: Boxes },
    { href: '/admin/purchases', label: t.nav.purchases, icon: Truck },
    { href: '/admin/sales', label: t.nav.sales, icon: ShoppingCart },
    { href: '/admin/expenses', label: t.nav.expenses, icon: Receipt },
    { href: '/admin/workforce', label: t.nav.workforce, icon: Users },
    { href: '/admin/reports', label: t.nav.reports, icon: BarChart3 },
    { href: '/admin/import', label: locale === 'bn' ? 'এক্সেল মাইগ্রেশন' : 'Excel Import', icon: FileSpreadsheet },
    { href: '/admin/settings', label: t.nav.settings, icon: Settings },
  ];

  // RBAC Access Control Guard
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-[#D94B4B] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172B22]">প্রবেশাধিকার সংরক্ষিত (Access Denied)</h2>
            <p className="text-xs text-[#5C7567] mt-1">
              আপনার বর্তমান রোল (<span className="font-semibold text-[#D94B4B]">{currentUser.role}</span>) দিয়ে অ্যাডমিন পোর্টালে প্রবেশের অনুমতি নেই। মাস্টার প্ল্যান অনুযায়ী ক্যাশিয়ার শুধুমাত্র দোকান পিওএস অ্যাক্সেস করতে পারবেন।
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href="/shop">
              <Button className="w-full">দোকান পিওএস কাউন্টারে যান</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => switchRole('super_admin')}
              className="text-xs"
            >
              সুপার অ্যাডমিন রোলে সুইচ করুন (টেস্টিং মোড)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#104C34] text-white shrink-0 shadow-lg min-h-screen">
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold flex items-center justify-center text-lg">
              খ
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
                {locale === 'bn' ? 'খাগান লাইভ বেকারি' : 'Khagan Live Bakery'}
              </h1>
              <span className="text-[10px] text-emerald-300/80 font-medium tracking-wider uppercase">
                {locale === 'bn' ? 'ম্যানেজমেন্ট ইআরপি' : 'Enterprise ERP'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#176B45] text-white shadow-xs font-semibold'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Switch to Shop POS Shortcut */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link href="/shop" className="block">
            <Button
              variant="secondary"
              size="sm"
              className="w-full flex items-center justify-between text-xs bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 border border-emerald-700/50"
            >
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>{t.nav.shopPortal}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* Current User Role display */}
          <div className="px-2 py-1.5 rounded-lg bg-black/20 text-[11px] text-emerald-200/90 flex items-center justify-between">
            <span className="truncate">{currentUser.fullName.split(' ')[0]}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 uppercase font-mono">
              {currentUser.role}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-[#D1E2D7] h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#172B22] rounded-lg hover:bg-[#EAF5EE]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-[#5C7567] font-medium">শাখা: </span>
              <span className="text-xs font-semibold text-[#172B22]">খাগান বাজার মূল শাখা (KB-01)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLocale}
              className="h-8 px-2.5 text-xs font-medium flex items-center space-x-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#176B45]" />
              <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
            </Button>

            {/* Quick role switcher dropdown for testing */}
            <select
              value={currentUser.role}
              onChange={(e) => switchRole(e.target.value as any)}
              className="text-xs font-medium border border-[#D1E2D7] rounded-lg px-2 py-1 bg-white text-[#172B22] focus:outline-none focus:ring-1 focus:ring-[#176B45]"
            >
              <option value="super_admin">Role: Super Admin</option>
              <option value="manager">Role: Manager</option>
              <option value="production_manager">Role: Production Mgr</option>
              <option value="inventory_staff">Role: Inventory Staff</option>
              <option value="accountant">Role: Accountant</option>
              <option value="viewer">Role: Viewer</option>
              <option value="cashier">Role: Cashier (POS only)</option>
            </select>

            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                প্রস্থান
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#104C34] text-white p-4 space-y-1 border-b border-emerald-900 shadow-xl">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-[#176B45] text-white' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10">
              <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <Button size="sm" variant="secondary" className="w-full text-xs">
                  {t.nav.shopPortal} &rarr;
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

