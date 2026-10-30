'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  super_admin: {
    id: 'usr-admin-01',
    fullName: 'Shuvo Ahmed (Owner)',
    phone: '01711-000001',
    role: 'super_admin',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
  },
  manager: {
    id: 'usr-mgr-01',
    fullName: 'Rafiqul Islam (Manager)',
    phone: '01711-000002',
    role: 'manager',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
  },
  production_manager: {
    id: 'usr-prod-01',
    fullName: 'Master Baker Kamal (Chef)',
    phone: '01711-000003',
    role: 'production_manager',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-kit-01',
  },
  inventory_staff: {
    id: 'usr-inv-01',
    fullName: 'Tanvir Hossain (Inventory)',
    phone: '01711-000004',
    role: 'inventory_staff',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
  },
  cashier: {
    id: 'usr-cash-01',
    fullName: 'Fatema Khatun (Cashier)',
    phone: '01711-000005',
    role: 'cashier',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-shop-01',
  },
  accountant: {
    id: 'usr-acc-01',
    fullName: 'Enamul Haque (Accountant)',
    phone: '01711-000006',
    role: 'accountant',
    languagePreference: 'bn',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-wh-01',
  },
  viewer: {
    id: 'usr-view-01',
    fullName: 'Auditor Salim (Viewer)',
    phone: '01711-000007',
    role: 'viewer',
    languagePreference: 'en',
    branchId: 'branch-khagan-01',
    assignedLocationId: 'loc-shop-01',
  },
};

interface AuthContextType {
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  canAccessAdmin: boolean;
  canAccessShop: boolean;
  canViewFinancials: boolean;
  canApproveBatches: boolean;
  canManageSettings: boolean;
  canPerformStockTransfer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.super_admin);

  useEffect(() => {
    const savedRole = localStorage.getItem('khagan_active_role') as UserRole;
    if (savedRole && DEMO_USERS[savedRole]) {
      setCurrentUser(DEMO_USERS[savedRole]);
    }
  }, []);

  const switchRole = (role: UserRole) => {
    if (DEMO_USERS[role]) {
      setCurrentUser(DEMO_USERS[role]);
      localStorage.setItem('khagan_active_role', role);
    }
  };

  // Permission logic per Master Plan
  const canAccessAdmin = currentUser.role !== 'cashier';
  const canAccessShop = ['super_admin', 'manager', 'cashier'].includes(currentUser.role);
  const canViewFinancials = ['super_admin', 'manager', 'accountant'].includes(currentUser.role);
  const canApproveBatches = ['super_admin', 'manager', 'production_manager'].includes(currentUser.role);
  const canManageSettings = currentUser.role === 'super_admin';
  const canPerformStockTransfer = ['super_admin', 'manager', 'inventory_staff'].includes(currentUser.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        canAccessAdmin,
        canAccessShop,
        canViewFinancials,
        canApproveBatches,
        canManageSettings,
        canPerformStockTransfer,
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
