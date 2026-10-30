'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Employee } from '@/types';
import {
  Users,
  Plus,
  CalendarCheck,
  DollarSign,
  Phone,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function AdminWorkforcePage() {
  const { t, locale } = useTranslation();
  const { employees, addEmployee } = useDatabase();

  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Employee Form
  const [empCode, setEmpCode] = useState(`KB-EMP-${Date.now().toString().slice(-3)}`);
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<'production' | 'shop' | 'management' | 'cleaning'>('production');
  const [baseSalary, setBaseSalary] = useState('20000');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>('monthly');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn || !phone) return;

    addEmployee({
      branchId: 'branch-khagan-01',
      employeeCode: empCode,
      fullNameBn: nameBn,
      fullNameEn: nameEn,
      phone,
      designation,
      department,
      joinDate: new Date().toISOString().slice(0, 10),
      salaryType,
      baseSalary: Number(baseSalary),
      overtimeRatePerHour: 100,
      isActive: true,
    });

    setIsAddModalOpen(false);
  };

  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + e.baseSalary, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">{t.workforce.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            কর্মীদের তালিকা, কর্মবিভাগ, শিফট হাজিরা এবং মাসিক বেতন ও ওভারটাইম হিসাব
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="h-9 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t.workforce.addEmployee}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#D1E2D7] pb-2">
        <Button
          variant={activeTab === 'employees' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('employees')}
          className="text-xs"
        >
          কর্মী তালিকা ({employees.length})
        </Button>
        <Button
          variant={activeTab === 'attendance' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('attendance')}
          className="text-xs"
        >
          দৈনিক হাজিরা
        </Button>
        <Button
          variant={activeTab === 'payroll' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('payroll')}
          className="text-xs"
        >
          বেতন শিট (Payroll)
        </Button>
      </div>

      {/* Tab 1: Employees List */}
      {activeTab === 'employees' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">কর্মী কোড ও নাম</th>
                    <th className="py-3 px-3 font-semibold">পদবী</th>
                    <th className="py-3 px-3 font-semibold">বিভাগ</th>
                    <th className="py-3 px-3 font-semibold">মোবাইল</th>
                    <th className="py-3 px-3 font-semibold">যোগদানের তারিখ</th>
                    <th className="py-3 px-3 font-semibold">মূল বেতন</th>
                    <th className="py-3 px-3 font-semibold">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#172B22]">
                          {locale === 'bn' ? emp.fullNameBn : emp.fullNameEn}
                        </p>
                        <p className="text-[10px] text-[#5C7567] font-mono">{emp.employeeCode}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#172B22]">{emp.designation}</td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF5EE] text-[#104C34]">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#5C7567]">{emp.phone}</td>
                      <td className="py-3 px-3 text-[#5C7567]">{formatDate(emp.joinDate, locale)}</td>
                      <td className="py-3 px-3 font-bold text-[#176B45]">
                        {formatCurrency(emp.baseSalary, locale)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success">কর্মরত</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">আজকের কর্মশালার হাজিরা খাতা (Attendance)</CardTitle>
              <Badge variant="success">সকল কর্মী উপস্থিত</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">কর্মী</th>
                    <th className="py-3 px-3 font-semibold">বিভাগ</th>
                    <th className="py-3 px-3 font-semibold">প্রবেশ সময় (In)</th>
                    <th className="py-3 px-3 font-semibold">প্রস্থান সময় (Out)</th>
                    <th className="py-3 px-3 font-semibold">ওভারটাইম</th>
                    <th className="py-3 px-3 font-semibold">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#EAF5EE]/40">
                      <td className="py-3 px-4 font-bold text-[#172B22]">
                        {locale === 'bn' ? emp.fullNameBn : emp.fullNameEn}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#5C7567]">{emp.department}</td>
                      <td className="py-3 px-3 font-mono text-emerald-700">০৮:০০ AM</td>
                      <td className="py-3 px-3 font-mono text-[#5C7567]">০৫:০০ PM</td>
                      <td className="py-3 px-3 font-bold text-[#104C34]">২ ঘণ্টা</td>
                      <td className="py-3 px-3">
                        <Badge variant="success">উপস্থিত</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Payroll Sheet */}
      {activeTab === 'payroll' && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">মাসিক পে-রোল ও বেতন বিবরণী (Payroll Sheet)</CardTitle>
                <p className="text-xs text-[#5C7567]">
                  চলতি মাসের আনুমানিক মোট বেতন ব্যয়:{' '}
                  <strong className="text-[#104C34]">{formatCurrency(totalMonthlyPayroll, locale)}</strong>
                </p>
              </div>
              <Button size="sm" className="h-8 text-xs bg-[#176B45]">
                ডিসবার্স / বেতন অনুমোদন
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">কর্মী</th>
                    <th className="py-3 px-3 font-semibold">মূল বেতন</th>
                    <th className="py-3 px-3 font-semibold">ওভারটাইম ভাতা</th>
                    <th className="py-3 px-3 font-semibold">বোনাস</th>
                    <th className="py-3 px-3 font-semibold">অগ্রিম কর্তন</th>
                    <th className="py-3 px-3 font-semibold">সর্বমোট প্রদেয়</th>
                    <th className="py-3 px-3 font-semibold">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {employees.map((emp) => {
                    const overtime = emp.overtimeRatePerHour * 10; // 10 hours
                    const net = emp.baseSalary + overtime;
                    return (
                      <tr key={emp.id} className="hover:bg-[#EAF5EE]/40">
                        <td className="py-3 px-4 font-bold text-[#172B22]">
                          {locale === 'bn' ? emp.fullNameBn : emp.fullNameEn}
                        </td>
                        <td className="py-3 px-3">{formatCurrency(emp.baseSalary, locale)}</td>
                        <td className="py-3 px-3 text-emerald-700">+{formatCurrency(overtime, locale)}</td>
                        <td className="py-3 px-3 text-[#5C7567]">৳ 0.00</td>
                        <td className="py-3 px-3 text-[#5C7567]">৳ 0.00</td>
                        <td className="py-3 px-3 font-extrabold text-[#176B45] text-sm">
                          {formatCurrency(net, locale)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="default">অনুমোদিত</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন কর্মী নিবন্ধন"
        description="কর্মীর নাম, পদবী, মোবাইল নম্বর ও মূল বেতন নির্ধারণ করুন।"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="পূর্ণ নাম (বাংলা) *"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: মোঃ কামরুল ইসলাম"
              required
            />
            <Input
              label="Full Name (English) *"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Md. Kamrul Islam"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="পদবী *"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="যেমন: সহকারী বেকার"
              required
            />
            <Input
              label="মোবাইল নম্বর *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712-000000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#172B22]">বিভাগ *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#D1E2D7] bg-white focus:border-[#176B45] focus:outline-none"
              >
                <option value="production">উৎপাদন (Production)</option>
                <option value="shop">দোকান কাউন্টার (Shop POS)</option>
                <option value="management">ব্যবস্থাপনা (Management)</option>
                <option value="cleaning">পরিচ্ছন্নতা (Sanitation)</option>
              </select>
            </div>
            <Input
              label="মূল বেতন (৳) *"
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#D1E2D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              সংরক্ষণ করুন &rarr;
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
