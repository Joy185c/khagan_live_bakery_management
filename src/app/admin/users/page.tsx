'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTranslation } from '@/lib/i18n/context';
import { UserProfile, UserRole, AccountStatus, SecurityAuditLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  LogOut,
  UserPlus,
  Search,
  Filter,
  History,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function UserAccessManagementPage() {
  const {
    currentUser,
    usersList,
    refreshUsers,
    blockUser,
    unblockUser,
    suspendUser,
    revokeAccess,
    activateUser,
    deactivateUser,
    changeUserRole,
    forceLogout,
    inviteUser,
    fetchAuditLogs,
    isSuperAdmin,
  } = useAuth();

  const { locale } = useTranslation();
  const isBn = locale === 'bn';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendUntil, setSuspendUntil] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('cashier');

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'cashier' as UserRole,
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-shop-01',
  });

  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const loadAuditLogs = async () => {
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Statistics
  const totalUsers = usersList.length;
  const activeUsers = usersList.filter((u) => u.status === 'active' && u.isActive !== false).length;
  const blockedUsers = usersList.filter((u) => u.status === 'blocked').length;
  const suspendedUsers = usersList.filter((u) => u.status === 'suspended').length;

  // Handlers
  const handleBlockConfirm = async () => {
    if (!selectedUser || !blockReason.trim()) return;
    setActionLoading(true);
    const res = await blockUser(selectedUser.id, blockReason);
    setActionLoading(false);
    setIsBlockModalOpen(false);
    setBlockReason('');
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleUnblock = async (user: UserProfile) => {
    setActionLoading(true);
    const res = await unblockUser(user.id);
    setActionLoading(false);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedUser || !suspendUntil || !suspendReason.trim()) return;
    setActionLoading(true);
    const res = await suspendUser(selectedUser.id, suspendUntil, suspendReason);
    setActionLoading(false);
    setIsSuspendModalOpen(false);
    setSuspendReason('');
    setSuspendUntil('');
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedUser || !revokeReason.trim()) return;
    setActionLoading(true);
    const res = await revokeAccess(selectedUser.id, revokeReason);
    setActionLoading(false);
    setIsRevokeModalOpen(false);
    setRevokeReason('');
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await changeUserRole(selectedUser.id, newRole);
    setActionLoading(false);
    setIsRoleModalOpen(false);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleForceLogout = async (user: UserProfile) => {
    setActionLoading(true);
    const res = await forceLogout(user.id);
    setActionLoading(false);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) return;
    setActionLoading(true);
    const res = await inviteUser(inviteForm);
    setActionLoading(false);
    setIsInviteModalOpen(false);
    setInviteForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'cashier',
      branchId: 'branch-khagan-01',
      assignedLocationId: 'loc-shop-01',
    });
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  // Role Badge Renderer
  const renderRoleBadge = (role: UserRole) => {
    const roleLabels: Record<UserRole, { bn: string; en: string; color: string }> = {
      super_admin: { bn: 'সুপার অ্যাডমিন', en: 'Super Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      manager: { bn: 'ম্যানেজার', en: 'Manager', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      production_manager: { bn: 'হেড বেকার', en: 'Production Mgr', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      inventory_staff: { bn: 'ইনভেন্টরি কর্মী', en: 'Inventory Staff', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      cashier: { bn: 'ক্যাশিয়ার (POS)', en: 'Cashier', color: 'bg-teal-100 text-teal-800 border-teal-300' },
      accountant: { bn: 'হিসাবরক্ষক', en: 'Accountant', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      viewer: { bn: 'নিরীক্ষক', en: 'Viewer', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };

    const info = roleLabels[role] || { bn: role, en: role, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.color}`}>
        {isBn ? info.bn : info.en}
      </span>
    );
  };

  // Status Badge Renderer
  const renderStatusBadge = (user: UserProfile) => {
    if (user.status === 'blocked') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <UserX className="w-3 h-3" />
          <span>{isBn ? 'ব্লকড' : 'Blocked'}</span>
        </span>
      );
    }
    if (user.status === 'suspended') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3" />
          <span>{isBn ? 'স্থগিত' : 'Suspended'}</span>
        </span>
      );
    }
    if (user.status === 'deactivated' || user.isActive === false) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <span>{isBn ? 'নিষ্ক্রিয়' : 'Deactivated'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        <span>{isBn ? 'সক্রিয়' : 'Active'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#172B22]">
              {isBn ? 'সুপার অ্যাডমিন — কর্মী ও অ্যাক্সেস কন্ট্রোল' : 'User Access Management'}
            </h1>
            <Badge variant="default" className="bg-[#EAF5EE] text-[#176B45] text-xs border border-[#D1E2D7]">
              {isBn ? 'নিরাপদ আরবিএসি' : 'RBAC Protected'}
            </Badge>
          </div>
          <p className="text-xs text-[#5C7567] mt-1">
            {isBn
              ? 'কর্মীদের অ্যাক্সেস তাৎক্ষণিক ব্লক, স্থগিত, নিষ্ক্রিয়, ভূমিকা পরিবর্তন ও ডিভাইস ফোর্স লগআউট পরিচালনা করুন।'
              : 'Immediately block, suspend, revoke access, change roles, and force logout across devices.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshUsers}
            className="text-xs h-9 flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#176B45]" />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>

          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="text-xs h-9 bg-[#176B45] hover:bg-[#104C34] text-white flex items-center space-x-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isBn ? 'নতুন কর্মী যুক্ত করুন' : 'Add Employee'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-[#D1E2D7] bg-white rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C7567] font-medium">{isBn ? 'মোট ব্যবহারকারী' : 'Total Users'}</span>
            <UserCheck className="w-4 h-4 text-[#176B45]" />
          </div>
          <div className="text-2xl font-bold text-[#172B22] mt-2">{totalUsers}</div>
        </Card>

        <Card className="p-4 border-[#D1E2D7] bg-white rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C7567] font-medium">{isBn ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Accounts'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{activeUsers}</div>
        </Card>

        <Card className="p-4 border-[#D1E2D7] bg-white rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C7567] font-medium">{isBn ? 'ব্লকড অ্যাকাউন্ট' : 'Blocked'}</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{blockedUsers}</div>
        </Card>

        <Card className="p-4 border-[#D1E2D7] bg-white rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C7567] font-medium">{isBn ? 'স্থগিত অ্যাকাউন্ট' : 'Suspended'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{suspendedUsers}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D1E2D7] space-x-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-[#176B45] text-[#176B45]'
              : 'border-transparent text-[#5C7567] hover:text-[#172B22]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isBn ? 'কর্মী ও ভূমিকা তালিকা' : 'Staff & Roles'} ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            loadAuditLogs();
          }}
          className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-[#176B45] text-[#176B45]'
              : 'border-transparent text-[#5C7567] hover:text-[#172B22]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isBn ? 'নিরাপত্তা ও অ্যাকশন অডিট লগ' : 'Security Audit Log'}</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-3 rounded-2xl border border-[#D1E2D7] flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5C7567]" />
              <Input
                placeholder={isBn ? 'নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...' : 'Search by name, email, or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs h-9 px-2.5 rounded-xl border border-[#D1E2D7] bg-white text-[#172B22]"
              >
                <option value="all">{isBn ? 'সকল ভূমিকা (All Roles)' : 'All Roles'}</option>
                <option value="super_admin">Super Admin</option>
                <option value="manager">Manager</option>
                <option value="production_manager">Production Manager</option>
                <option value="inventory_staff">Inventory Staff</option>
                <option value="cashier">Cashier</option>
                <option value="accountant">Accountant</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs h-9 px-2.5 rounded-xl border border-[#D1E2D7] bg-white text-[#172B22]"
              >
                <option value="all">{isBn ? 'সকল স্ট্যাটাস (All Status)' : 'All Status'}</option>
                <option value="active">{isBn ? 'সক্রিয় (Active)' : 'Active'}</option>
                <option value="blocked">{isBn ? 'ব্লকড (Blocked)' : 'Blocked'}</option>
                <option value="suspended">{isBn ? 'স্থগিত (Suspended)' : 'Suspended'}</option>
                <option value="deactivated">{isBn ? 'নিষ্ক্রিয় (Deactivated)' : 'Deactivated'}</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-[#D1E2D7] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#172B22]">
                <thead className="bg-[#F7F9F8] border-b border-[#D1E2D7] text-[#5C7567] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{isBn ? 'কর্মী ও পরিচয়' : 'Staff Member'}</th>
                    <th className="py-3 px-4">{isBn ? 'ভূমিকা (Role)' : 'Role'}</th>
                    <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="py-3 px-4">{isBn ? 'শাখা / কাউন্টার' : 'Assigned Location'}</th>
                    <th className="py-3 px-4">{isBn ? 'সর্বশেষ লগইন' : 'Last Login'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন (Super Admin)' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#5C7567]">
                        <UserCheck className="w-8 h-8 mx-auto text-[#5C7567]/50 mb-2" />
                        <p className="font-semibold">{isBn ? 'কোনো কর্মী পাওয়া যায়নি।' : 'No staff members found.'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMe = u.id === currentUser.id;
                      const isTargetSuperAdmin = u.role === 'super_admin';

                      return (
                        <tr key={u.id} className="hover:bg-[#F7F9F8]/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-[#EAF5EE] text-[#176B45] flex items-center justify-center font-bold text-xs shrink-0">
                                {u.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-[#172B22] flex items-center space-x-1.5">
                                  <span>{u.fullName}</span>
                                  {isMe && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-[#176B45] rounded border border-emerald-200">
                                      {isBn ? 'আপনি' : 'You'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#5C7567] flex items-center space-x-2">
                                  {u.email && <span>{u.email}</span>}
                                  {u.phone && <span>• {u.phone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">{renderRoleBadge(u.role)}</td>

                          <td className="py-3 px-4">
                            {renderStatusBadge(u)}
                            {u.status === 'blocked' && u.blockedReason && (
                              <p className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[150px]" title={u.blockedReason}>
                                {u.blockedReason}
                              </p>
                            )}
                            {u.status === 'suspended' && u.suspendedUntil && (
                              <p className="text-[10px] text-amber-700 mt-0.5">
                                {new Date(u.suspendedUntil).toLocaleDateString('bn-BD')}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[#5C7567]">
                            <span className="capitalize">{u.assignedLocationId === 'loc-shop-01' ? (isBn ? 'দোকান পিওএস' : 'Shop Counter') : (isBn ? 'রান্নাঘর ও গুদাম' : 'Kitchen/Warehouse')}</span>
                          </td>

                          <td className="py-3 px-4 text-[#5C7567]">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('bn-BD') : isBn ? 'কখনও না' : 'Never'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isSuperAdmin && (
                              <div className="inline-flex items-center space-x-1">
                                {/* Role Switch Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setNewRole(u.role);
                                    setIsRoleModalOpen(true);
                                  }}
                                  className="h-7 text-[11px] px-2 text-[#176B45] hover:bg-[#EAF5EE]"
                                >
                                  {isBn ? 'রোল' : 'Role'}
                                </Button>

                                {/* Block / Unblock Action */}
                                {u.status === 'blocked' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnblock(u)}
                                    disabled={actionLoading}
                                    className="h-7 text-[11px] px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  >
                                    {isBn ? 'আনব্লক' : 'Unblock'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isMe || isTargetSuperAdmin || actionLoading}
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setIsBlockModalOpen(true);
                                    }}
                                    className="h-7 text-[11px] px-2 text-rose-600 hover:bg-rose-50"
                                    title={isMe ? 'নিজের অ্যাকাউন্ট ব্লক করা যায় না' : ''}
                                  >
                                    {isBn ? 'ব্লক' : 'Block'}
                                  </Button>
                                )}

                                {/* Suspend Button */}
                                {u.status !== 'blocked' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isMe || isTargetSuperAdmin || actionLoading}
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setIsSuspendModalOpen(true);
                                    }}
                                    className="h-7 text-[11px] px-2 text-amber-700 hover:bg-amber-50"
                                  >
                                    {isBn ? 'স্থগিত' : 'Suspend'}
                                  </Button>
                                )}

                                {/* Force Logout Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => handleForceLogout(u)}
                                  className="h-7 text-[11px] px-1.5 text-gray-600 hover:bg-gray-100"
                                  title={isBn ? 'সকল ডিভাইস থেকে ফোর্স লগআউট' : 'Force Logout'}
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                </Button>

                                {/* Permanently Revoke Access */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isMe || isTargetSuperAdmin || actionLoading}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsRevokeModalOpen(true);
                                  }}
                                  className="h-7 text-[11px] px-1.5 text-rose-700 hover:bg-rose-50"
                                  title={isBn ? 'স্থায়ীভাবে অ্যাক্সেস বাতিল' : 'Revoke Access'}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Security Audit Log View */
        <div className="bg-white rounded-2xl border border-[#D1E2D7] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#D1E2D7] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#172B22]">{isBn ? 'নিরাপত্তা ও অ্যাকশন অডিট হিস্টোরি' : 'Security Action Audit Logs'}</h3>
              <p className="text-[11px] text-[#5C7567]">{isBn ? 'কে কখন কোন কর্মীর অ্যাকাউন্ট ব্লক/স্থগিত/রোল পরিবর্তন করেছেন তার রেকর্ড।' : 'Audit log of all access control events.'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadAuditLogs} className="text-xs h-8">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B22]">
              <thead className="bg-[#F7F9F8] border-b border-[#D1E2D7] text-[#5C7567] font-semibold">
                <tr>
                  <th className="py-3 px-4">{isBn ? 'সময়' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  <th className="py-3 px-4">{isBn ? 'সম্পাদনকারী' : 'Actor'}</th>
                  <th className="py-3 px-4">{isBn ? 'টার্গেট কর্মী' : 'Target Employee'}</th>
                  <th className="py-3 px-4">{isBn ? 'কারণ / বিবরণ' : 'Reason / Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E2D7]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#5C7567]">
                      {isBn ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি।' : 'No security logs found.'}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F9F8]/50">
                      <td className="py-2.5 px-4 text-[#5C7567]">
                        {new Date(log.createdAt).toLocaleString('bn-BD')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[11px] text-[#176B45]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 font-medium">{log.actorName || 'System'}</td>
                      <td className="py-2.5 px-4 font-medium text-[#172B22]">{log.targetUserName || 'User'}</td>
                      <td className="py-2.5 px-4 text-[#5C7567]">{log.reason || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. BLOCK MODAL */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={isBn ? 'অ্যাকাউন্ট ব্লক করুন (Block Account)' : 'Block Account'}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>{selectedUser?.fullName}</strong> {isBn ? '-এর অ্যাকাউন্ট ব্লক করা হবে। তিনি আর লগইন বা কোনো সংরক্ষিত ডেটায় প্রবেশ করতে পারবেন না।' : 'will be immediately blocked from accessing the system.'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172B22]">
              {isBn ? 'ব্লক করার কারণ (বাধ্যতামূলক):' : 'Reason for blocking (Required):'}
            </label>
            <Input
              placeholder={isBn ? 'উদাঃ সন্দেহজনক বিক্রয় রিফান্ড বা নিরাপত্তা লঙ্ঘন' : 'e.g. Policy violation'}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsBlockModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!blockReason.trim() || actionLoading}
              onClick={handleBlockConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isBn ? 'হ্যাঁ, ব্লক নিশ্চিত করুন' : 'Confirm Block'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. SUSPEND MODAL */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title={isBn ? 'অ্যাক্সেস সাময়িক স্থগিত (Suspend Access)' : 'Suspend Access'}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[#5C7567]">
            {isBn
              ? `${selectedUser?.fullName}-এর অ্যাক্সেস একটি নির্দিষ্ট তারিখ ও সময় পর্যন্ত স্থগিত থাকবে। নির্দিষ্ট সময় পর তিনি আবার স্বয়ংক্রিয়ভাবে অ্যাক্সেস ফিরে পাবেন।`
              : 'Temporarily pause access until a specified timestamp.'}
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172B22]">
              {isBn ? 'স্থগিতের শেষ সময় (Until Date & Time):' : 'Suspended Until:'}
            </label>
            <Input
              type="datetime-local"
              value={suspendUntil}
              onChange={(e) => setSuspendUntil(e.target.value)}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172B22]">
              {isBn ? 'স্থগিত করার কারণ:' : 'Reason for suspension:'}
            </label>
            <Input
              placeholder={isBn ? 'উদাঃ অভ্যন্তরীণ অডিট চলাকালীন সাময়িক বিরতি' : 'e.g. Internal audit pending'}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSuspendModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!suspendUntil || !suspendReason.trim() || actionLoading}
              onClick={handleSuspendConfirm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isBn ? 'স্থগিত নিশ্চিত করুন' : 'Confirm Suspend'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. CHANGE ROLE MODAL */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={isBn ? 'ভূমিকা ও অনুমতি পরিবর্তন (Change Role)' : 'Change User Role'}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[#5C7567]">
            <strong>{selectedUser?.fullName}</strong> {isBn ? '-এর জন্য নতুন ভূমিকা নির্বাচন করুন:' : '- Select new role:'}
          </p>

          <div className="space-y-2">
            {[
              { role: 'cashier', bn: 'ক্যাশিয়ার (Cashier)', desc: 'শুধুমাত্র দোকান পিওএস (Shop POS) অ্যাক্সেস' },
              { role: 'inventory_staff', bn: 'ইনভেন্টরি কর্মী (Inventory)', desc: 'কাঁচামাল গ্রহণ ও স্টক স্থানান্তর' },
              { role: 'production_manager', bn: 'হেড বেকার (Production)', desc: 'রেসিপি, উৎপাদন ব্যাচ ও কাঁচামাল অনুমোদন' },
              { role: 'accountant', bn: 'হিসাবরক্ষক (Accountant)', desc: 'খরচ, পেরোল ও আর্থিক হিসাব নিরীক্ষা' },
              { role: 'manager', bn: 'ম্যানেজার (Manager)', desc: 'সার্বিক পরিচালনা, কর্মচারী ও বিক্রয় অনুমোদন' },
              { role: 'super_admin', bn: 'সুপার অ্যাডমিন (Super Admin)', desc: 'সিস্টেমের পূর্ণ নিয়ন্ত্রণ ও নীতি নির্ধারণ' },
            ].map((r) => (
              <label
                key={r.role}
                className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  newRole === r.role ? 'border-[#176B45] bg-[#EAF5EE]/40' : 'border-[#D1E2D7] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roleSelection"
                  checked={newRole === r.role}
                  onChange={() => setNewRole(r.role as UserRole)}
                  className="mt-0.5 text-[#176B45] focus:ring-[#176B45]"
                />
                <div>
                  <div className="text-xs font-semibold text-[#172B22]">{r.bn}</div>
                  <div className="text-[11px] text-[#5C7567]">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleRoleChangeConfirm}
              className="bg-[#176B45] hover:bg-[#104C34] text-white"
            >
              {isBn ? 'রোল আপডেট করুন' : 'Update Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. REVOKE ACCESS MODAL */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title={isBn ? 'স্থায়ীভাবে অ্যাক্সেস বাতিল (Revoke Access)' : 'Revoke Access Permanently'}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <p className="font-bold flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isBn ? 'গুরুত্বপূর্ণ সতর্কতা (Critical Notice):' : 'Important Notice:'}</span>
            </p>
            <p>
              {isBn
                ? 'এই কর্মীর সমস্ত অ্যাক্সেস স্থায়ীভাবে বাতিল করা হবে। মাস্টার প্ল্যানের নীতি অনুযায়ী ঐতিহাসিক কোনো বিক্রয়, উৎপাদন বা পেরোল রেকর্ড মুছে ফেলা হবে না।'
                : 'Access will be permanently revoked. Historical records remain fully intact for audit.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172B22]">
              {isBn ? 'বাতিলের কারণ:' : 'Reason for revocation:'}
            </label>
            <Input
              placeholder={isBn ? 'উদাঃ কর্মসংস্থান সমাপ্তি বা পদত্যাগ' : 'e.g. Employment terminated'}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRevokeModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!revokeReason.trim() || actionLoading}
              onClick={handleRevokeConfirm}
              className="bg-rose-700 hover:bg-rose-800 text-white"
            >
              {isBn ? 'স্থায়ীভাবে বাতিল করুন' : 'Confirm Revoke'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. INVITE / ADD EMPLOYEE MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={isBn ? 'নতুন কর্মী যুক্ত করুন (Add New Employee)' : 'Add New Employee'}
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172B22]">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
            <Input
              required
              placeholder={isBn ? 'উদাঃ ফাতেমা খাতুন' : 'e.g. Fatema Khatun'}
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
              className="text-xs h-9 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#172B22]">{isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</label>
              <Input
                required
                type="email"
                placeholder="staff@khaganbakery.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#172B22]">{isBn ? 'মোবাইল নম্বর' : 'Phone Number'}</label>
              <Input
                required
                placeholder="01823-333444"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#172B22]">{isBn ? 'ভূমিকা (Role)' : 'Role'}</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                className="w-full text-xs h-9 px-2.5 rounded-xl border border-[#D1E2D7] bg-white text-[#172B22]"
              >
                <option value="cashier">{isBn ? 'ক্যাশিয়ার (Cashier)' : 'Cashier'}</option>
                <option value="inventory_staff">{isBn ? 'ইনভেন্টরি কর্মী' : 'Inventory Staff'}</option>
                <option value="production_manager">{isBn ? 'হেড বেকার' : 'Production Mgr'}</option>
                <option value="accountant">{isBn ? 'হিসাবরক্ষক' : 'Accountant'}</option>
                <option value="manager">{isBn ? 'ম্যানেজার' : 'Manager'}</option>
                <option value="viewer">{isBn ? 'নিরীক্ষক' : 'Viewer'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#172B22]">{isBn ? 'শাখা / কাউন্টার' : 'Location'}</label>
              <select
                value={inviteForm.assignedLocationId}
                onChange={(e) => setInviteForm({ ...inviteForm, assignedLocationId: e.target.value })}
                className="w-full text-xs h-9 px-2.5 rounded-xl border border-[#D1E2D7] bg-white text-[#172B22]"
              >
                <option value="loc-shop-01">{isBn ? 'দোকান পিওএস (Shop POS)' : 'Shop Counter'}</option>
                <option value="loc-wh-01">{isBn ? 'প্রধান কারখানা ও গুদাম' : 'Kitchen/Warehouse'}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={actionLoading}
              className="bg-[#176B45] hover:bg-[#104C34] text-white"
            >
              {isBn ? 'কর্মী নিশ্চিত করুন' : 'Confirm & Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
