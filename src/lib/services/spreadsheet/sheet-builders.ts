import {
  Product,
  RawMaterial,
  Recipe,
  ProductionBatch,
  Sale,
  Expense,
  Supplier,
  Employee,
  WasteRecord,
  InventoryLot,
  InventoryMovement,
} from '@/types';

export interface SheetData {
  sheetTitle: string;
  sheetTitleBn: string;
  headers: string[];
  rows: (string | number)[][];
}

export class SpreadsheetBuilders {
  /**
   * 1. Daily Production
   */
  static buildDailyProduction(batches: ProductionBatch[], recipes: Recipe[]): SheetData {
    const headers = [
      'Batch Number',
      'Production Date',
      'Shift',
      'Recipe Name',
      'Status',
      'Planned Qty (pcs)',
      'Saleable Qty (pcs)',
      'Rejected Qty (pcs)',
      'Yield (%)',
      'Raw Cost (BDT)',
      'Labor Cost (BDT)',
      'Utility Cost (BDT)',
      'Total Cost (BDT)',
      'Cost Per Piece (BDT)',
      'Approved At',
      'Notes',
    ];

    const rows = batches.map((b) => {
      const recipe = recipes.find((r) => r.activeVersion?.id === b.recipeVersionId || r.id === b.recipeVersionId);
      const recipeName = recipe ? (recipe.nameEn || recipe.nameBn) : (b.recipeName || 'Standard Recipe');

      return [
        b.batchNumber || b.id,
        b.productionDate || '',
        b.shift || 'Morning',
        recipeName,
        b.status,
        Number(b.plannedQuantity || 0),
        Number(b.actualSaleableOutput || 0),
        Number(b.rejectedQuantity || 0),
        Number(b.yieldPercentage || 0),
        Number(b.rawMaterialCost || 0),
        Number(b.laborCost || 0),
        Number(b.utilityCost || 0),
        Number(b.totalCost || 0),
        Number(b.costPerPiece || 0),
        b.approvedAt || '',
        b.remarks || '',
      ];
    });

    return {
      sheetTitle: 'Daily Production',
      sheetTitleBn: 'দৈনিক উৎপাদন',
      headers,
      rows,
    };
  }

  /**
   * 2. Raw Material Inventory
   */
  static buildRawMaterialInventory(rawMaterials: RawMaterial[]): SheetData {
    const headers = [
      'Material Code',
      'Material Name (EN)',
      'Material Name (BN)',
      'Category',
      'Current Stock',
      'Reorder Alert Threshold',
      'Avg Cost Per Unit (BDT)',
      'Total Stock Value (BDT)',
      'Status Alert',
    ];

    const rows = rawMaterials.map((rm) => {
      const stock = Number(rm.currentStock || 0);
      const minThreshold = Number(rm.reorderPoint || 0);
      const avgCost = Number(rm.avgCostPerUnit || 0);
      const value = stock * avgCost;
      const alert = stock <= minThreshold ? 'LOW STOCK ALERT' : 'Normal';

      return [
        rm.code,
        rm.nameEn,
        rm.nameBn,
        rm.category,
        stock,
        minThreshold,
        avgCost,
        Number(value.toFixed(2)),
        alert,
      ];
    });

    return {
      sheetTitle: 'Raw Material Inventory',
      sheetTitleBn: 'কাঁচামাল ইনভেন্টরি',
      headers,
      rows,
    };
  }

  /**
   * 3. Finished Product Stock
   */
  static buildFinishedProductStock(products: Product[], lots: InventoryLot[]): SheetData {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name (EN)',
      'Product Name (BN)',
      'Category ID',
      'Selling Price (BDT)',
      'Cost Price (BDT)',
      'Profit Margin (%)',
      'Available Stock (pcs)',
      'Total Retail Value (BDT)',
      'Total Cost Value (BDT)',
      'Shelf Life (Days)',
      'Active Status',
    ];

    const rows = products.map((p) => {
      // Aggregate available quantity from inventory lots
      const availableStock = lots
        .filter((l) => l.itemId === p.id && l.itemType === 'product')
        .reduce((sum, l) => sum + (l.currentQuantity || 0), 0);

      const salePrice = Number(p.sellingPrice || 0);
      const costPrice = Number(p.costPrice || 0);
      const margin = salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0;
      const retailVal = availableStock * salePrice;
      const costVal = availableStock * costPrice;

      return [
        p.sku,
        p.barcode || '',
        p.nameEn,
        p.nameBn,
        p.categoryId || 'General',
        salePrice,
        costPrice,
        Number(margin.toFixed(2)),
        availableStock,
        Number(retailVal.toFixed(2)),
        Number(costVal.toFixed(2)),
        p.shelfLifeDays || 3,
        p.isActive ? 'ACTIVE' : 'INACTIVE',
      ];
    });

    return {
      sheetTitle: 'Finished Product Stock',
      sheetTitleBn: 'তৈরি পণ্য মজুত',
      headers,
      rows,
    };
  }

  /**
   * 4. Daily Sales
   */
  static buildDailySales(sales: Sale[]): SheetData {
    const headers = [
      'Invoice Number',
      'Date & Time',
      'Cashier Name',
      'Customer Phone',
      'Payment Method',
      'Items Count',
      'Subtotal (BDT)',
      'Discount (BDT)',
      'VAT / Tax (BDT)',
      'Grand Total (BDT)',
      'Paid Amount (BDT)',
      'Change Amount (BDT)',
      'Total COGS (BDT)',
      'Status',
    ];

    const rows = sales.map((s) => {
      const pMethod = s.payments?.[0]?.paymentMethod || 'cash';
      return [
        s.invoiceNumber,
        s.createdAt || '',
        s.cashierName || 'Cashier',
        s.customerPhone || 'N/A',
        String(pMethod).toUpperCase(),
        s.items ? s.items.length : 0,
        Number(s.subtotal || 0),
        Number(s.discountAmount || 0),
        Number(s.taxAmount || 0),
        Number(s.grandTotal || 0),
        Number(s.paidAmount || 0),
        Number(s.changeAmount || 0),
        Number(s.totalCogs || 0),
        s.paymentStatus || 'paid',
      ];
    });

    return {
      sheetTitle: 'Daily Sales',
      sheetTitleBn: 'দৈনিক বিক্রয় খতিয়ান',
      headers,
      rows,
    };
  }

  /**
   * 5. Recipe & Product Costing
   */
  static buildRecipeCosting(recipes: Recipe[], products: Product[], rawMaterials: RawMaterial[]): SheetData {
    const headers = [
      'Recipe Name (EN)',
      'Recipe Name (BN)',
      'Associated Product',
      'Standard Batch Size',
      'Expected Output Count (pcs)',
      'Expected Output Weight (kg)',
      'Ingredients Breakdown',
      'Total Raw Cost (BDT)',
      'Target Cost Per Piece (BDT)',
      'Selling Price (BDT)',
      'Gross Profit Per Piece (BDT)',
      'Projected Gross Margin (%)',
    ];

    const rows = recipes.map((r) => {
      const product = products.find((p) => p.id === r.productId);
      let totalRawCost = 0;
      const ingredientsList = r.activeVersion?.ingredients || [];
      const ingredientsSummary = ingredientsList
        .map((ing) => {
          const rm = rawMaterials.find((m) => m.id === ing.rawMaterialId);
          const cost = (rm?.avgCostPerUnit || ing.costSnapshot || 0) * ing.quantity;
          totalRawCost += cost;
          return `${rm?.nameEn || 'Item'}: ${ing.quantity}`;
        })
        .join('; ');

      const yieldQty = r.expectedOutputCount || 1;
      const costPerPiece = yieldQty > 0 ? totalRawCost / yieldQty : 0;
      const salePrice = product?.sellingPrice || 0;
      const profitPerPiece = salePrice - costPerPiece;
      const marginPct = salePrice > 0 ? (profitPerPiece / salePrice) * 100 : 0;

      return [
        r.nameEn,
        r.nameBn,
        product ? `${product.nameEn} (${product.nameBn})` : 'N/A',
        r.standardBatchSize,
        yieldQty,
        r.expectedOutputWeightKg,
        ingredientsSummary,
        Number(totalRawCost.toFixed(2)),
        Number(costPerPiece.toFixed(2)),
        salePrice,
        Number(profitPerPiece.toFixed(2)),
        Number(marginPct.toFixed(2)),
      ];
    });

    return {
      sheetTitle: 'Recipe & Product Costing',
      sheetTitleBn: 'রেসিপি ও উৎপাদন ব্যয় বিশ্লেষণ',
      headers,
      rows,
    };
  }

  /**
   * 6. Waste Register
   */
  static buildWasteRegister(wasteRecords: WasteRecord[], products: Product[], rawMaterials: RawMaterial[]): SheetData {
    const headers = [
      'Waste ID / Number',
      'Timestamp',
      'Item Type',
      'Item Code / SKU',
      'Item Name',
      'Quantity',
      'Cost Per Unit (BDT)',
      'Total Waste Cost (BDT)',
      'Location',
      'Reason',
      'Authorized By',
    ];

    const rows = wasteRecords.map((w) => {
      let code = 'N/A';
      let name = w.itemName || 'Unknown';
      if (w.itemType === 'product') {
        const p = products.find((prod) => prod.id === w.itemId);
        if (p) {
          code = p.sku;
          name = `${p.nameEn} (${p.nameBn})`;
        }
      } else {
        const rm = rawMaterials.find((m) => m.id === w.itemId);
        if (rm) {
          code = rm.code;
          name = `${rm.nameEn} (${rm.nameBn})`;
        }
      }

      return [
        w.wasteNumber || w.id,
        w.createdAt || '',
        w.itemType === 'product' ? 'Finished Product' : 'Raw Material',
        code,
        name,
        Number(w.quantity || 0),
        Number(w.unitCost || 0),
        Number(w.totalCost || 0),
        w.locationName || w.locationId,
        w.reason || 'General Loss',
        w.authorizedBy || 'Staff',
      ];
    });

    return {
      sheetTitle: 'Waste Register',
      sheetTitleBn: 'অপচয় ও বিনষ্ট খতিয়ান',
      headers,
      rows,
    };
  }

  /**
   * 7. Purchases & Suppliers
   */
  static buildPurchasesAndSuppliers(suppliers: Supplier[]): SheetData {
    const headers = [
      'Supplier ID',
      'Company Name',
      'Contact Person',
      'Phone Number',
      'Email Address',
      'Address',
      'Opening Balance (BDT)',
      'Current Balance (BDT)',
      'Status',
    ];

    const rows = suppliers.map((s) => [
      s.id,
      s.name,
      s.contactPerson || '',
      s.phone,
      s.email || '',
      s.address || '',
      Number(s.openingBalance || 0),
      Number(s.currentBalance || 0),
      s.isActive ? 'Active' : 'Inactive',
    ]);

    return {
      sheetTitle: 'Purchases & Suppliers',
      sheetTitleBn: 'ক্রয় ও সরবরাহকারী হিসাব',
      headers,
      rows,
    };
  }

  /**
   * 8. Expenses & Utilities
   */
  static buildExpenses(expenses: Expense[]): SheetData {
    const headers = [
      'Voucher Number',
      'Expense Date',
      'Category Name',
      'Paid To',
      'Payment Method',
      'Amount (BDT)',
      'Approved By',
      'Notes',
    ];

    const rows = expenses.map((e) => [
      e.voucherNumber || e.id,
      e.expenseDate || '',
      e.categoryName || e.categoryId,
      e.paidTo || 'Vendor',
      String(e.paymentMethod).toUpperCase(),
      Number(e.amount || 0),
      e.approvedBy || 'Manager',
      e.notes || '',
    ]);

    return {
      sheetTitle: 'Expenses & Utilities',
      sheetTitleBn: 'খরচ ও ইউটিলিটি হিসাব',
      headers,
      rows,
    };
  }

  /**
   * 9. Employee Payroll
   */
  static buildEmployeePayroll(employees: Employee[]): SheetData {
    const headers = [
      'Employee Code',
      'Full Name (EN)',
      'Full Name (BN)',
      'Designation',
      'Department',
      'Phone',
      'Salary Type',
      'Base Salary (BDT)',
      'Overtime Rate / Hr',
      'Status',
      'Join Date',
    ];

    const rows = employees.map((emp) => [
      emp.employeeCode,
      emp.fullNameEn,
      emp.fullNameBn,
      emp.designation,
      emp.department.toUpperCase(),
      emp.phone,
      emp.salaryType,
      Number(emp.baseSalary || 0),
      Number(emp.overtimeRatePerHour || 0),
      emp.isActive ? 'Active' : 'Inactive',
      emp.joinDate || '',
    ]);

    return {
      sheetTitle: 'Employee Payroll',
      sheetTitleBn: 'কর্মী ও বেতন তালিকা',
      headers,
      rows,
    };
  }

  /**
   * 10. Daily Profit & Loss
   */
  static buildDailyProfitAndLoss(sales: Sale[], batches: ProductionBatch[], expenses: Expense[], waste: WasteRecord[]): SheetData {
    const headers = [
      'Date',
      'Gross Sales (BDT)',
      'Discount Given (BDT)',
      'Net Revenue (BDT)',
      'Total COGS (BDT)',
      'Gross Profit (BDT)',
      'Gross Margin (%)',
      'Production Waste Cost (BDT)',
      'Operating Expenses (BDT)',
      'Net Operating Profit (BDT)',
      'Net Margin (%)',
    ];

    const dates = new Set<string>();
    sales.forEach((s) => s.createdAt && dates.add(s.createdAt.slice(0, 10)));
    batches.forEach((b) => b.productionDate && dates.add(b.productionDate));
    expenses.forEach((e) => e.expenseDate && dates.add(e.expenseDate));

    const sortedDates = Array.from(dates).sort().reverse();
    if (sortedDates.length === 0) {
      sortedDates.push(new Date().toISOString().slice(0, 10));
    }

    const rows = sortedDates.map((dateStr) => {
      const daySales = sales.filter((s) => s.createdAt && s.createdAt.startsWith(dateStr));
      const dayExpenses = expenses.filter((e) => e.expenseDate === dateStr);
      const dayWaste = waste.filter((w) => w.createdAt && w.createdAt.startsWith(dateStr));

      const grossSales = daySales.reduce((acc, s) => acc + (s.subtotal || 0), 0);
      const discount = daySales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
      const netRevenue = daySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
      const totalCogs = daySales.reduce((acc, s) => acc + (s.totalCogs || 0), 0);

      const grossProfit = netRevenue - totalCogs;
      const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

      const wasteCost = dayWaste.reduce((acc, w) => acc + (w.totalCost || 0), 0);
      const opex = dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      const netProfit = grossProfit - wasteCost - opex;
      const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      return [
        dateStr,
        Number(grossSales.toFixed(2)),
        Number(discount.toFixed(2)),
        Number(netRevenue.toFixed(2)),
        Number(totalCogs.toFixed(2)),
        Number(grossProfit.toFixed(2)),
        Number(grossMargin.toFixed(2)),
        Number(wasteCost.toFixed(2)),
        Number(opex.toFixed(2)),
        Number(netProfit.toFixed(2)),
        Number(netMargin.toFixed(2)),
      ];
    });

    return {
      sheetTitle: 'Daily Profit & Loss',
      sheetTitleBn: 'দৈনিক লাভ-ক্ষতি বিবরণী',
      headers,
      rows,
    };
  }

  /**
   * 11. Weekly Summary
   */
  static buildWeeklySummary(sales: Sale[], batches: ProductionBatch[], expenses: Expense[]): SheetData {
    const headers = [
      'Week Period',
      'Total Batches Produced',
      'Saleable Units Produced',
      'Total Invoices',
      'Total Revenue (BDT)',
      'Total Operating Expenses (BDT)',
      'Estimated Weekly Profit (BDT)',
    ];

    const totalBatches = batches.length;
    const totalUnits = batches.reduce((acc, b) => acc + (b.actualSaleableOutput || 0), 0);
    const totalInvoices = sales.length;
    const totalRevenue = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const estimatedProfit = totalRevenue * 0.4 - totalExpenses;

    const rows = [
      [
        'Current Running Week',
        totalBatches,
        totalUnits,
        totalInvoices,
        Number(totalRevenue.toFixed(2)),
        Number(totalExpenses.toFixed(2)),
        Number(estimatedProfit.toFixed(2)),
      ],
    ];

    return {
      sheetTitle: 'Weekly Summary',
      sheetTitleBn: 'সাপ্তাহিক সংক্ষিপ্তসার',
      headers,
      rows,
    };
  }

  /**
   * 12. Monthly Summary
   */
  static buildMonthlySummary(sales: Sale[], batches: ProductionBatch[], expenses: Expense[], employees: Employee[]): SheetData {
    const headers = [
      'Month',
      'Total Sales Volume (BDT)',
      'Total Batches',
      'Total Finished Goods (pcs)',
      'Operating Expenses (BDT)',
      'Payroll Obligations (BDT)',
      'Net Operating Surplus (BDT)',
    ];

    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalSales = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalBatches = batches.length;
    const totalPcs = batches.reduce((acc, b) => acc + (b.actualSaleableOutput || 0), 0);
    const totalOpex = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalPayroll = employees.reduce((acc, emp) => acc + (emp.baseSalary || 0), 0);
    const surplus = totalSales - totalSales * 0.6 - totalOpex - totalPayroll;

    const rows = [
      [
        currentMonth,
        Number(totalSales.toFixed(2)),
        totalBatches,
        totalPcs,
        Number(totalOpex.toFixed(2)),
        Number(totalPayroll.toFixed(2)),
        Number(surplus.toFixed(2)),
      ],
    ];

    return {
      sheetTitle: 'Monthly Summary',
      sheetTitleBn: 'মাসিক সংক্ষিপ্তসার',
      headers,
      rows,
    };
  }

  /**
   * 13. Audit Log
   */
  static buildAuditLog(movements: InventoryMovement[]): SheetData {
    const headers = [
      'Log ID',
      'Timestamp',
      'Movement Type',
      'Item Type',
      'Quantity',
      'Unit Cost (BDT)',
      'Total Cost (BDT)',
      'Reference Type',
      'Actor ID',
      'Notes / Reason',
    ];

    const rows = movements.slice(0, 100).map((m) => [
      m.id,
      m.createdAt || '',
      m.movementType.toUpperCase(),
      m.itemType,
      Number(m.quantity || 0),
      Number(m.unitCost || 0),
      Number(m.totalCost || 0),
      m.referenceType || 'system',
      m.actorId || 'system',
      m.notes || '',
    ]);

    return {
      sheetTitle: 'Audit Log',
      sheetTitleBn: 'অডিট ও লেনদেন লগ',
      headers,
      rows,
    };
  }
}
