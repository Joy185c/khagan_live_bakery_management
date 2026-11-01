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
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export default function FirstOwnerSetupPage() {
  const router = useRouter();
  const { setupOwner } = useAuth();
  const { locale, toggleLocale } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBn = locale === 'bn';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(isBn ? 'উভয় পাসওয়ার্ড হুবহু মিলতে হবে।' : 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await setupOwner({
      fullName,
      email,
      phone,
      password,
    });
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } else {
      setErrorMessage(result.error || (isBn ? 'সেটআপ ব্যর্থ হয়েছে।' : 'Setup failed.'));
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
            <span className="hidden sm:inline text-xs text-[#5C7567] ml-2">ERP Onboarding</span>
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

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D1E2D7] shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5EE] text-[#176B45] mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#172B22] tracking-tight">
              {isBn ? 'প্রথম মালিক (Super Admin) অ্যাকাউন্ট সেটআপ' : 'First Owner Account Setup'}
            </h1>
            <p className="text-xs text-[#5C7567] max-w-sm mx-auto">
              {isBn
                ? 'বেকারির প্রথম মালিক হিসেবে আপনার নিরাপদ অ্যাকাউন্টের বিবরণ প্রদান করুন'
                : 'Configure the primary Super Admin profile for Khagan Live Bakery'}
            </p>
          </div>

          {/* Success Notification */}
          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#176B45] mx-auto animate-bounce" />
              <h3 className="font-bold text-base text-[#104C34]">
                {isBn ? 'সুপার অ্যাডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Owner Account Created Successfully!'}
              </h3>
              <p className="text-xs text-[#5C7567]">
                {isBn ? 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...' : 'Redirecting to Admin Portal...'}
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-[#5C7567]" />
                    <span>{isBn ? 'মালিকের পূর্ণ নাম' : 'Full Name'}</span>
                  </label>
                  <Input
                    type="text"
                    placeholder={isBn ? 'উদাঃ শুভ আহমেদ' : 'e.g. Shuvo Ahmed'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#5C7567]" />
                      <span>{isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="owner@khaganbakery.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#5C7567]" />
                      <span>{isBn ? 'মোবাইল নম্বর' : 'Phone Number'}</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="01711-000001"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172B22] flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#5C7567]" />
                      <span>{isBn ? 'পাসওয়ার্ড' : 'Password'}</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 rounded-xl text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#5C7567] hover:text-[#172B22]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 text-sm font-semibold rounded-xl bg-[#176B45] hover:bg-[#104C34] text-white shadow-md mt-2"
                >
                  {submitting
                    ? isBn
                      ? 'অ্যাকাউন্ট তৈরি হচ্ছে...'
                      : 'Setting up...'
                    : isBn
                    ? 'মালিক অ্যাকাউন্ট নিশ্চিত করুন'
                    : 'Confirm Owner Setup'}
                </Button>
              </form>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-[#176B45] hover:underline font-medium">
                  {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Sign In'}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#5C7567]">
        © 2026 Khagan Live Bakery Management System
      </footer>
    </div>
  );
}

