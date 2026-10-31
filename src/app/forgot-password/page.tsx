'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Globe,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { locale, toggleLocale } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isBn = locale === 'bn';

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'রিকোয়েস্ট পাঠানো ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#176B45] text-white flex items-center justify-center font-bold text-lg">
            খ
          </div>
          <span className="font-bold text-sm text-[#172B22]">খাগান লাইভ বেকারি</span>
        </div>

        <Button variant="outline" size="sm" onClick={toggleLocale} className="text-xs h-8">
          <Globe className="w-3.5 h-3.5 text-[#176B45] mr-1.5" />
          <span>{isBn ? 'English' : 'বাংলা'}</span>
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#D1E2D7] shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5EE] text-[#176B45] mx-auto flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#172B22]">
              {isBn ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password'}
            </h1>
            <p className="text-xs text-[#5C7567]">
              {isBn
                ? 'আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা রিকভারি লিংক পাঠাবো'
                : 'Enter your registered email to receive a password reset link'}
            </p>
          </div>

          {sent ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#176B45] mx-auto" />
              <h3 className="font-bold text-sm text-[#104C34]">
                {isBn ? 'রিকভারি ইমেইল পাঠানো হয়েছে!' : 'Recovery Link Sent!'}
              </h3>
              <p className="text-xs text-[#5C7567]">
                {isBn
                  ? 'আপনার ইনবক্স চেক করে প্রদত্ত লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।'
                  : 'Check your email inbox and follow instructions to set a new password.'}
              </p>
              <Link href="/login">
                <Button className="mt-2 text-xs h-9 w-full bg-[#176B45]">
                  {isBn ? 'লগইনে ফিরে যান' : 'Back to Login'}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#5C7567]" />
                    <span>{isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="user@khaganbakery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-semibold rounded-xl bg-[#176B45] hover:bg-[#104C34] text-white"
                >
                  {loading ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : isBn ? 'রিকভারি লিংক পাঠান' : 'Send Recovery Link'}
                </Button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs text-[#176B45] hover:underline font-medium space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'লগইনে ফিরে যান' : 'Back to Sign In'}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#5C7567]">
        © 2026 Khagan Live Bakery Management System
      </footer>
    </div>
  );
}
