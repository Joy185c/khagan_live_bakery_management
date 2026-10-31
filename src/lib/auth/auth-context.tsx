'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, AccountStatus, ModulePermissions, SecurityAuditLog } from '@/types';
import { supabase } from '../supabase/client';

export const DEFAULT_SUPER_ADMIN: UserProfile = {
  id: 'usr-admin-01',
  fullName: 'Shuvo Ahmed (Owner)',
  email: 'owner@khaganbakery.com',
  phone: '01711-000001',
  role: 'super_admin',
  status: 'active',
  languagePreference: 'bn',
  branchId: 'branch-khagan-01',
  assignedLocationId: 'loc-wh-01',
  isActive: true,
  createdAt: new Date().toISOString(),
};

// Fixture profiles for tests or offline dev
export const DEMO_USERS: Record<UserRole, UserProfile> = {
  super_admin: DEFAULT_SUPER_ADMIN,
  manager: {
    id: 'usr-mgr-01',
    fullName: 'Rafiqul Islam (Manager)',
    email: 'manager@khaganbakery.com',
    phone: '01711-000002',
    role: 'manager',
    status: 'active',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
    isActive: true,
  },
  production_manager: {
    id: 'usr-prod-01',
    fullName: 'Master Baker Kamal (Chef)',
    email: 'chef@khaganbakery.com',
    phone: '01711-000003',
    role: 'production_manager',
    status: 'active',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
    isActive: true,
  },
  inventory_staff: {
    id: 'usr-inv-01',
    fullName: 'Tanvir Hossain (Inventory)',
    email: 'inventory@khaganbakery.com',
    phone: '01711-000004',
    role: 'inventory_staff',
    status: 'active',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
    isActive: true,
  },
  cashier: {
    id: 'usr-cash-01',
    fullName: 'Fatema Khatun (Cashier)',
    email: 'cashier@khaganbakery.com',
    phone: '01711-000005',
    role: 'cashier',
    status: 'active',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-shop-01',
    isActive: true,
  },
  accountant: {
    id: 'usr-acc-01',
    fullName: 'Enamul Haque (Accountant)',
    email: 'accounts@khaganbakery.com',
    phone: '01711-000006',
    role: 'accountant',
    status: 'active',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
    isActive: true,
  },
  viewer: {
    id: 'usr-view-01',
    fullName: 'Auditor Salim (Viewer)',
    email: 'auditor@khaganbakery.com',
    phone: '01711-000007',
    role: 'viewer',
    status: 'active',
    languagePreference: 'en',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-shop-01',
    isActive: true,
  },
};

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  usersList: UserProfile[];
  securityLogs: SecurityAuditLog[];
  
  // Auth operations
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setupOwner: (data: { fullName: string; email: string; password: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole) => void;
  
  // Super Admin operations
  refreshUsers: () => Promise<void>;
  blockUser: (userId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  unblockUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  suspendUser: (userId: string, until: string, reason: string) => Promise<{ success: boolean; message: string }>;
  revokeAccess: (userId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  activateUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  deactivateUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  changeUserRole: (userId: string, role: UserRole, customPermissions?: ModulePermissions) => Promise<{ success: boolean; message: string }>;
  forceLogout: (userId: string) => Promise<{ success: boolean; message: string }>;
  inviteUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    branchId?: string;
    assignedLocationId?: string;
    password?: string;
  }) => Promise<{ success: boolean; message: string }>;
  fetchAuditLogs: () => Promise<SecurityAuditLog[]>;

  // Granular RBAC Permissions
  canAccessAdmin: boolean;
  canAccessShop: boolean;
  canViewFinancials: boolean;
  canApproveBatches: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canPerformStockTransfer: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_SUPER_ADMIN);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>([]);

  // Map Supabase DB profile row to UserProfile
  const mapDbRowToProfile = (row: any): UserProfile => ({
    id: row.id,
    email: row.email || `${row.phone || row.id}@khaganbakery.local`,
    fullName: row.full_name || 'Unnamed Staff',
    phone: row.phone || '',
    role: row.role as UserRole,
    status: (row.status || (row.is_active ? 'active' : 'deactivated')) as AccountStatus,
    languagePreference: row.language_preference || 'bn',
    branchId: row.branch_id || 'branch-khagan-01',
    assignedLocationId: row.assigned_location_id || 'loc-wh-01',
    avatarUrl: row.avatar_url,
    isActive: row.is_active ?? true,
    suspendedUntil: row.suspended_until,
    blockedReason: row.blocked_reason,
    blockedBy: row.blocked_by,
    lastLoginAt: row.last_login_at,
    sessionVersion: row.session_version || 1,
    customPermissions: row.custom_permissions || {},
    createdAt: row.created_at,
  });

  // Load active user session from local storage or Supabase
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('khagan_auth_user_v2');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as UserProfile;
        setCurrentUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Fetch users list from Supabase
  const refreshUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbRowToProfile);
        setUsersList(mapped);

        // Sync current user status if in list
        const activeInList = mapped.find((u) => u.id === currentUser.id);
        if (activeInList) {
          setCurrentUser(activeInList);
          localStorage.setItem('khagan_auth_user_v2', JSON.stringify(activeInList));
        }
      } else if (usersList.length === 0) {
        // Fallback default list for initial setup view
        setUsersList([DEFAULT_SUPER_ADMIN]);
      }
    } catch (err) {
      console.warn('Could not fetch profiles from Supabase:', err);
      if (usersList.length === 0) {
        setUsersList([DEFAULT_SUPER_ADMIN]);
      }
    }
  }, [currentUser.id, usersList.length]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Log a security audit event
  const logSecurityAction = async (
    action: SecurityAuditLog['action'],
    targetUserId: string,
    targetUserName: string,
    reason?: string,
    details: Record<string, any> = {}
  ) => {
    const newLog: SecurityAuditLog = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: currentUser.branchId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      targetUserId,
      targetUserName,
      action,
      reason: reason || '',
      details,
      createdAt: new Date().toISOString(),
    };

    setSecurityLogs((prev) => [newLog, ...prev]);

    try {
      await supabase.from('security_audit_logs').insert({
        branch_id: currentUser.branchId,
        actor_id: currentUser.id,
        actor_name: currentUser.fullName,
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        action,
        reason: reason || null,
        details,
      });
    } catch {
      // Offline safe
    }
  };

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      let profileData: any = null;

      if (!authError && authData.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        profileData = p;
      } else {
        // Check local profile by email / phone fallback
        const match = usersList.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase() || u.phone === email
        );
        if (match) {
          profileData = {
            id: match.id,
            full_name: match.fullName,
            email: match.email,
            phone: match.phone,
            role: match.role,
            status: match.status,
            is_active: match.isActive,
            branch_id: match.branchId,
            assigned_location_id: match.assignedLocationId,
          };
        }
      }

      if (!profileData) {
        setIsLoading(false);
        return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।' };
      }

      const profile = mapDbRowToProfile(profileData);

      // 2. Enforce Account Status
      if (profile.status === 'blocked') {
        setIsLoading(false);
        await supabase.auth.signOut();
        return {
          success: false,
          error: `আপনার অ্যাকাউন্টটি সুপার অ্যাডমিন দ্বারা ব্লক করা হয়েছে। কারণ: ${profile.blockedReason || 'নিরাপত্তা নিয়ম লঙ্ঘন'}।`,
        };
      }

      if (profile.status === 'suspended') {
        if (profile.suspendedUntil && new Date(profile.suspendedUntil) > new Date()) {
          setIsLoading(false);
          await supabase.auth.signOut();
          const restoreDate = new Date(profile.suspendedUntil).toLocaleString('bn-BD');
          return {
            success: false,
            error: `আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। মেয়াদ শেষ হবে: ${restoreDate}।`,
          };
        }
      }

      if (profile.status === 'deactivated' || profile.isActive === false) {
        setIsLoading(false);
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।',
        };
      }

      // Successful login
      profile.lastLoginAt = new Date().toISOString();
      setCurrentUser(profile);
      setIsAuthenticated(true);
      localStorage.setItem('khagan_auth_user_v2', JSON.stringify(profile));

      // Update last login in Supabase
      try {
        await supabase.from('profiles').update({ last_login_at: profile.lastLoginAt }).eq('id', profile.id);
      } catch {
        // Safe
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'লগইন করতে ব্যর্থ হয়েছে।' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Safe
    }
    localStorage.removeItem('khagan_auth_user_v2');
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  // First Owner Setup
  const setupOwner = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if super_admin exists
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if (count && count > 0) {
        return { success: false, error: 'সুপার অ্যাডমিন ইতিমধ্যে সেটআপ করা রয়েছে। লগইন পেজে যান।' };
      }

      // Create owner user
      const { data: authUser, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: 'super_admin',
          },
        },
      });

      const newId = authUser?.user?.id || `usr-owner-${Date.now()}`;

      const newOwner: UserProfile = {
        id: newId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'super_admin',
        status: 'active',
        languagePreference: 'bn',
        branchId: 'branch-khagan-01',
        assignedLocationId: 'loc-wh-01',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await supabase.from('profiles').upsert({
          id: newId,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          role: 'super_admin',
          status: 'active',
          is_active: true,
          branch_id: 'branch-khagan-01',
          assigned_location_id: 'loc-wh-01',
        });
      } catch {
        // Safe
      }

      await logSecurityAction('FIRST_OWNER_SETUP', newId, data.fullName, 'Initial bakery owner setup');

      setCurrentUser(newOwner);
      setIsAuthenticated(true);
      setUsersList((prev) => [newOwner, ...prev]);
      localStorage.setItem('khagan_auth_user_v2', JSON.stringify(newOwner));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'মালিক সেটআপ ব্যর্থ হয়েছে।' };
    }
  };

  // Helper: check if target is the last active Super Admin
  const isLastActiveSuperAdmin = (targetId: string): boolean => {
    const activeAdmins = usersList.filter(
      (u) => u.role === 'super_admin' && u.status === 'active' && u.isActive !== false
    );
    return activeAdmins.length === 1 && activeAdmins[0].id === targetId;
  };

  // 1. Block User
  const blockUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন অ্যাকাউন্ট ব্লক করতে পারেন।' };
    }
    if (currentUser.id === userId) {
      return { success: false, message: 'নিরাপত্তা নীতি: আপনি নিজের অ্যাকাউন্ট ব্লক করতে পারবেন না।' };
    }
    if (isLastActiveSuperAdmin(userId)) {
      return { success: false, message: 'নিরাপত্তা নীতি: সিস্টেমের শেষ সক্রিয় সুপার অ্যাডমিনকে ব্লক করা অসম্ভব।' };
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'blocked',
              isActive: false,
              blockedReason: reason,
              blockedBy: currentUser.id,
              sessionVersion: (u.sessionVersion || 1) + 1,
            }
          : u
      )
    );

    try {
      await supabase
        .from('profiles')
        .update({
          status: 'blocked',
          is_active: false,
          blocked_reason: reason,
          blocked_by: currentUser.id,
          session_version: (target?.sessionVersion || 1) + 1,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase block error:', err);
    }

    await logSecurityAction('BLOCK_USER', userId, targetName, reason);
    return { success: true, message: `${targetName}-এর অ্যাকাউন্ট সফলভাবে ব্লক করা হয়েছে।` };
  };

  // 2. Unblock User
  const unblockUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন আনব্লক করতে পারেন।' };
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'active',
              isActive: true,
              blockedReason: null,
              blockedBy: null,
              suspendedUntil: null,
            }
          : u
      )
    );

    try {
      await supabase
        .from('profiles')
        .update({
          status: 'active',
          is_active: true,
          blocked_reason: null,
          blocked_by: null,
          suspended_until: null,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase unblock error:', err);
    }

    await logSecurityAction('UNBLOCK_USER', userId, targetName, 'Unblocked by Super Admin');
    return { success: true, message: `${targetName}-এর অ্যাকাউন্ট সফলভাবে আনব্লক ও সক্রিয় করা হয়েছে।` };
  };

  // 3. Suspend User
  const suspendUser = async (
    userId: string,
    until: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন অ্যাকাউন্ট স্থগিত করতে পারেন।' };
    }
    if (currentUser.id === userId) {
      return { success: false, message: 'আপনি নিজের অ্যাকাউন্ট স্থগিত করতে পারবেন না।' };
    }
    if (isLastActiveSuperAdmin(userId)) {
      return { success: false, message: 'শেষ সক্রিয় সুপার অ্যাডমিনকে স্থগিত করা অসম্ভব।' };
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'suspended',
              suspendedUntil: until,
              blockedReason: reason,
              sessionVersion: (u.sessionVersion || 1) + 1,
            }
          : u
      )
    );

    try {
      await supabase
        .from('profiles')
        .update({
          status: 'suspended',
          suspended_until: until,
          blocked_reason: reason,
          session_version: (target?.sessionVersion || 1) + 1,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase suspend error:', err);
    }

    await logSecurityAction('SUSPEND_USER', userId, targetName, reason, { suspendedUntil: until });
    return { success: true, message: `${targetName}-এর অ্যাক্সেস সাময়িকভাবে স্থগিত করা হয়েছে।` };
  };

  // 4. Revoke Access Permanently
  const revokeAccess = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন অ্যাক্সেস বাতিল করতে পারেন।' };
    }
    if (currentUser.id === userId) {
      return { success: false, message: 'আপনি নিজের অ্যাক্সেস বাতিল করতে পারবেন না।' };
    }
    if (isLastActiveSuperAdmin(userId)) {
      return { success: false, message: 'শেষ সক্রিয় সুপার অ্যাডমিনের অ্যাক্সেস বাতিল করা অসম্ভব।' };
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'deactivated',
              isActive: false,
              blockedReason: `Access permanently revoked: ${reason}`,
              sessionVersion: (u.sessionVersion || 1) + 1,
            }
          : u
      )
    );

    try {
      await supabase
        .from('profiles')
        .update({
          status: 'deactivated',
          is_active: false,
          blocked_reason: `Access permanently revoked: ${reason}`,
          session_version: (target?.sessionVersion || 1) + 1,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase revoke error:', err);
    }

    await logSecurityAction('REVOKE_ACCESS', userId, targetName, reason);
    return { success: true, message: `${targetName}-এর অ্যাক্সেস স্থায়ীভাবে বাতিল করা হয়েছে। ঐতিহাসিক রেকর্ড সুরক্ষিত রয়েছে।` };
  };

  // 5. Activate User
  const activateUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    return unblockUser(userId);
  };

  // 6. Deactivate User
  const deactivateUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    return revokeAccess(userId, 'Deactivated by Super Admin');
  };

  // 7. Change Role & Permissions
  const changeUserRole = async (
    userId: string,
    newRole: UserRole,
    customPermissions?: ModulePermissions
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন ভূমিকা পরিবর্তন করতে পারেন।' };
    }
    if (currentUser.id === userId && newRole !== 'super_admin') {
      if (isLastActiveSuperAdmin(userId)) {
        return { success: false, message: 'শেষ সক্রিয় সুপার অ্যাডমিনের ভূমিকা পরিবর্তন করা অসম্ভব।' };
      }
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole,
              customPermissions: customPermissions || u.customPermissions,
              sessionVersion: (u.sessionVersion || 1) + 1,
            }
          : u
      )
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        role: newRole,
        customPermissions: customPermissions || prev.customPermissions,
      }));
    }

    try {
      await supabase
        .from('profiles')
        .update({
          role: newRole,
          custom_permissions: customPermissions || {},
          session_version: (target?.sessionVersion || 1) + 1,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase role update error:', err);
    }

    await logSecurityAction('CHANGE_ROLE', userId, targetName, `Changed role to ${newRole}`);
    return { success: true, message: `${targetName}-এর ভূমিকা সফলভাবে পরিবর্তন করা হয়েছে।` };
  };

  // 8. Force Logout
  const forceLogout = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন ফোর্স লগআউট করতে পারেন।' };
    }

    const target = usersList.find((u) => u.id === userId);
    const targetName = target?.fullName || 'User';

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, sessionVersion: (u.sessionVersion || 1) + 1 } : u))
    );

    try {
      await supabase
        .from('profiles')
        .update({ session_version: (target?.sessionVersion || 1) + 1 })
        .eq('id', userId);
    } catch {
      // Safe
    }

    await logSecurityAction('FORCE_LOGOUT', userId, targetName, 'Forced logout across all devices');
    return { success: true, message: `${targetName}-কে সমস্ত ডিভাইস থেকে সফলভাবে ফোর্স লগআউট করা হয়েছে।` };
  };

  // 9. Invite / Add Employee
  const inviteUser = async (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    branchId?: string;
    assignedLocationId?: string;
    password?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'manager') {
      return { success: false, message: 'শুধুমাত্র অ্যাডমিন ও ম্যানেজার নতুন কর্মী যুক্ত করতে পারেন।' };
    }

    const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: UserProfile = {
      id: newId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: 'active',
      languagePreference: 'bn',
      branchId: data.branchId || 'branch-khagan-01',
      assignedLocationId: data.assignedLocationId || 'loc-shop-01',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setUsersList((prev) => [newProfile, ...prev]);

    try {
      await supabase.from('profiles').insert({
        id: newId,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: 'active',
        is_active: true,
        branch_id: data.branchId || 'branch-khagan-01',
        assigned_location_id: data.assignedLocationId || 'loc-shop-01',
      });
    } catch (err) {
      console.warn('Supabase invite error:', err);
    }

    await logSecurityAction('INVITE_USER', newId, data.fullName, `Created employee with role: ${data.role}`);
    return { success: true, message: `${data.fullName}-কে সফলভাবে যুক্ত করা হয়েছে।` };
  };

  // 10. Fetch Audit Logs
  const fetchAuditLogs = async (): Promise<SecurityAuditLog[]> => {
    try {
      const { data } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const mapped: SecurityAuditLog[] = data.map((d: any) => ({
          id: d.id,
          branchId: d.branch_id,
          actorId: d.actor_id,
          actorName: d.actor_name,
          targetUserId: d.target_user_id,
          targetUserName: d.target_user_name,
          action: d.action,
          reason: d.reason,
          details: d.details,
          ipAddress: d.ip_address,
          userAgent: d.user_agent,
          createdAt: d.created_at,
        }));
        setSecurityLogs(mapped);
        return mapped;
      }
    } catch {
      // Safe
    }
    return securityLogs;
  };

  // Dev switchRole helper for testing
  const switchRole = (role: UserRole) => {
    if (DEMO_USERS[role]) {
      const u = DEMO_USERS[role];
      setCurrentUser(u);
      localStorage.setItem('khagan_auth_user_v2', JSON.stringify(u));
    }
  };

  // Granular Permissions
  const isSuperAdmin = currentUser.role === 'super_admin';
  const canAccessAdmin = currentUser.role !== 'cashier';
  const canAccessShop = ['super_admin', 'manager', 'cashier'].includes(currentUser.role);
  const canViewFinancials = ['super_admin', 'manager', 'accountant'].includes(currentUser.role);
  const canApproveBatches = ['super_admin', 'manager', 'production_manager'].includes(currentUser.role);
  const canManageSettings = currentUser.role === 'super_admin';
  const canManageUsers = currentUser.role === 'super_admin';
  const canPerformStockTransfer = ['super_admin', 'manager', 'inventory_staff'].includes(currentUser.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        usersList,
        securityLogs,
        login,
        logout,
        setupOwner,
        switchRole,
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
        canAccessAdmin,
        canAccessShop,
        canViewFinancials,
        canApproveBatches,
        canManageSettings,
        canManageUsers,
        canPerformStockTransfer,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
