export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'production_manager'
  | 'inventory_staff'
  | 'cashier'
  | 'accountant'
  | 'viewer';

export type Language = 'bn' | 'en';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  languagePreference: Language;
  branchId: string;
  assignedLocationId?: string;
  avatarUrl?: string;
}

export interface Unit {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  symbol: string;
  type: 'weight' | 'volume' | 'count' | 'packaging';
}

export interface UnitConversion {
  id: string;
  fromUnitId: string;
  toUnitId: string;
  multiplier: number; // e.g. 1 kg = 1000 g -> multiplier = 1000
}

export interface ProductCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  branchId: string;
  sku: string;
  barcode?: string;
  nameEn: string;
  nameBn: string;
  categoryId: string;
  unitId: string;
  standardPieceWeightG?: number; // e.g. 50g
  sellingPrice: number;
  costPrice: number;
  shelfLifeDays: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  price: number;
  cost: number;
  effectiveFrom: string;
  effectiveTo?: string;
  changedBy?: string;
  reason?: string;
}

export interface RawMaterial {
  id: string;
  branchId: string;
  code: string;
  nameEn: string;
  nameBn: string;
  category: string;
  baseUnitId: string; // e.g., 'g' or 'ml'
  purchaseUnitId: string; // e.g., 'kg' or 'liter'
  conversionRatio: number; // e.g. 1000 base units in 1 purchase unit
  currentStock: number; // in base units or purchase units
  avgCostPerUnit: number; // cost per purchase unit
  reorderPoint: number;
  shelfLifeDays?: number;
  storageLocation?: string;
  isActive: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipeVersionId: string;
  rawMaterialId: string;
  quantity: number; // in raw material base or purchase unit
  unitId: string;
  costSnapshot: number;
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  versionNumber: number;
  expectedOutputCount: number;
  expectedOutputWeightKg: number;
  laborCostPerBatch: number;
  overheadCostPerBatch: number;
  effectiveDate: string;
  notes?: string;
  ingredients: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  productId: string;
  nameEn: string;
  nameBn: string;
  standardBatchSize: number;
  expectedOutputCount: number;
  expectedOutputWeightKg: number;
  standardWastePct: number;
  isActive: boolean;
  activeVersion?: RecipeVersion;
}

export type BatchStatus = 'Draft' | 'Planned' | 'In Progress' | 'Completed' | 'Approved' | 'Cancelled';

export interface ProductionInputItem {
  id: string;
  batchId: string;
  rawMaterialId: string;
  plannedQuantity: number;
  actualQuantity: number;
  unitId: string;
  unitCost: number;
  totalCost: number;
}

export interface ProductionBatch {
  id: string;
  branchId: string;
  batchNumber: string;
  recipeVersionId: string;
  recipeName?: string;
  productNameEn?: string;
  productNameBn?: string;
  productionDate: string;
  shift: string;
  operatorId?: string;
  status: BatchStatus;
  plannedQuantity: number;
  actualSaleableOutput: number;
  rejectedQuantity: number;
  actualOutputWeightKg: number;
  rawMaterialCost: number;
  laborCost: number;
  utilityCost: number;
  totalCost: number;
  costPerPiece: number;
  yieldPercentage: number;
  weightVariancePct: number;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  inputs?: ProductionInputItem[];
}

export type MovementType =
  | 'purchase_receipt'
  | 'production_issue'
  | 'production_return'
  | 'finished_production_receipt'
  | 'transfer_dispatch'
  | 'transfer_receive'
  | 'sale'
  | 'return'
  | 'waste'
  | 'adjustment';

export interface InventoryMovement {
  id: string;
  branchId: string;
  movementType: MovementType;
  itemType: 'raw_material' | 'product';
  itemId: string;
  itemName?: string;
  lotId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
  actorName?: string;
  notes?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  branchId: string;
  name: string;
  type: 'warehouse' | 'kitchen' | 'shop_counter' | 'cold_storage' | 'waste_bin';
  isDefaultPos: boolean;
  isActive: boolean;
}

export interface InventoryLot {
  id: string;
  branchId: string;
  locationId: string;
  itemType: 'raw_material' | 'product';
  itemId: string;
  lotNumber: string;
  batchId?: string;
  initialQuantity: number;
  currentQuantity: number;
  unitCost: number;
  expiryDate?: string;
  receivedDate: string;
}

export type TransferStatus = 'Requested' | 'Approved' | 'Dispatched' | 'Received' | 'Cancelled';

export interface StockTransferItem {
  id: string;
  transferId: string;
  itemType: 'raw_material' | 'product';
  itemId: string;
  itemName?: string;
  quantityRequested: number;
  quantityDispatched: number;
  quantityReceived: number;
}

export interface StockTransfer {
  id: string;
  branchId: string;
  transferNumber: string;
  fromLocationId: string;
  fromLocationName?: string;
  toLocationId: string;
  toLocationName?: string;
  status: TransferStatus;
  requestedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
  items: StockTransferItem[];
  createdAt: string;
}

export interface Supplier {
  id: string;
  branchId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitId: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  id: string;
  branchId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName?: string;
  destinationLocationId: string;
  orderDate: string;
  expectedDate?: string;
  status: 'Ordered' | 'Partial Received' | 'Received' | 'Cancelled';
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  items: PurchaseItem[];
  remarks?: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  branchId: string;
  locationId: string;
  sessionNumber: string;
  cashierId: string;
  cashierName?: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  totalCashSales: number;
  totalMobileSales: number;
  totalCardSales: number;
  totalRefunds: number;
  totalPayouts: number;
  totalDrops: number;
  expectedClosingCash: number;
  countedClosingCash?: number;
  cashVariance: number;
  closingNotes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  availableStock: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productNameEn: string;
  productNameBn: string;
  quantity: number;
  unitPrice: number;
  unitCogs: number;
  discountAmount: number;
  totalPrice: number;
}

export interface PaymentRecord {
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'split';
  amount: number;
  transactionReference?: string;
}

export interface Sale {
  id: string;
  branchId: string;
  locationId: string;
  sessionId?: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName?: string;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  totalCogs: number;
  paymentStatus: 'paid' | 'partial' | 'refunded' | 'cancelled';
  status: 'completed' | 'returned' | 'cancelled';
  idempotencyKey?: string;
  items: SaleItem[];
  payments: PaymentRecord[];
  createdAt: string;
}

export interface WasteRecord {
  id: string;
  branchId: string;
  locationId: string;
  locationName?: string;
  wasteNumber: string;
  itemType: 'raw_material' | 'product';
  itemId: string;
  itemName?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  disposalMethod?: string;
  authorizedBy?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  isUtility: boolean;
  isActive: boolean;
}

export interface Expense {
  id: string;
  branchId: string;
  voucherNumber: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'bkash' | 'nagad';
  paidTo: string;
  expenseDate: string;
  approvedBy?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  branchId: string;
  employeeCode: string;
  fullNameEn: string;
  fullNameBn: string;
  phone: string;
  nationalId?: string;
  designation: string;
  department: 'production' | 'shop' | 'management' | 'cleaning' | 'delivery';
  joinDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  overtimeRatePerHour: number;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  shift: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'paid_leave';
  overtimeHours: number;
}

export interface PayrollItem {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  advanceDeduction: number;
  penaltyDeduction: number;
  netPayable: number;
  paymentStatus: 'unpaid' | 'paid';
}

export interface PayrollPeriod {
  id: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'paid';
  items?: PayrollItem[];
}

