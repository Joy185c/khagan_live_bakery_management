'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Globe,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { locale, toggleLocale } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isBn = locale === 'bn';

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(isBn ? 'পাসওয়ার্ড মিলছে না।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে।');
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
            <h1 className="text-2xl font-extrabold text-[#172B22]">
              {isBn ? 'নতুন পাসওয়ার্ড নির্ধারণ' : 'Set New Password'}
            </h1>
            <p className="text-xs text-[#5C7567]">
              {isBn ? 'আপনার অ্যাকাউন্টের জন্য নতুন একটি নিরাপদ পাসওয়ার্ড দিন' : 'Enter a strong new password for your account'}
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#176B45] mx-auto animate-bounce" />
              <h3 className="font-bold text-sm text-[#104C34]">
                {isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password Updated Successfully!'}
              </h3>
              <p className="text-xs text-[#5C7567]">
                {isBn ? 'লগইন পেজে রিডাইরেক্ট করা হচ্ছে...' : 'Redirecting to login page...'}
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#5C7567]" />
                    <span>{isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl text-sm pr-9"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#5C7567]" />
                    <span>{isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</span>
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-semibold rounded-xl bg-[#176B45] hover:bg-[#104C34] text-white"
                >
                  {loading ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'পাসওয়ার্ড সংরক্ষণ করুন' : 'Update Password'}
                </Button>
              </form>
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
