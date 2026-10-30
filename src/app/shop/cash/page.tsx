'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  DollarSign,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function ShopCashPage() {
  const { t, locale } = useTranslation();
  const { activeCashSession, pastCashSessions, openCashShift, closeCashShift } = useDatabase();
  const { currentUser } = useAuth();

  const [isOpenModalActive, setIsOpenModalActive] = useState(false);
  const [isCloseModalActive, setIsCloseModalActive] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('2000');
  const [countedCash, setCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closedSummary, setClosedSummary] = useState<any | null>(null);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openCashShift(Number(openingFloat), currentUser.id, currentUser.fullName);
    setIsOpenModalActive(false);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCashSession) return;
    const closed = closeCashShift(activeCashSession.id, Number(countedCash), closingNotes);
    setIsCloseModalActive(false);
    setClosedSummary(closed);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.cashShift.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            ক্যাশ কাউন্টার শিফট ওপেনিং, লাইভ ক্যাশ ট্র্যাকিং এবং শিফট সমাপ্তি ও ভ্যারিয়েন্স সমন্বয়
          </p>
        </div>
        <div>
          {activeCashSession ? (
            <Button
              onClick={() => {
                setCountedCash(String(activeCashSession.expectedClosingCash));
                setIsCloseModalActive(true);
              }}
              variant="danger"
              size="sm"
              className="h-9 text-xs"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              <span>{t.cashShift.closeShift}</span>
            </Button>
          ) : (
            <Button
              onClick={() => setIsOpenModalActive(true)}
              size="sm"
              className="h-9 text-xs bg-[#176B45]"
            >
              <Unlock className="w-4 h-4 mr-1.5" />
              <span>{t.cashShift.openShift}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Current Active Shift Cards */}
      {activeCashSession ? (
        <div className="space-y-4">
          <div className="bg-[#104C34] text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-bold text-sm">বর্তমান সক্রিয় শিফট ({activeCashSession.sessionNumber})</h3>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                শুরুর সময়: {formatDateTime(activeCashSession.openedAt, locale)} | ক্যাশিয়ার: {activeCashSession.cashierName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-200">ড্রয়ারে বর্তমান ক্যাশ থাকার কথা (Expected Cash):</p>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {formatCurrency(activeCashSession.expectedClosingCash, locale)}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <p className="text-xs text-[#5C7567] font-medium">{t.cashShift.openingFloat}</p>
                <h4 className="text-lg font-bold text-[#172B22] mt-1">
                  {formatCurrency(activeCashSession.openingFloat, locale)}
                </h4>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <CardContent className="p-4">
                <p className="text-xs text-[#5C7567] font-medium">{t.cashShift.cashSales}</p>
                <h4 className="text-lg font-bold text-emerald-700 mt-1">
                  +{formatCurrency(activeCashSession.totalCashSales, locale)}
                </h4>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-sky-600">
              <CardContent className="p-4">
                <p className="text-xs text-[#5C7567] font-medium">{t.cashShift.mobileSales}</p>
                <h4 className="text-lg font-bold text-sky-700 mt-1">
                  +{formatCurrency(activeCashSession.totalMobileSales, locale)}
                </h4>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600">
              <CardContent className="p-4">
                <p className="text-xs text-[#5C7567] font-medium">{t.cashShift.payouts}</p>
                <h4 className="text-lg font-bold text-amber-700 mt-1">
                  -{formatCurrency(activeCashSession.totalPayouts, locale)}
                </h4>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center space-y-3 bg-[#EAF5EE]/40 border-dashed border-[#176B45]/40">
          <div className="w-12 h-12 rounded-full bg-[#EAF5EE] text-[#176B45] mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#172B22]">বর্তমানে কোনো ক্যাশ শিফট চালু নেই</h3>
            <p className="text-xs text-[#5C7567] max-w-sm mx-auto mt-1">
              দোকান কাউন্টার বিক্রয় ও ক্যাশ হিসাব শুরু করতে প্রারম্ভিক ফ্লোট নির্ধারণ করে শিফট ওপেন করুন।
            </p>
          </div>
          <Button onClick={() => setIsOpenModalActive(true)} size="sm" className="bg-[#176B45]">
            শিফট শুরু করুন &rarr;
          </Button>
        </Card>
      )}

      {/* Closed Shift Summary Notification */}
      {closedSummary && (
        <Card className="border-emerald-300 bg-emerald-50/50 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-emerald-900">
                  শিফট {closedSummary.sessionNumber} সফলভাবে সমাপ্ত হয়েছে!
                </h4>
              </div>
              <p className="text-emerald-800">
                প্রত্যাশিত ক্যাশ: <strong>{formatCurrency(closedSummary.expectedClosingCash, locale)}</strong> | গণনা করা ক্যাশ: <strong>{formatCurrency(closedSummary.countedClosingCash, locale)}</strong>
              </p>
              <p className="font-bold">
                ক্যাশ ভ্যারিয়েন্স (পার্থক্য):{' '}
                <span
                  className={
                    closedSummary.cashVariance === 0
                      ? 'text-emerald-700'
                      : closedSummary.cashVariance < 0
                      ? 'text-rose-600'
                      : 'text-sky-700'
                  }
                >
                  {formatCurrency(closedSummary.cashVariance, locale)}{' '}
                  {closedSummary.cashVariance === 0 ? '(সম্পূর্ণ মিলেছে)' : closedSummary.cashVariance < 0 ? '(ঘাটতি)' : '(উদ্ধৃত্ত)'}
                </span>
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setClosedSummary(null)} className="text-xs">
              বন্ধ করুন
            </Button>
          </div>
        </Card>
      )}

      {/* Past Shifts Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">{t.cashShift.shiftHistory} ({pastCashSessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pastCashSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#5C7567]">
              পূর্বে বন্ধ হওয়া কোনো শিফটের রেকর্ড নেই।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">শিফট নম্বর</th>
                    <th className="py-3 px-3 font-semibold">ক্যাশিয়ার</th>
                    <th className="py-3 px-3 font-semibold">প্রারম্ভিক ফ্লোট</th>
                    <th className="py-3 px-3 font-semibold">নগদ বিক্রয়</th>
                    <th className="py-3 px-3 font-semibold">প্রত্যাশিত ক্যাশ</th>
                    <th className="py-3 px-3 font-semibold">গণনাকৃত ক্যাশ</th>
                    <th className="py-3 px-3 font-semibold">পার্থক্য (Variance)</th>
                    <th className="py-3 px-3 font-semibold">বন্ধের সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {pastCashSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#172B22]">
                        {sess.sessionNumber}
                      </td>
                      <td className="py-3 px-3 text-[#172B22] font-semibold">{sess.cashierName}</td>
                      <td className="py-3 px-3 text-[#5C7567]">
                        {formatCurrency(sess.openingFloat, locale)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {formatCurrency(sess.totalCashSales, locale)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#172B22]">
                        {formatCurrency(sess.expectedClosingCash, locale)}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#104C34]">
                        {formatCurrency(sess.countedClosingCash || 0, locale)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            sess.cashVariance === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : sess.cashVariance < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {formatCurrency(sess.cashVariance, locale)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5C7567]">
                        {formatDateTime(sess.closedAt || '', locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Shift Modal */}
      <Modal
        isOpen={isOpenModalActive}
        onClose={() => setIsOpenModalActive(false)}
        title="নতুন ক্যাশ শিফট শুরু করুন"
        description="ক্যাশ ড্রয়ারে রাখা প্রারম্ভিক খুচরা টাকা (Opening Float) নির্ধারণ করুন।"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <Input
            label="প্রারম্ভিক ক্যাশ (Float Amount ৳) *"
            type="number"
            value={openingFloat}
            onChange={(e) => setOpeningFloat(e.target.value)}
            required
          />

          <div className="p-3 rounded-lg bg-[#EAF5EE] text-xs text-[#104C34]">
            বর্তমান ক্যাশিয়ার: <strong>{currentUser.fullName} ({currentUser.role})</strong>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenModalActive(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" className="bg-[#176B45]">
              শিফট শুরু করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Shift Modal */}
      <Modal
        isOpen={isCloseModalActive}
        onClose={() => setIsCloseModalActive(false)}
        title="চলতি শিফট বন্ধ ও ক্যাশ গণনা (Blind Count Reconciliation)"
        description="হাতে থাকা মোট নগদ টাকা গুনে এখানে লিখুন। সিস্টেম স্বয়ংক্রিয়ভাবে সম্ভাব্য ক্যাশের সাথে মিলিয়ে পার্থক্য প্রদর্শন করবে।"
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          {activeCashSession && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-[#D1E2D7] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#5C7567]">প্রারম্ভিক ফ্লোট:</span>
                <span>{formatCurrency(activeCashSession.openingFloat, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C7567]">নগদ বিক্রয় (Cash Sales):</span>
                <span className="text-emerald-700 font-semibold">
                  +{formatCurrency(activeCashSession.totalCashSales, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C7567]">খরচ / পে-আউট (Payouts):</span>
                <span className="text-amber-700 font-semibold">
                  -{formatCurrency(activeCashSession.totalPayouts, locale)}
                </span>
              </div>
              <div className="pt-1.5 border-t border-gray-300 flex justify-between font-bold text-[#104C34] text-sm">
                <span>প্রত্যাশিত মোট ক্যাশ:</span>
                <span>{formatCurrency(activeCashSession.expectedClosingCash, locale)}</span>
              </div>
            </div>
          )}

          <Input
            label="হাতে গোনা নগদ টাকা (Counted Cash ৳) *"
            type="number"
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            required
          />

          <Input
            label="শিফট সমাপনী নোট / মন্তব্য"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="যেমন: ক্যাশ ড্রয়ার লক করা হয়েছে এবং টাকা মালিককে বুঝিয়ে দেওয়া হয়েছে।"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCloseModalActive(false)}>
              বাতিল
            </Button>
            <Button type="submit" variant="danger" size="sm">
              শিফট ক্লোজ নিশ্চিত করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
