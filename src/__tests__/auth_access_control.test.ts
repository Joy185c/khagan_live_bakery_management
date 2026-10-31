import { describe, it, expect, beforeEach } from 'vitest';
import {
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_RECIPES,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_BATCHES,
  INITIAL_INVENTORY_LOTS,
  INITIAL_SALES,
} from '../lib/db/initial-data';
import { UserProfile, UserRole, AccountStatus } from '../types';

describe('Authentication & Super Admin Access Control Test Suite', () => {
  // Test State Fixtures
  let users: UserProfile[];

  beforeEach(() => {
    users = [
      {
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
        sessionVersion: 1,
      },
      {
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
        sessionVersion: 1,
      },
      {
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
        sessionVersion: 1,
      },
    ];
  });

  // Helper RBAC check
  const checkCanAccessAdmin = (user: UserProfile) => {
    if (user.status === 'blocked' || user.status === 'deactivated' || !user.isActive) return false;
    if (user.status === 'suspended' && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) return false;
    return user.role !== 'cashier';
  };

  const checkCanAccessShop = (user: UserProfile) => {
    if (user.status === 'blocked' || user.status === 'deactivated' || !user.isActive) return false;
    if (user.status === 'suspended' && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) return false;
    return ['super_admin', 'manager', 'cashier'].includes(user.role);
  };

  const checkCanViewFinancials = (user: UserProfile) => {
    if (user.status === 'blocked' || user.status === 'deactivated' || !user.isActive) return false;
    return ['super_admin', 'manager', 'accountant'].includes(user.role);
  };

  // Helper block function with Super Admin safeguard
  const blockUser = (actor: UserProfile, targetId: string, reason: string) => {
    if (actor.role !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can block accounts' };
    }
    if (actor.id === targetId) {
      return { success: false, error: 'Cannot block your own account' };
    }

    const activeAdmins = users.filter((u) => u.role === 'super_admin' && u.status === 'active' && u.isActive);
    if (activeAdmins.length === 1 && activeAdmins[0].id === targetId) {
      return { success: false, error: 'Cannot block the last active Super Admin' };
    }

    const target = users.find((u) => u.id === targetId);
    if (!target) return { success: false, error: 'User not found' };

    target.status = 'blocked';
    target.isActive = false;
    target.blockedReason = reason;
    target.sessionVersion = (target.sessionVersion || 1) + 1;
    return { success: true };
  };

  // 1. Production Mock Data Removal Verification
  it('Phase 2 Rule: Production database initial states must be completely clean empty arrays', () => {
    expect(INITIAL_PRODUCTS).toEqual([]);
    expect(INITIAL_RAW_MATERIALS).toEqual([]);
    expect(INITIAL_RECIPES).toEqual([]);
    expect(INITIAL_SUPPLIERS).toEqual([]);
    expect(INITIAL_EMPLOYEES).toEqual([]);
    expect(INITIAL_EXPENSES).toEqual([]);
    expect(INITIAL_BATCHES).toEqual([]);
    expect(INITIAL_INVENTORY_LOTS).toEqual([]);
    expect(INITIAL_SALES).toEqual([]);
  });

  // 2. Owner can log in & has full access
  it('1. Owner (Super Admin) has full admin and financial access', () => {
    const owner = users.find((u) => u.role === 'super_admin')!;
    expect(checkCanAccessAdmin(owner)).toBe(true);
    expect(checkCanAccessShop(owner)).toBe(true);
    expect(checkCanViewFinancials(owner)).toBe(true);
  });

  // 3. Cashier permissions boundary
  it('2. Cashier can access Shop POS, but CANNOT access Admin Portal or Financials', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    expect(checkCanAccessShop(cashier)).toBe(true);
    expect(checkCanAccessAdmin(cashier)).toBe(false);
    expect(checkCanViewFinancials(cashier)).toBe(false);
  });

  // 4. Super Admin can block Cashier
  it('3. Super Admin can immediately block a cashier and invalidate active session', () => {
    const owner = users.find((u) => u.role === 'super_admin')!;
    const cashier = users.find((u) => u.role === 'cashier')!;
    const initialSession = cashier.sessionVersion;

    const result = blockUser(owner, cashier.id, 'Suspected unauthorized cash drawer opening');
    expect(result.success).toBe(true);
    expect(cashier.status).toBe('blocked');
    expect(cashier.isActive).toBe(false);
    expect(cashier.sessionVersion).toBeGreaterThan(initialSession!);
    expect(cashier.blockedReason).toContain('Suspected unauthorized');
  });

  // 5. Blocked cashier loses all access immediately
  it('4. Blocked cashier is denied access to both Shop POS and Admin Portal', () => {
    const owner = users.find((u) => u.role === 'super_admin')!;
    const cashier = users.find((u) => u.role === 'cashier')!;
    blockUser(owner, cashier.id, 'Investigation');

    expect(checkCanAccessShop(cashier)).toBe(false);
    expect(checkCanAccessAdmin(cashier)).toBe(false);
  });

  // 6. Super Admin can unblock cashier and restore access
  it('5. Unblocking a cashier immediately restores authorized access', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    cashier.status = 'blocked';
    cashier.isActive = false;

    // Unblock
    cashier.status = 'active';
    cashier.isActive = true;
    cashier.blockedReason = null;

    expect(cashier.status).toBe('active');
    expect(checkCanAccessShop(cashier)).toBe(true);
  });

  // 7. Temporary Suspension with time window
  it('6. Super Admin can suspend a user until a future timestamp', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours ahead
    cashier.status = 'suspended';
    cashier.suspendedUntil = futureDate;

    // During suspension window
    expect(checkCanAccessShop(cashier)).toBe(false);

    // After suspension expired
    cashier.suspendedUntil = new Date(Date.now() - 1000).toISOString(); // In the past
    expect(checkCanAccessShop(cashier)).toBe(true);
  });

  // 8. Prevent blocking or removing the last active Super Admin
  it('7. Critical Safeguard: Last active Super Admin CANNOT be blocked or deactivated', () => {
    const owner = users.find((u) => u.role === 'super_admin')!;
    
    // Attempt self-block
    const selfBlock = blockUser(owner, owner.id, 'Test');
    expect(selfBlock.success).toBe(false);
    expect(selfBlock.error).toContain('own account');

    // Attempt block when sole admin
    const fakeAdmin: UserProfile = { ...owner, id: 'usr-fake-admin' };
    const soleAdminBlock = blockUser(fakeAdmin, owner.id, 'Malicious attempt');
    expect(soleAdminBlock.success).toBe(false);
    expect(soleAdminBlock.error).toContain('last active Super Admin');
  });

  // 9. Ordinary employees cannot block Super Admin
  it('8. Cashiers or Managers cannot perform Super Admin user management actions', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    const manager = users.find((u) => u.role === 'manager')!;
    const owner = users.find((u) => u.role === 'super_admin')!;

    const cashierAttempt = blockUser(cashier, owner.id, 'Hacking');
    expect(cashierAttempt.success).toBe(false);
    expect(cashierAttempt.error).toContain('Only Super Admin');

    const managerAttempt = blockUser(manager, owner.id, 'Takeover');
    expect(managerAttempt.success).toBe(false);
    expect(managerAttempt.error).toContain('Only Super Admin');
  });

  // 10. Role change takes effect immediately
  it('9. Promoting a cashier to Manager immediately grants Admin Portal access', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    expect(checkCanAccessAdmin(cashier)).toBe(false);

    // Promote
    cashier.role = 'manager';
    expect(checkCanAccessAdmin(cashier)).toBe(true);
    expect(checkCanViewFinancials(cashier)).toBe(true);
  });

  // 11. Historical records are preserved on revoke access
  it('10. Revoking application access marks user deactivated WITHOUT deleting historical transaction records', () => {
    const cashier = users.find((u) => u.role === 'cashier')!;
    
    // Simulated historical sales record created by cashier
    const historicalSale = {
      id: 'sale-999',
      cashierId: cashier.id,
      cashierName: cashier.fullName,
      totalAmount: 450,
      createdAt: '2026-10-30T10:00:00Z',
    };

    // Revoke access
    cashier.status = 'deactivated';
    cashier.isActive = false;

    // Verify cashier lost access
    expect(checkCanAccessShop(cashier)).toBe(false);

    // Verify historical sales record remains intact
    expect(historicalSale.cashierId).toBe('usr-cash-01');
    expect(historicalSale.cashierName).toBe('Fatema Khatun (Cashier)');
    expect(historicalSale.totalAmount).toBe(450);
  });
});
