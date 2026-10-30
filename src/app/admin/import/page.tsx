'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useDatabase } from '@/lib/db/store';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Package,
  Layers,
  Truck,
  Users,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ImportType = 'products' | 'ingredients' | 'suppliers' | 'employees';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ExcelMigrationPage() {
  const { t, locale } = useTranslation();
  const { addProduct, addRawMaterial, addSupplier, addEmployee, products, rawMaterials } = useDatabase();

  const [activeImportType, setActiveImportType] = useState<ImportType>('products');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Template generators
  const downloadTemplate = (type: ImportType) => {
    let headers: any[] = [];
    let filename = '';

    if (type === 'products') {
      headers = [
        {
          SKU: 'PRD-TEST-001',
          Name_Bangla: 'স্পেশাল মিল্ক বান',
          Name_English: 'Special Milk Bun',
          Category: 'cat-bread',
          Selling_Price: 30,
          Cost_Price: 15,
          Standard_Weight_G: 80,
          Shelf_Life_Days: 2,
        },
      ];
      filename = 'products_import_template.xlsx';
    } else if (type === 'ingredients') {
      headers = [
        {
          Item_Code: 'RM-YST-002',
          Name_Bangla: 'বেকার্স ড্রাই ইস্ট',
          Name_English: 'Bakers Dry Yeast',
          Category: 'Leavening Agents',
          Current_Stock_KG: 10,
          Avg_Cost_Per_KG: 450,
          Reorder_Point_KG: 2,
        },
      ];
      filename = 'raw_materials_import_template.xlsx';
    } else if (type === 'suppliers') {
      headers = [
        {
          Supplier_Name: 'মেঘনা সুগার মিলস',
          Contact_Person: 'জাহিদ হোসেন',
          Phone: '01712-334455',
          Address: 'মেঘনাঘাট, নারায়ণগঞ্জ',
          Opening_Balance: 0,
        },
      ];
      filename = 'suppliers_import_template.xlsx';
    } else if (type === 'employees') {
      headers = [
        {
          Employee_Code: 'KB-EMP-010',
          Full_Name_Bangla: 'মোঃ জাহিদ হাসান',
          Full_Name_English: 'Md. Zahid Hasan',
          Phone: '01819-112233',
          Designation: 'সহকারী কারিগর',
          Department: 'production',
          Base_Salary: 16000,
        },
      ];
      filename = 'employees_import_template.xlsx';
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  // File Upload and Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSuccess(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        validateAndPreview(data, activeImportType);
      } catch (err) {
        alert('ফাইল পড়তে ত্রুটি হয়েছে। দয়া করে সঠিক এক্সেল (.xlsx) ফাইল নির্বাচন করুন।');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Validation Engine
  const validateAndPreview = (data: any[], type: ImportType) => {
    const errors: ValidationError[] = [];
    const validRows: any[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for 1-indexed and header row

      if (type === 'products') {
        if (!row.SKU) errors.push({ row: rowNum, field: 'SKU', message: 'এসকেইউ কোড আবশ্যক' });
        if (!row.Name_Bangla) errors.push({ row: rowNum, field: 'Name_Bangla', message: 'বাংলা নাম আবশ্যক' });
        if (!row.Selling_Price || Number(row.Selling_Price) <= 0) {
          errors.push({ row: rowNum, field: 'Selling_Price', message: 'বিক্রয় মূল্য অবশ্যই ০ এর বেশি হতে হবে' });
        }
        // Duplicate check against existing catalog
        if (products.some((p) => p.sku === row.SKU)) {
          errors.push({ row: rowNum, field: 'SKU', message: `এসকেইউ ${row.SKU} ইতিমধ্যে ক্যাটালগে বিদ্যমান` });
        }
      } else if (type === 'ingredients') {
        if (!row.Item_Code) errors.push({ row: rowNum, field: 'Item_Code', message: 'কাঁচামাল কোড আবশ্যক' });
        if (!row.Name_Bangla) errors.push({ row: rowNum, field: 'Name_Bangla', message: 'বাংলা নাম আবশ্যক' });
        if (rawMaterials.some((m) => m.code === row.Item_Code)) {
          errors.push({ row: rowNum, field: 'Item_Code', message: `কোড ${row.Item_Code} ইতিমধ্যে ব্যবহৃত` });
        }
      } else if (type === 'suppliers') {
        if (!row.Supplier_Name) errors.push({ row: rowNum, field: 'Supplier_Name', message: 'প্রতিষ্ঠানের নাম আবশ্যক' });
        if (!row.Phone) errors.push({ row: rowNum, field: 'Phone', message: 'ফোন নম্বর আবশ্যক' });
      } else if (type === 'employees') {
        if (!row.Employee_Code) errors.push({ row: rowNum, field: 'Employee_Code', message: 'কর্মী কোড আবশ্যক' });
        if (!row.Full_Name_Bangla) errors.push({ row: rowNum, field: 'Full_Name_Bangla', message: 'কর্মীর নাম আবশ্যক' });
      }

      validRows.push(row);
    });

    setValidationErrors(errors);
    setParsedData(validRows);
  };

  // Commit Import
  const handleConfirmImport = () => {
    if (validationErrors.length > 0) {
      alert('ত্রুটিযুক্ত ডেটা ইম্পোর্ট করা সম্ভব নয়। দয়া করে তালিকা সংশোধন করুন।');
      return;
    }

    if (activeImportType === 'products') {
      parsedData.forEach((row) => {
        addProduct({
          branchId: 'branch-khagan-01',
          sku: row.SKU,
          nameBn: row.Name_Bangla,
          nameEn: row.Name_English || row.Name_Bangla,
          categoryId: row.Category || 'cat-bread',
          unitId: 'u-pcs',
          sellingPrice: Number(row.Selling_Price) || 0,
          costPrice: Number(row.Cost_Price) || 0,
          standardPieceWeightG: Number(row.Standard_Weight_G) || 0,
          shelfLifeDays: Number(row.Shelf_Life_Days) || 2,
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        });
      });
    } else if (activeImportType === 'ingredients') {
      parsedData.forEach((row) => {
        addRawMaterial({
          branchId: 'branch-khagan-01',
          code: row.Item_Code,
          nameBn: row.Name_Bangla,
          nameEn: row.Name_English || row.Name_Bangla,
          category: row.Category || 'General',
          baseUnitId: 'u-kg',
          purchaseUnitId: 'u-kg',
          conversionRatio: 1,
          currentStock: Number(row.Current_Stock_KG) || 0,
          avgCostPerUnit: Number(row.Avg_Cost_Per_KG) || 0,
          reorderPoint: Number(row.Reorder_Point_KG) || 5,
          shelfLifeDays: 90,
          isActive: true,
        });
      });
    } else if (activeImportType === 'suppliers') {
      parsedData.forEach((row) => {
        addSupplier({
          branchId: 'branch-khagan-01',
          name: row.Supplier_Name,
          contactPerson: row.Contact_Person || '',
          phone: row.Phone,
          address: row.Address || '',
          openingBalance: Number(row.Opening_Balance) || 0,
          currentBalance: Number(row.Opening_Balance) || 0,
          isActive: true,
        });
      });
    } else if (activeImportType === 'employees') {
      parsedData.forEach((row) => {
        addEmployee({
          branchId: 'branch-khagan-01',
          employeeCode: row.Employee_Code,
          fullNameBn: row.Full_Name_Bangla,
          fullNameEn: row.Full_Name_English || row.Full_Name_Bangla,
          phone: row.Phone || '01700-000000',
          designation: row.Designation || 'কর্মচারী',
          department: row.Department || 'production',
          joinDate: new Date().toISOString().slice(0, 10),
          salaryType: 'monthly',
          baseSalary: Number(row.Base_Salary) || 15000,
          overtimeRatePerHour: 100,
          isActive: true,
        });
      });
    }

    setImportSuccess(`${parsedData.length} টি রেকর্ড সফলভাবে ডেটাবেজে যুক্ত হয়েছে এবং অডিট লগ সংরক্ষিত হয়েছে!`);
    setParsedData([]);
    setFileName(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B22]">এক্সেল ডেটা মাইগ্রেশন ও বাল্ক ইম্পোর্ট</h1>
          <p className="text-xs sm:text-sm text-[#5C7567] mt-0.5">
            মাস্টার প্ল্যান সেকশন ১৪: টেমপ্লেট ডাউনলোড, প্রিভিউ, ডুপ্লিকেট ভ্যালিডেশন এবং নিরাপদ বাল্ক ইম্পোর্ট
          </p>
        </div>
      </div>

      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}

      {/* Import Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'products', label: 'পণ্য মাস্টার (Products)', icon: Package },
          { id: 'ingredients', label: 'কাঁচামাল মাস্টার (Materials)', icon: Layers },
          { id: 'suppliers', label: 'সরবরাহকারী (Suppliers)', icon: Truck },
          { id: 'employees', label: 'কর্মী তালিকা (Employees)', icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeImportType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveImportType(item.id as any);
                setParsedData([]);
                setValidationErrors([]);
                setFileName(null);
                setImportSuccess(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                isActive
                  ? 'border-[#176B45] bg-[#EAF5EE] text-[#104C34] ring-1 ring-[#176B45]'
                  : 'border-[#D1E2D7] bg-white hover:bg-[#F7F9F8] text-[#172B22]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-[#176B45] text-white' : 'bg-gray-100 text-[#5C7567]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs">{item.label}</p>
                <p className="text-[10px] text-[#5C7567]">টেমপ্লেট ও ইম্পোর্ট</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload and Template Action Box */}
      <Card>
        <CardHeader className="py-4 bg-[#F7F9F8] border-b border-[#D1E2D7]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-[#176B45]" />
              <span>এক্সেল ফাইল আপলোড ও টেমপ্লেট নির্দেশিকা</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(activeImportType)}
              className="text-xs h-8"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-[#176B45]" />
              <span>নমুনা টেমপ্লেট ডাউনলোড করুন (.xlsx)</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-[#D1E2D7] rounded-2xl p-8 text-center space-y-3 bg-[#F7F9F8]/60 hover:bg-[#EAF5EE]/30 transition-colors">
            <Upload className="w-10 h-10 mx-auto text-[#176B45]" />
            <div>
              <p className="text-sm font-bold text-[#172B22]">
                কম্পিউটার হতে আপনার প্রস্তুতকৃত এক্সেল (.xlsx) ফাইল নির্বাচন করুন
              </p>
              <p className="text-xs text-[#5C7567] mt-1">
                ফাইল আপলোডের সাথে সাথে সিস্টেম স্বয়ংক্রিয়ভাবে ফিল্ড যাচাই ও ভুল শনাক্ত করবে।
              </p>
            </div>

            <label className="inline-block cursor-pointer">
              <Button size="sm" className="bg-[#176B45] text-xs pointer-events-none">
                ফাইল ব্রাউজ করুন
              </Button>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileName && (
              <p className="text-xs font-semibold text-[#104C34] pt-2">
                নির্বাচিত ফাইল: <strong>{fileName}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors Box if any */}
      {validationErrors.length > 0 && (
        <Card className="border-rose-300 bg-rose-50/50">
          <CardHeader className="py-3 px-4 bg-rose-100/60 border-b border-rose-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <CardTitle className="text-sm text-rose-900">
                ভুল শনাক্ত হয়েছে ({validationErrors.length} টি ত্রুটি) — সংশোধন প্রয়োজন
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-center space-x-2 text-rose-700 bg-white p-2 rounded-lg border border-rose-200">
                  <span className="font-mono font-bold bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                    সারি #{err.row}
                  </span>
                  <span className="font-semibold">{err.field}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">ইম্পোর্ট প্রিভিউ ({parsedData.length} টি সারি)</CardTitle>
                <p className="text-xs text-[#5C7567]">
                  {validationErrors.length === 0 ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ সকল ডেটা সঠিক রয়েছে। আপনি ইম্পোর্ট সম্পন্ন করতে পারেন।
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">
                      ✗ ত্রুটি থাকায় ইম্পোর্ট বাটন নিষ্ক্রিয় রয়েছে।
                    </span>
                  )}
                </p>
              </div>
              <Button
                disabled={validationErrors.length > 0}
                onClick={handleConfirmImport}
                className="bg-[#176B45] text-xs h-9"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>ইম্পোর্ট নিশ্চিত করুন &rarr;</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F9F8] text-[#5C7567] border-b border-[#D1E2D7] sticky top-0">
                  <tr>
                    {Object.keys(parsedData[0] || {}).map((key) => (
                      <th key={key} className="py-2.5 px-3 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E2D7]/60">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#EAF5EE]/40">
                      {Object.values(row).map((val: any, cidx) => (
                        <td key={cidx} className="py-2.5 px-3 text-[#172B22]">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

