import ExcelJS from 'exceljs';
import { RAB_CATEGORIES, RABCategory } from '../types/rab';
import {
  RABTemplateItem,
  RABImportJob,
  ColumnMappingConfig,
  VerificationStatus,
  RABTemplate,
} from '../types/template';

// Column Synonyms for auto-mapping
export const COLUMN_SYNONYMS: Record<keyof ColumnMappingConfig, string[]> = {
  itemCode: ['kode', 'kode pekerjaan', 'no', 'nomor', 'item no', 'code', 'wbs', 'no.'],
  description: [
    'uraian',
    'uraian pekerjaan',
    'nama pekerjaan',
    'item pekerjaan',
    'deskripsi',
    'pekerjaan',
    'description',
    'work item',
    'nama item',
    'item',
  ],
  category: ['kategori', 'kategori pekerjaan', 'category', 'bagian', 'tahap', 'group', 'divisi'],
  subcategory: ['subkategori', 'sub kategori', 'sub-kategori', 'sub category', 'subgroup'],
  unit: ['satuan', 'unit', 'sat', 'uom', 'sat.'],
  volume: ['volume', 'vol', 'qty', 'kuantitas', 'jumlah volume', 'quantity', 'jml vol'],
  unitPrice: ['harga satuan', 'harga', 'unit price', 'rate', 'hrg sat', 'harga satuan (rp)', 'harga (rp)'],
  calculatedAmount: ['jumlah biaya', 'jumlah harga', 'total', 'amount', 'total harga', 'total biaya', 'subtotal', 'jumlah (rp)'],
  materialCoefficient: ['koef bahan', 'koefisien bahan', 'material coeff', 'koef. bahan'],
  laborCoefficient: ['koef upah', 'koefisien tenaga', 'koefisien upah', 'labor coeff', 'koef. tenaga'],
  equipmentCoefficient: ['koef alat', 'koefisien alat', 'koefisien peralatan', 'equipment coeff', 'koef. alat'],
  overhead: ['overhead', 'oh', 'biaya umum', 'overhead (%)'],
  profit: ['profit', 'keuntungan', 'laba', 'margin', 'profit (%)'],
  tax: ['pajak', 'ppn', 'tax', 'ppn 11%', 'pajak (%)'],
  notes: ['catatan', 'keterangan', 'spesifikasi', 'notes', 'remarks', 'ket', 'ket.'],
  priceSource: ['sumber', 'sumber harga', 'referensi', 'price source', 'vendor', 'ahsp'],
};

/**
 * Normalizes number formats (handles Indonesian: 1.500.000,50 & International: 1,500,000.50)
 */
export function parseLocalizedNumber(raw: any): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;

  let str = String(raw).trim();
  if (!str) return 0;

  // Remove currency prefixes & symbols
  str = str.replace(/[RpIDR$\s]/gi, '').trim();

  // If contains parentheses e.g. (1000) for negative
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1).trim();
  }

  // Detect format:
  // If has both . and ,
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Indonesian format: 1.250.000,50 -> 1250000.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // International format: 1,250,000.50 -> 1250000.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only commas: e.g. "12,5" (Indonesian decimal) or "1,500" (thousand separator)
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 3) {
      // Treat as decimal comma (12,5 -> 12.5)
      str = str.replace(',', '.');
    } else {
      // Treat as thousands
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Only dots: e.g. "1.500.000" (thousands) vs "12.5" (decimal)
    const parts = str.split('.');
    if (parts.length > 2) {
      // Definitely thousands: 1.500.000 -> 1500000
      str = str.replace(/\./g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3 && parts[0].length <= 3) {
        // e.g. "1.500" could be thousands -> 1500
        str = str.replace(/\./g, '');
      }
      // Else keep as decimal "12.5"
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Match category name against standard RAB categories
 */
export function matchStandardCategory(rawCategory: string): RABCategory {
  if (!rawCategory) return 'Lain-lain';
  const clean = rawCategory.trim().toLowerCase();

  for (const cat of RAB_CATEGORIES) {
    if (clean.includes(cat.toLowerCase())) return cat;
  }

  if (clean.includes('persiapan') || clean.includes('prelim') || clean.includes('awal')) return 'Pekerjaan Persiapan';
  if (clean.includes('tanah') || clean.includes('galian') || clean.includes('urugan') || clean.includes('earth')) return 'Pekerjaan Tanah';
  if (clean.includes('pondasi') || clean.includes('batu kali') || clean.includes('footplat') || clean.includes('foundation')) return 'Pekerjaan Pondasi';
  if (clean.includes('struktur') || clean.includes('beton') || clean.includes('sloof') || clean.includes('kolom') || clean.includes('balok') || clean.includes('structure')) return 'Pekerjaan Struktur';
  if (clean.includes('dinding') || clean.includes('bata') || clean.includes('hebel') || clean.includes('plester') || clean.includes('wall')) return 'Pekerjaan Dinding';
  if (clean.includes('lantai') || clean.includes('keramik') || clean.includes('granit') || clean.includes('floor')) return 'Pekerjaan Lantai';
  if (clean.includes('atap') || clean.includes('kuda-kuda') || clean.includes('genteng') || clean.includes('roof')) return 'Pekerjaan Atap';
  if (clean.includes('plafon') || clean.includes('gypsum') || clean.includes('ceiling')) return 'Pekerjaan Plafon';
  if (clean.includes('pintu') || clean.includes('jendela') || clean.includes('kusen') || clean.includes('door') || clean.includes('window')) return 'Pekerjaan Pintu dan Jendela';
  if (clean.includes('listrik') || clean.includes('lampu') || clean.includes('elektrik') || clean.includes('electrical')) return 'Pekerjaan Instalasi Listrik';
  if (clean.includes('sanitasi') || clean.includes('pipa') || clean.includes('plumbing') || clean.includes('toilet') || clean.includes('kloset')) return 'Pekerjaan Sanitasi';
  if (clean.includes('cat') || clean.includes('pengecatan') || clean.includes('paint')) return 'Pekerjaan Pengecatan';
  if (clean.includes('akhir') || clean.includes('finishing') || clean.includes('pembersihan')) return 'Pekerjaan Akhir';

  return 'Lain-lain';
}

/**
 * Checks if a row text represents a category/section header (e.g. "I. PEKERJAAN PERSIAPAN", "DIVISI 1", "A. Pekerjaan Tanah")
 */
export function isCategoryHeaderRow(rowValues: string[]): { isHeader: boolean; categoryName?: string } {
  const text = rowValues.filter(Boolean).join(' ').trim();
  if (!text) return { isHeader: false };

  // Roman numeral or alphabet header: "I. PEKERJAAN...", "A. PEKERJAAN...", "BAB 1...", "DIVISI 1..."
  const headerPatterns = [
    /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\.\s+(.+)$/i,
    /^([A-Z])\.\s+(.+)$/i,
    /^(PEKERJAAN|DIVISI|BAGIAN|PASAL|SUB)\s+([A-Z0-9.\-_]+)\s*[:\-]?\s*(.*)$/i,
  ];

  for (const pat of headerPatterns) {
    if (pat.test(text)) {
      return { isHeader: true, categoryName: text };
    }
  }

  // If text contains any known RAB category in uppercase/bold format and is the only text on the row
  for (const cat of RAB_CATEGORIES) {
    if (text.toUpperCase().includes(cat.toUpperCase()) && rowValues.filter(Boolean).length <= 2) {
      return { isHeader: true, categoryName: text };
    }
  }

  return { isHeader: false };
}

/**
 * Detects if a row is a summary / subtotal / total / tax / profit / overhead row
 */
export function isSummaryRow(rowValues: string[]): boolean {
  const text = rowValues.filter(Boolean).join(' ').toLowerCase();
  const summaryKeywords = [
    'sub total',
    'subtotal',
    'jumlah biaya langsung',
    'jumlah harga pekerjaan',
    'total direct cost',
    'overhead',
    'profit',
    'keuntungan',
    'jasa kontraktor',
    'ppn',
    'pajak',
    'grand total',
    'total anggaran',
    'jumlah total',
    'dibulatkan',
    'terbilang',
  ];

  return summaryKeywords.some((kw) => text.includes(kw));
}

/**
 * Auto-detect column mappings from header row
 */
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    if (!header) return;
    const cleanH = header.trim().toLowerCase();

    for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
      if (!mapping[field]) {
        const matched = synonyms.some(
          (syn) => cleanH === syn || cleanH.startsWith(syn + ' ') || cleanH.includes(syn)
        );
        if (matched) {
          mapping[field] = header;
        }
      }
    }
  });

  return mapping;
}

/**
 * Parses raw ArrayBuffer / base64 of Excel (.xlsx, .xls) or CSV
 */
export async function parseSpreadsheetData(
  fileBuffer: ArrayBuffer,
  fileName: string,
  userId: string,
  userFileDataUrl?: string
): Promise<RABImportJob> {
  const isCSV = fileName.toLowerCase().endsWith('.csv');
  const fileType = isCSV
    ? 'csv'
    : fileName.toLowerCase().endsWith('.xls')
    ? 'xls'
    : 'xlsx';

  const workbook = new ExcelJS.Workbook();
  let rawMatrix: any[][] = [];
  if (isCSV) {
    // Basic CSV parsing for now (or could use workbook.csv.load)
    const text = new TextDecoder().decode(fileBuffer);
    const rows = text.split('\n');
    rawMatrix = rows.map(r => r.split(','));
  } else {
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];
    if (worksheet) {
      worksheet.eachRow((row) => {
        const rowVals = row.values;
        if (Array.isArray(rowVals)) {
          // exceljs starts at index 1
          rawMatrix.push(rowVals.slice(1).map(val => {
            if (val && typeof val === 'object' && 'result' in val) return (val as any).result;
            if (val && typeof val === 'object' && 'text' in val) return (val as any).text;
            return val;
          }));
        }
      });
    }
  }

  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('File kosong atau tidak memiliki data tabel yang valid.');
  }

  // Step 1: Find Table Header Row (Find row with highest keyword match)
  let headerRowIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < Math.min(rawMatrix.length, 15); i++) {
    const row = rawMatrix[i];
    if (!row || !Array.isArray(row)) continue;

    let score = 0;
    const rowStr = row.map((c) => String(c).trim().toLowerCase()).join(' ');

    ['uraian', 'pekerjaan', 'item', 'volume', 'harga', 'satuan', 'sat', 'total', 'jumlah', 'kode'].forEach(
      (kw) => {
        if (rowStr.includes(kw)) score += 2;
      }
    );

    if (score > maxScore && score >= 2) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const rawHeaders: string[] = (rawMatrix[headerRowIndex] || []).map((c) => String(c).trim());
  const detectedHeaders = rawHeaders.filter(Boolean);

  const columnMapping = autoDetectColumnMapping(detectedHeaders);

  // Parse items from subsequent rows
  const parsedItems: RABTemplateItem[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const categorySubtotals: Record<string, number> = {};

  let currentCategory: RABCategory = 'Pekerjaan Persiapan';
  let fileCalculatedTotal = 0;
  let runningSortOrder = 1;

  const dataRows = rawMatrix.slice(headerRowIndex + 1);

  dataRows.forEach((row, rowIdx) => {
    const actualRowNum = headerRowIndex + 2 + rowIdx;
    const rowStrings = row.map((c) => String(c || '').trim());

    // Skip empty rows
    if (rowStrings.every((s) => !s)) return;

    // Check for Section / Category Header
    const catCheck = isCategoryHeaderRow(rowStrings);
    if (catCheck.isHeader && catCheck.categoryName) {
      currentCategory = matchStandardCategory(catCheck.categoryName);
      return;
    }

    // Check for Summary / Subtotal Row
    if (isSummaryRow(rowStrings)) {
      // Try to extract grand total if present
      const numValues = row.map(parseLocalizedNumber).filter((n) => n > 0);
      if (numValues.length > 0) {
        const potentialTotal = Math.max(...numValues);
        const rowText = rowStrings.join(' ').toLowerCase();
        if (rowText.includes('grand total') || rowText.includes('total') || rowText.includes('jumlah')) {
          if (potentialTotal > fileCalculatedTotal) {
            fileCalculatedTotal = potentialTotal;
          }
        }
      }
      return;
    }

    // Map row cells to fields using columnMapping
    const getVal = (field: keyof ColumnMappingConfig): any => {
      const headerName = columnMapping[field];
      if (!headerName) return undefined;
      const colIdx = rawHeaders.findIndex((h) => h.toLowerCase() === headerName.toLowerCase());
      return colIdx !== -1 ? row[colIdx] : undefined;
    };

    let itemCode = String(getVal('itemCode') || '').trim();
    let description = String(getVal('description') || '').trim();
    let rowCategory = String(getVal('category') || '').trim();
    let subcategory = String(getVal('subcategory') || '').trim();
    let unit = String(getVal('unit') || '').trim();
    let volumeRaw = getVal('volume');
    let unitPriceRaw = getVal('unitPrice');
    let amountRaw = getVal('calculatedAmount');
    let notes = String(getVal('notes') || '').trim();
    let priceSource = String(getVal('priceSource') || '').trim();

    // Heuristics if description wasn't properly mapped
    if (!description) {
      const stringCells = rowStrings.filter((s) => s.length > 3 && isNaN(Number(s)) && !s.startsWith('Rp'));
      if (stringCells.length > 0) {
        description = stringCells[0];
      }
    }

    if (!description || description.length < 2) {
      // Row doesn't have valid description, skip or log warning
      return;
    }

    const volume = parseLocalizedNumber(volumeRaw);
    const unitPrice = parseLocalizedNumber(unitPriceRaw);
    const fileAmount = parseLocalizedNumber(amountRaw);

    const calculatedAmount = volume * unitPrice;
    const itemCategory = rowCategory ? matchStandardCategory(rowCategory) : currentCategory;

    // Track category subtotals
    categorySubtotals[itemCategory] = (categorySubtotals[itemCategory] || 0) + calculatedAmount;

    // Validation
    const itemWarnings: string[] = [];
    const itemErrors: string[] = [];
    let verificationStatus: VerificationStatus = 'verified';

    if (!unit) {
      itemWarnings.push('Satuan belum ditentukan');
      verificationStatus = 'needs_verification';
    }

    if (volume <= 0) {
      itemWarnings.push('Volume nol atau belum diisi');
      verificationStatus = 'needs_verification';
    }

    if (unitPrice <= 0) {
      itemWarnings.push('Harga satuan nol atau belum diisi');
      verificationStatus = 'needs_verification';
    }

    if (fileAmount > 0 && Math.abs(fileAmount - calculatedAmount) > 100) {
      itemWarnings.push(
        `Selisih jumlah harga pada file (Rp ${fileAmount.toLocaleString('id-ID')}) vs perhitungan sistem (Rp ${calculatedAmount.toLocaleString('id-ID')})`
      );
    }

    if (!itemCode) {
      itemCode = `${itemCategory.substring(0, 3).toUpperCase()}-${String(runningSortOrder).padStart(2, '0')}`;
    }

    const templateItem: RABTemplateItem = {
      id: `tpl_item_${Date.now()}_${runningSortOrder}`,
      templateId: '',
      category: itemCategory,
      subcategory: subcategory || undefined,
      itemCode,
      description,
      unit: unit || 'ls',
      volume: volume > 0 ? volume : 1,
      unitPrice: unitPrice > 0 ? unitPrice : (fileAmount > 0 && volume > 0 ? fileAmount / volume : 0),
      calculatedAmount: calculatedAmount > 0 ? calculatedAmount : fileAmount,
      notes: notes || undefined,
      priceSource: priceSource || 'File Import',
      sourceRowNumber: actualRowNum,
      confidenceScore: verificationStatus === 'verified' ? 98 : 75,
      verificationStatus,
      validationWarnings: itemWarnings.length > 0 ? itemWarnings : undefined,
      validationErrors: itemErrors.length > 0 ? itemErrors : undefined,
      sortOrder: runningSortOrder++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    parsedItems.push(templateItem);
  });

  const systemCalculatedTotal = parsedItems.reduce((sum, it) => sum + it.calculatedAmount, 0);
  if (fileCalculatedTotal === 0) {
    fileCalculatedTotal = systemCalculatedTotal;
  }
  const totalDifference = Math.abs(systemCalculatedTotal - fileCalculatedTotal);

  if (totalDifference > 1000) {
    warnings.push(
      `Terdapat selisih Rp ${totalDifference.toLocaleString('id-ID')} antara total pada file dan hasil perkalian Volume × Harga Satuan sistem.`
    );
  }

  const needsVerificationCount = parsedItems.filter(
    (i) => i.verificationStatus === 'needs_verification' || i.verificationStatus === 'error'
  ).length;

  const importJob: RABImportJob = {
    id: `job_${Date.now()}`,
    userId,
    fileName,
    fileType: fileType as any,
    fileSize: fileBuffer.byteLength,
    fileDataUrl: userFileDataUrl,
    status: 'parsed',
    progress: 100,
    totalRows: dataRows.length,
    processedRows: parsedItems.length,
    successCount: parsedItems.length - needsVerificationCount,
    warningCount: needsVerificationCount,
    errorCount: errors.length,
    errorDetails: errors,
    warnings,
    detectedHeaders,
    columnMapping,
    rawRows: rawMatrix.slice(headerRowIndex, headerRowIndex + 25), // Store preview of raw rows
    parsedItems,
    fileCalculatedTotal,
    systemCalculatedTotal,
    totalDifference,
    confidenceScore: needsVerificationCount > 0 ? 82 : 98,
    categorySubtotals,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  return importJob;
}

/**
 * Normalizes OCR result from Server Gemini Vision for PDF and Images
 */
export function normalizeOCRResult(
  ocrData: any,
  fileName: string,
  userId: string,
  fileDataUrl?: string
): RABImportJob {
  const detectedHeaders = ocrData.detectedHeaders || [
    'Kode',
    'Uraian Pekerjaan',
    'Kategori',
    'Satuan',
    'Volume',
    'Harga Satuan',
    'Jumlah Harga',
  ];

  const rawItems = ocrData.items || ocrData.estimatedItems || [];
  const parsedItems: RABTemplateItem[] = [];
  const categorySubtotals: Record<string, number> = {};

  rawItems.forEach((it: any, idx: number) => {
    const category = matchStandardCategory(it.category || it.kategori || '');
    const volume = parseLocalizedNumber(it.volume || it.qty || 1);
    const unitPrice = parseLocalizedNumber(it.unitPrice || it.hargaSatuan || 0);
    const calculatedAmount = volume * unitPrice;
    const confidence = typeof it.confidenceScore === 'number' ? it.confidenceScore : 85;

    categorySubtotals[category] = (categorySubtotals[category] || 0) + calculatedAmount;

    let verificationStatus: VerificationStatus = 'verified';
    const itemWarnings: string[] = [];

    if (confidence < 80 || it.needsVerification) {
      verificationStatus = 'needs_verification';
      itemWarnings.push('Hasil pembacaan OCR perlu verifikasi visual');
    }
    if (!it.unit || it.unit === '-') {
      verificationStatus = 'needs_verification';
      itemWarnings.push('Satuan pekerjaan tidak terbaca jelas');
    }
    if (unitPrice <= 0) {
      verificationStatus = 'needs_verification';
      itemWarnings.push('Harga satuan belum terisi');
    }

    parsedItems.push({
      id: `ocr_item_${Date.now()}_${idx + 1}`,
      templateId: '',
      category,
      itemCode: it.code || it.workCode || `${category.substring(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
      description: it.name || it.description || it.uraian || 'Item Pekerjaan OCR',
      unit: it.unit || 'ls',
      volume: volume > 0 ? volume : 1,
      unitPrice: unitPrice,
      calculatedAmount,
      notes: it.notes || it.keterangan || (confidence < 80 ? 'Pembacaan OCR tingkat keyakinan sedang' : undefined),
      priceSource: 'OCR AI Vision',
      sourceRowNumber: idx + 1,
      confidenceScore: confidence,
      verificationStatus,
      validationWarnings: itemWarnings.length > 0 ? itemWarnings : undefined,
      sortOrder: idx + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  const systemCalculatedTotal = parsedItems.reduce((sum, it) => sum + it.calculatedAmount, 0);
  const fileCalculatedTotal = parseLocalizedNumber(ocrData.fileTotal || ocrData.grandTotal || systemCalculatedTotal);
  const needsVerificationCount = parsedItems.filter((i) => i.verificationStatus !== 'verified').length;

  const ext = fileName.split('.').pop()?.toLowerCase() || 'png';

  return {
    id: `ocr_job_${Date.now()}`,
    userId,
    fileName,
    fileType: ext as any,
    fileSize: 0,
    fileDataUrl,
    status: 'parsed',
    progress: 100,
    totalRows: parsedItems.length,
    processedRows: parsedItems.length,
    successCount: parsedItems.length - needsVerificationCount,
    warningCount: needsVerificationCount,
    errorCount: 0,
    errorDetails: [],
    warnings: ocrData.qualityWarning ? [ocrData.qualityWarning] : [],
    detectedHeaders,
    columnMapping: {
      itemCode: 'Kode',
      description: 'Uraian Pekerjaan',
      category: 'Kategori',
      unit: 'Satuan',
      volume: 'Volume',
      unitPrice: 'Harga Satuan',
      calculatedAmount: 'Jumlah Harga',
    },
    rawRows: [],
    parsedItems,
    fileCalculatedTotal,
    systemCalculatedTotal,
    totalDifference: Math.abs(systemCalculatedTotal - fileCalculatedTotal),
    confidenceScore: ocrData.confidenceScore || 88,
    categorySubtotals,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

/**
 * Generates an Excel (.xlsx) file download from a RABTemplate
 */
export async function exportTemplateToExcel(template: RABTemplate) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Template RAB');

  const headerData = [
    ['TEMPLATE MASTER RENCANA ANGGARAN BIAYA (RAB)'],
    ['Nama Template:', template.name],
    ['Deskripsi:', template.description || '-'],
    ['Kategori / Tipe Proyek:', `${template.category} - ${template.projectType}`],
    ['Versi:', `v${template.version}`],
    ['Status:', template.status.toUpperCase()],
    ['Tanggal Dibuat / Update:', `${template.createdAt.split('T')[0]} / ${template.updatedAt.split('T')[0]}`],
    [],
    ['NO', 'KODE', 'URAIAN PEKERJAAN', 'KATEGORI', 'SATUAN', 'VOLUME', 'HARGA SATUAN (RP)', 'JUMLAH HARGA (RP)', 'CATATAN / SPESIFIKASI'],
  ];

  headerData.forEach(row => ws.addRow(row));

  let rowCounter = 1;
  const categoriesPresent = Array.from(new Set(template.items.map((i) => i.category)));

  categoriesPresent.forEach((cat) => {
    const catItems = template.items.filter((i) => i.category === cat);
    const catSubtotal = catItems.reduce((s, it) => s + it.calculatedAmount, 0);

    // Section Header
    ws.addRow(['', '', cat.toUpperCase(), '', '', '', '', '', '']);

    catItems.forEach((item) => {
      ws.addRow([
        rowCounter++,
        item.itemCode,
        item.description,
        item.category,
        item.unit,
        item.volume,
        item.unitPrice,
        item.calculatedAmount,
        item.notes || '',
      ]);
    });

    // Subtotal Row
    ws.addRow(['', '', `SUBTOTAL ${cat.toUpperCase()}`, '', '', '', '', catSubtotal, '']);
    ws.addRow([]);
  });

  const directCost = template.estimatedTotal;
  const overhead = (directCost * template.defaultOverhead) / 100;
  const profit = (directCost * template.defaultProfit) / 100;
  const subtotalBeforeTax = directCost + overhead + profit;
  const tax = (subtotalBeforeTax * template.defaultTax) / 100;
  const grandTotal = subtotalBeforeTax + tax;

  ws.addRow(['', '', 'TOTAL BIAYA LANGSUNG (DIRECT COST)', '', '', '', '', directCost, '']);
  ws.addRow(['', '', `OVERHEAD (${template.defaultOverhead}%)`, '', '', '', '', overhead, '']);
  ws.addRow(['', '', `PROFIT KONTRAKTOR (${template.defaultProfit}%)`, '', '', '', '', profit, '']);
  ws.addRow(['', '', `PAJAK PPN (${template.defaultTax}%)`, '', '', '', '', tax, '']);
  ws.addRow(['', '', 'GRAND TOTAL ESTIMASI BIAYA', '', '', '', '', grandTotal, '']);

  ws.columns = [
    { width: 6 },
    { width: 12 },
    { width: 45 },
    { width: 24 },
    { width: 10 },
    { width: 12 },
    { width: 20 },
    { width: 22 },
    { width: 35 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeFileName = `${template.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${template.version}.xlsx`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = safeFileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Generates a CSV file
*/
export function exportTemplateToCSV(template: RABTemplate) {
  const headers = ['No', 'Kode Pekerjaan', 'Uraian Pekerjaan', 'Kategori', 'Satuan', 'Volume', 'Harga Satuan', 'Jumlah Harga', 'Catatan'];
  const rows = template.items.map((item, idx) => [
    idx + 1,
    `"${item.itemCode}"`,
    `"${item.description.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    `"${item.unit}"`,
    item.volume,
    item.unitPrice,
    item.calculatedAmount,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${template.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${template.version}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
