'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Sparkles,
  ArrowRight,
  Store,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, currentUser } = useAuth();
  const { locale, toggleLocale } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBn = locale === 'bn';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        isBn ? 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' : 'Please enter your email and password.'
      );
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      // Redirect based on role
      const savedUser = localStorage.getItem('khagan_auth_user_v2');
      const user = savedUser ? JSON.parse(savedUser) : currentUser;

      if (user.role === 'cashier') {
        router.push('/shop');
      } else if (user.role === 'production_manager') {
        router.push('/admin/production');
      } else if (user.role === 'inventory_staff') {
        router.push('/admin/inventory');
      } else {
        router.push('/admin');
      }
    } else {
      setErrorMessage(result.error || (isBn ? 'লগইন ব্যর্থ হয়েছে।' : 'Login failed.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#176B45] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            খ
          </div>
          <div>
            <span className="font-bold text-sm text-[#172B22]">খাগান লাইভ বেকারি</span>
            <span className="hidden sm:inline text-xs text-[#5C7567] ml-2">ERP & POS</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleLocale}
          className="text-xs h-8 flex items-center space-x-1.5"
        >
          <Globe className="w-3.5 h-3.5 text-[#176B45]" />
          <span>{isBn ? 'English' : 'বাংলা'}</span>
        </Button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#D1E2D7] shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5EE] text-[#176B45] mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#172B22] tracking-tight">
              {isBn ? 'সিস্টেমে লগইন করুন' : 'Sign In to Your Account'}
            </h1>
            <p className="text-xs text-[#5C7567]">
              {isBn
                ? 'আপনার অনুমোদিত ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'
                : 'Enter your authorized bakery credentials'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#5C7567]" />
                <span>{isBn ? 'ইমেইল বা ফোন নম্বর' : 'Email or Phone'}</span>
              </label>
              <Input
                type="text"
                placeholder={isBn ? 'owner@khaganbakery.com বা 01711...' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#5C7567]" />
                  <span>{isBn ? 'পাসওয়ার্ড' : 'Password'}</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#176B45] hover:underline"
                >
                  {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#5C7567] hover:text-[#172B22]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full h-11 text-sm font-semibold rounded-xl bg-[#176B45] hover:bg-[#104C34] text-white shadow-md flex items-center justify-center space-x-2"
            >
              <span>{submitting ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : isBn ? 'লগইন করুন' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick First-Time Owner Setup Banner */}
          <div className="pt-2 border-t border-[#D1E2D7] text-center space-y-2">
            <p className="text-[11px] text-[#5C7567]">
              {isBn ? 'প্রথমবার সিস্টেম চালু করছেন?' : 'Setting up the bakery for the first time?'}
            </p>
            <Link href="/setup">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-9 rounded-xl border-dashed border-[#176B45] text-[#176B45] hover:bg-[#EAF5EE] flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#176B45]" />
                <span>{isBn ? 'প্রথম মালিক অ্যাকাউন্ট সেটআপ করুন' : 'Setup Initial Owner Account'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#5C7567]">
        © 2026 Khagan Live Bakery Management System. All rights reserved.
      </footer>
    </div>
  );
}
