import {
  RAB_CATEGORIES,
  RABCategory,
  RABItem,
  Project,
  ProjectStatus,
  PriceItem,
  PriceItemType,
  ItemType,
  AHSPItem,
  AHSPComponent,
} from '../types';
import { DrawingAnalysis, ProjectDrawing } from '../types/drawing';
import { ScheduleItem } from '../types/scurve';
import { RABTemplate, RABTemplateItem } from '../types/template';

/**
 * Normalisasi nama kategori pekerjaan ke salah satu dari 14 kategori resmi SNI.
 */
export function normalizeCategory(rawCat?: string): RABCategory {
  if (!rawCat || typeof rawCat !== 'string') return 'Lain-lain';

  const clean = rawCat.trim().toLowerCase();

  if (/persiapan|mobilisasi|demobilisasi|bouwplank|pagar|direksi|gudang/.test(clean)) {
    return 'Pekerjaan Persiapan';
  }
  if (/tanah|galian|urug|timbunan|pemadatan|stripping|land clearing/.test(clean)) {
    return 'Pekerjaan Tanah';
  }
  if (/pondasi|batu kali|footplat|pile cap|tiang pancang|bored pile|strauss|cakar ayam/.test(clean)) {
    return 'Pekerjaan Pondasi';
  }
  if (/struktur|beton|sloof|kolom|balok|plat|pembesian|bekisting|ring balk|dak/.test(clean)) {
    return 'Pekerjaan Struktur';
  }
  if (/dinding|bata|hebel|batako|plester|acian|partisi|gypsum board/.test(clean)) {
    return 'Pekerjaan Dinding';
  }
  if (/lantai|keramik|granit|marmer|vinyl|parket|screed|epoxy/.test(clean)) {
    return 'Pekerjaan Lantai';
  }
  if (/atap|genteng|spandek|baja ringan|kuda-kuda|nok|talang|lisplang|membrane/.test(clean)) {
    return 'Pekerjaan Atap';
  }
  if (/plafon|plafond|ceiling|gypsum|triplek|grc|hollow/.test(clean)) {
    return 'Pekerjaan Plafon';
  }
  if (/pintu|jendela|kusen|door|window|kaca|engsel|kunci|handle|aluminium/.test(clean)) {
    return 'Pekerjaan Pintu dan Jendela';
  }
  if (/listrik|electrical|lampu|kabel|saklar|stop kontak|panel|mcb|armatur|grounding/.test(clean)) {
    return 'Pekerjaan Instalasi Listrik';
  }
  if (/sanitasi|plumbing|pipa|kloset|toilet|wastafel|urinoir|septic|kran|pompa|drainase/.test(clean)) {
    return 'Pekerjaan Sanitasi';
  }
  if (/cat|pengecatan|painting|plamir|waterproofing|coating|sealer/.test(clean)) {
    return 'Pekerjaan Pengecatan';
  }
  if (/akhir|finishing|pembersihan akhir|cleaning|serah terima/.test(clean)) {
    return 'Pekerjaan Akhir';
  }

  // Exact match search among official categories
  const exactMatch = RAB_CATEGORIES.find((c) => c.toLowerCase() === clean);
  if (exactMatch) return exactMatch;

  return 'Lain-lain';
}

/**
 * Normalisasi data Project dari berbagai variasi field alias (misal docNumber, ownerName, contractorName).
 */
export function normalizeProject(raw: any, fallbackUserId: string = 'usr_admin_main'): Project {
  if (!raw || typeof raw !== 'object') {
    const nowStr = new Date().toISOString().split('T')[0];
    return {
      id: `proj_${Date.now()}`,
      userId: fallbackUserId,
      name: 'Proyek Baru',
      documentNo: `RAB/${new Date().getFullYear()}/001`,
      clientName: 'Pemilik Proyek',
      location: 'Indonesia',
      contractor: 'PT. Citra Kusuma Development',
      consultant: 'Tim Konsultan Perencana',
      createdAt: nowStr,
      startDate: nowStr,
      endDate: '',
      notes: '',
      status: 'Draft',
      overheadPercent: 5,
      profitPercent: 10,
      taxPercent: 0,
    };
  }

  const id = raw.id || `proj_${Date.now()}`;
  const userId = raw.userId || fallbackUserId;
  const name = String(raw.name || raw.projectName || 'Proyek Tanpa Nama').trim();
  const documentNo = String(raw.documentNo || raw.docNumber || raw.documentNumber || `RAB/${new Date().getFullYear()}/001`).trim();
  const clientName = String(raw.clientName || raw.ownerName || raw.client || '-').trim();
  const location = String(raw.location || raw.address || raw.projectLocation || '-').trim();
  const contractor = String(raw.contractor || raw.contractorName || '-').trim();
  const consultant = String(raw.consultant || raw.consultantName || '-').trim();
  const createdAt = raw.createdAt || new Date().toISOString().split('T')[0];
  const startDate = raw.startDate || raw.start_date || createdAt;
  const endDate = raw.endDate || raw.end_date || '';
  const notes = String(raw.notes || raw.description || '').trim();

  let status: ProjectStatus = 'Draft';
  if (raw.status === 'Berjalan' || raw.status === 'in_progress' || raw.status === 'active') {
    status = 'Berjalan';
  } else if (raw.status === 'Selesai' || raw.status === 'completed' || raw.status === 'done') {
    status = 'Selesai';
  }

  const overheadPercent = Math.max(0, Number(raw.overheadPercent ?? raw.overhead ?? 5));
  const profitPercent = Math.max(0, Number(raw.profitPercent ?? raw.profit ?? 10));
  const taxPercent = Math.max(0, Number(raw.taxPercent ?? raw.tax ?? 0));

  return {
    id,
    userId,
    name,
    documentNo,
    clientName,
    location,
    contractor,
    consultant,
    createdAt,
    startDate,
    endDate,
    notes,
    status,
    overheadPercent,
    profitPercent,
    taxPercent,
  };
}

/**
 * Normalisasi data RAB Item, memastikan nilai numerik, kategori baku, dan total cost akurat.
 */
export function normalizeRABItem(raw: any, projectId: string = ''): RABItem {
  const id = raw.id || `rab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const pId = raw.projectId || projectId || '';
  const code = String(raw.code || raw.itemCode || raw.workCode || 'P-01').trim();
  const name = String(raw.name || raw.workName || raw.description || 'Pos Pekerjaan').trim();
  const category = normalizeCategory(raw.category || raw.rabCategory);
  const unit = String(raw.unit || raw.uom || 'ls').trim();
  const volume = Math.max(0, Number(raw.volume ?? raw.vol ?? raw.qty ?? 0));
  const unitPrice = Math.max(0, Number(raw.unitPrice ?? raw.price ?? raw.rate ?? 0));
  const totalCost = Number((volume * unitPrice).toFixed(0));
  const weightPercent = typeof raw.weightPercent === 'number' ? raw.weightPercent : undefined;
  const notes = raw.notes || raw.remarks || raw.formulaExplanation || '';
  const sortOrder = typeof raw.sortOrder === 'number' ? raw.sortOrder : 0;
  const sourceType = raw.sourceType || 'manual';
  const sourceId = raw.sourceId;
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : undefined;
  const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions : [];
  const needsVerification = typeof raw.needsVerification === 'boolean' ? raw.needsVerification : (sourceType === 'ai');
  const verificationStatus = raw.verificationStatus || (needsVerification ? 'pending' : 'verified');
  const warnings = Array.isArray(raw.warnings) ? raw.warnings : [];

  return {
    id,
    projectId: pId,
    code,
    name,
    category,
    unit,
    volume,
    unitPrice,
    totalCost,
    weightPercent,
    notes,
    sortOrder,
    sourceType,
    sourceId,
    confidence,
    assumptions,
    needsVerification,
    verificationStatus,
    warnings,
  };
}

/**
 * Normalisasi data PriceItem di database harga
 */
export function normalizePriceItem(raw: any, fallbackUserId: string = 'usr_admin_main'): PriceItem {
  const id = raw.id || `prc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userId = raw.userId || fallbackUserId;
  const code = String(raw.code || raw.itemCode || 'MAT-01').trim();
  const name = String(raw.name || raw.itemName || raw.description || 'Material / Upah').trim();
  
  let type: PriceItemType = 'material';
  const rawType = String(raw.type || raw.category || '').toLowerCase();
  if (rawType.includes('labor') || rawType.includes('upah') || rawType.includes('tukang') || rawType.includes('pekerja')) {
    type = 'labor';
  } else if (rawType.includes('equipment') || rawType.includes('alat') || rawType.includes('sewa')) {
    type = 'equipment';
  }

  const category = String(raw.category || (type === 'material' ? 'Bahan' : type === 'labor' ? 'Upah' : 'Alat')).trim();
  const unit = String(raw.unit || 'ls').trim();
  const price = Math.max(0, Number(raw.price ?? raw.unitPrice ?? 0));
  const source = String(raw.source || 'SNI / PUPR').trim();
  const updatedAt = raw.updatedAt || raw.lastUpdated || new Date().toISOString().split('T')[0];

  return {
    id,
    userId,
    code,
    name,
    type,
    category,
    unit,
    price,
    source,
    updatedAt,
  };
}

/**
 * Normalisasi data AHSP Item
 */
export function normalizeAHSPItem(raw: any, fallbackUserId: string = 'usr_admin_main'): AHSPItem {
  const id = raw.id || `ahsp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userId = raw.userId || fallbackUserId;
  const code = String(raw.code || raw.kode || raw.ahspCode || 'A.1.1').trim();
  const name = String(raw.name || raw.nama || raw.workName || 'Analisis Pekerjaan').trim();
  const category = String(raw.category || raw.kategori || 'Pekerjaan Struktur').trim();
  const subCategory = String(raw.subCategory || raw.subKategori || '').trim();
  const unit = String(raw.unit || raw.satuan || 'm³').trim();
  const sniReference = raw.sniReference || raw.notes || '';
  const tahun = Number(raw.tahun || 2026);
  const sumberData = raw.sumberData || 'SNI 2026';
  const lastUpdated = raw.lastUpdated || new Date().toISOString();
  const provinsi = raw.provinsi || 'Nasional (Jabodetabek)';

  let components: AHSPComponent[] = [];
  const rawList = Array.isArray(raw.components) ? raw.components : (Array.isArray(raw.koefisien) ? raw.koefisien : null);

  if (rawList) {
    components = rawList.map((c: any, idx: number) => {
      const rawType = String(c.type || c.tipe || 'material').toLowerCase();
      let normalizedType: ItemType = 'material';
      if (rawType === 'labor' || rawType === 'upah' || rawType === 'tenaga' || rawType === 'pekerja') {
        normalizedType = 'labor';
      } else if (rawType === 'equipment' || rawType === 'alat' || rawType === 'peralatan') {
        normalizedType = 'equipment';
      }

      const coefficient = Math.max(0, Number(c.coefficient ?? c.koefisien ?? c.koef ?? 0));
      const unitPrice = Math.max(0, Number(c.unitPrice ?? c.hargaSatuan ?? c.harga ?? 0));
      const totalCost = Math.max(0, Number(c.totalCost ?? c.total ?? (coefficient * unitPrice)));

      return {
        id: c.id || `comp_${idx}`,
        priceItemId: c.priceItemId || c.kode,
        name: String(c.name || c.nama || 'Komponen').trim(),
        type: normalizedType,
        unit: String(c.unit || c.satuan || 'satuan').trim(),
        coefficient,
        unitPrice,
        totalCost,
        spesifikasi: c.spesifikasi,
      };
    });
  } else {
    // If structured in materials, labors, equipments
    const materials = Array.isArray(raw.materials) ? raw.materials : [];
    const labors = Array.isArray(raw.labors) ? raw.labors : [];
    const equipments = Array.isArray(raw.equipments) ? raw.equipments : [];

    const mapItem = (item: any, type: ItemType, idx: number): AHSPComponent => {
      const coefficient = Math.max(0, Number(item.coefficient ?? item.koefisien ?? item.koef ?? 0));
      const unitPrice = Math.max(0, Number(item.unitPrice ?? item.hargaSatuan ?? item.harga ?? 0));
      const totalCost = Math.max(0, Number(item.totalCost ?? item.total ?? (coefficient * unitPrice)));

      return {
        id: item.id || `comp_${type}_${idx}`,
        priceItemId: item.priceItemId || item.kode,
        name: String(item.name || item.nama || item.description || 'Komponen').trim(),
        type,
        unit: String(item.unit || item.satuan || 'satuan').trim(),
        coefficient,
        unitPrice,
        totalCost,
        spesifikasi: item.spesifikasi,
      };
    };

    components = [
      ...materials.map((m: any, i: number) => mapItem(m, 'material', i)),
      ...labors.map((l: any, i: number) => mapItem(l, 'labor', i)),
      ...equipments.map((e: any, i: number) => mapItem(e, 'equipment', i)),
    ];
  }

  const calculatedUnitPrice = components.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  const unitPrice = raw.unitPrice ? Math.max(0, Number(raw.unitPrice)) : (raw.totalHarga ? Math.max(0, Number(raw.totalHarga)) : calculatedUnitPrice);

  return {
    id,
    userId,
    code,
    name,
    category,
    subCategory,
    subKategori: subCategory,
    unit,
    components,
    unitPrice,
    notes: raw.notes || raw.sniReference || '',
    sniReference,
    tahun,
    sumberData,
    lastUpdated,
    provinsi,
  };
}
