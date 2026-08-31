import {
  QuickBuilderMethod,
  BuildingTypeOption,
  QuickBuilderProjectData,
  QuickBuilderDraftItem,
  QuickBuilderSummary,
  RABCategory,
  RAB_CATEGORIES,
  Project,
  RABItem,
  AHSPItem,
  PriceItem,
  RABTemplate,
} from '../types';
import { calculateRAB } from '../utils/calculations';
import { ZeroMistakeEngine } from './zeroMistakeEngine';
import { RevisionService } from './revisionService';
import { normalizeCategory, normalizeRABItem } from '../utils/normalizers';

export interface PresetBuildingConfig {
  id: BuildingTypeOption;
  name: string;
  description: string;
  defaultArea: number;
  areaUnit: string;
  estimatedCostPerM2: number;
  categories: RABCategory[];
  sampleItems: Array<{
    code: string;
    name: string;
    category: RABCategory;
    unit: string;
    volumeMultiplierPerM2: number;
    baseUnitPrice: number;
  }>;
}

export const PRESET_BUILDING_CONFIGS: Record<BuildingTypeOption, PresetBuildingConfig> = {
  simple_house_36_45: {
    id: 'simple_house_36_45',
    name: 'Rumah Sederhana (Tipe 36/45)',
    description: 'Konstruksi 1 lantai standar ekonomis, pondasi batu kali, struktur beton bertulang, atap baja ringan.',
    defaultArea: 36,
    areaUnit: 'm²',
    estimatedCostPerM2: 3500000,
    categories: [
      'Pekerjaan Persiapan',
      'Pekerjaan Tanah',
      'Pekerjaan Pondasi',
      'Pekerjaan Struktur',
      'Pekerjaan Dinding',
      'Pekerjaan Lantai',
      'Pekerjaan Atap',
      'Pekerjaan Plafon',
      'Pekerjaan Pintu dan Jendela',
      'Pekerjaan Instalasi Listrik',
      'Pekerjaan Sanitasi',
      'Pekerjaan Pengecatan',
      'Pekerjaan Akhir',
    ],
    sampleItems: [
      { code: '01.01', name: 'Pengukuran dan Pemasangan Bouwplank', category: 'Pekerjaan Persiapan', unit: 'm¹', volumeMultiplierPerM2: 0.8, baseUnitPrice: 48500 },
      { code: '01.02', name: 'Pembersihan Lapangan dan Perataan', category: 'Pekerjaan Persiapan', unit: 'm²', volumeMultiplierPerM2: 1.2, baseUnitPrice: 18500 },
      { code: '02.01', name: 'Galian Tanah Pondasi Batu Kali', category: 'Pekerjaan Tanah', unit: 'm³', volumeMultiplierPerM2: 0.45, baseUnitPrice: 85000 },
      { code: '02.02', name: 'Urugan Pasir Bawah Pondasi t=5cm', category: 'Pekerjaan Tanah', unit: 'm³', volumeMultiplierPerM2: 0.08, baseUnitPrice: 245000 },
      { code: '03.01', name: 'Pasangan Pondasi Batu Kali 1:4', category: 'Pekerjaan Pondasi', unit: 'm³', volumeMultiplierPerM2: 0.35, baseUnitPrice: 950000 },
      { code: '04.01', name: 'Beton Bertulang Sloof 15/20 Mutu K-175', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.045, baseUnitPrice: 4850000 },
      { code: '04.02', name: 'Beton Bertulang Kolom Praktis 15/15', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.035, baseUnitPrice: 5200000 },
      { code: '04.03', name: 'Beton Bertulang Ringbalk 15/15', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.04, baseUnitPrice: 4950000 },
      { code: '05.01', name: 'Pasangan Dinding Bata Ringan (Hebel) t=10cm', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 2.8, baseUnitPrice: 145000 },
      { code: '05.02', name: 'Plesteran dan Acian Dinding 1:4', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 5.6, baseUnitPrice: 75000 },
      { code: '06.01', name: 'Pasang Lantai Keramik 40x40 Polos', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 0.9, baseUnitPrice: 185000 },
      { code: '07.01', name: 'Rangka Atap Baja Ringan C75.75 + Genteng Metal', category: 'Pekerjaan Atap', unit: 'm²', volumeMultiplierPerM2: 1.25, baseUnitPrice: 265000 },
      { code: '08.01', name: 'Plafon Gypsum Board 9mm + Rangka Hollow', category: 'Pekerjaan Plafon', unit: 'm²', volumeMultiplierPerM2: 0.9, baseUnitPrice: 115000 },
      { code: '09.01', name: 'Kusen dan Daun Pintu Kayu Kamper / Alumunium', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.1, baseUnitPrice: 1850000 },
      { code: '10.01', name: 'Titik Lampu Penerangan + Stop Kontak NYM 3x2.5', category: 'Pekerjaan Instalasi Listrik', unit: 'titik', volumeMultiplierPerM2: 0.35, baseUnitPrice: 225000 },
      { code: '11.01', name: 'Instalasi Pipa Air Bersih PVC AW 3/4"', category: 'Pekerjaan Sanitasi', unit: 'm¹', volumeMultiplierPerM2: 0.6, baseUnitPrice: 42000 },
      { code: '11.02', name: 'Kloset Jongkok Porselen + Bak Mandi', category: 'Pekerjaan Sanitasi', unit: 'unit', volumeMultiplierPerM2: 0.03, baseUnitPrice: 650000 },
      { code: '12.01', name: 'Pengecatan Dinding Interior & Eksterior (Cat Tembok Emulsi)', category: 'Pekerjaan Pengecatan', unit: 'm²', volumeMultiplierPerM2: 5.6, baseUnitPrice: 32500 },
      { code: '13.01', name: 'Pembersihan Akhir Proyek', category: 'Pekerjaan Akhir', unit: 'ls', volumeMultiplierPerM2: 0.02, baseUnitPrice: 500000 },
    ],
  },
  residential_single_storey: {
    id: 'residential_single_storey',
    name: 'Rumah Tinggal Standar 1 Lantai',
    description: 'Rumah tinggal menengah luas 60–100 m² dengan spesifikasi standar SNI dan finishing rapi.',
    defaultArea: 72,
    areaUnit: 'm²',
    estimatedCostPerM2: 4200000,
    categories: [...RAB_CATEGORIES],
    sampleItems: [
      { code: '01.01', name: 'Pengukuran dan Pasang Bouwplank', category: 'Pekerjaan Persiapan', unit: 'm¹', volumeMultiplierPerM2: 0.9, baseUnitPrice: 55000 },
      { code: '02.01', name: 'Galian Tanah Pondasi Tapak & Menerus', category: 'Pekerjaan Tanah', unit: 'm³', volumeMultiplierPerM2: 0.5, baseUnitPrice: 95000 },
      { code: '03.01', name: 'Pondasi Batu Belah 1:3 & Footplat Beton', category: 'Pekerjaan Pondasi', unit: 'm³', volumeMultiplierPerM2: 0.4, baseUnitPrice: 1100000 },
      { code: '04.01', name: 'Struktur Beton Bertulang K-225 (Sloof, Kolom, Balok)', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.12, baseUnitPrice: 5450000 },
      { code: '05.01', name: 'Dinding Bata Ringan 10cm + Acian Mortar Instan', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 3.2, baseUnitPrice: 235000 },
      { code: '06.01', name: 'Lantai Granit Tile 60x60 Polish', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 0.95, baseUnitPrice: 295000 },
      { code: '07.01', name: 'Kuda-Kuda Baja Ringan + Genteng Keramik Glazur', category: 'Pekerjaan Atap', unit: 'm²', volumeMultiplierPerM2: 1.3, baseUnitPrice: 345000 },
      { code: '08.01', name: 'Plafon Gypsum Board 9mm + Drop Ceiling', category: 'Pekerjaan Plafon', unit: 'm²', volumeMultiplierPerM2: 0.95, baseUnitPrice: 135000 },
      { code: '09.01', name: 'Pintu & Jendela Alumunium Powder Coating 4"', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.12, baseUnitPrice: 2450000 },
      { code: '10.01', name: 'Instalasi Titik Lampu LED Downlight & Stop Kontak', category: 'Pekerjaan Instalasi Listrik', unit: 'titik', volumeMultiplierPerM2: 0.45, baseUnitPrice: 265000 },
      { code: '11.01', name: 'Kloset Duduk Monoblok + Shower Set + Pipa Air', category: 'Pekerjaan Sanitasi', unit: 'set', volumeMultiplierPerM2: 0.03, baseUnitPrice: 3200000 },
      { code: '12.01', name: 'Pengecatan Dinding Cat Weatherproof & Interior Premium', category: 'Pekerjaan Pengecatan', unit: 'm²', volumeMultiplierPerM2: 6.4, baseUnitPrice: 42000 },
    ],
  },
  residential_two_storey: {
    id: 'residential_two_storey',
    name: 'Rumah Tinggal 2 Lantai Modern',
    description: 'Rumah 2 lantai dengan struktur plat lantai beton bondek/konvensional, pondasi cakar ayam / tiang pancang mini.',
    defaultArea: 120,
    areaUnit: 'm²',
    estimatedCostPerM2: 5500000,
    categories: [...RAB_CATEGORIES],
    sampleItems: [
      { code: '01.01', name: 'Pekerjaan Persiapan, Direksi Keet & Bouwplank', category: 'Pekerjaan Persiapan', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 7500000 },
      { code: '02.01', name: 'Galian Tanah Pondasi Footplat & Sloof', category: 'Pekerjaan Tanah', unit: 'm³', volumeMultiplierPerM2: 0.6, baseUnitPrice: 95000 },
      { code: '03.01', name: 'Pondasi Telapak / Footplat Beton K-250 (100x100x30)', category: 'Pekerjaan Pondasi', unit: 'm³', volumeMultiplierPerM2: 0.15, baseUnitPrice: 5850000 },
      { code: '04.01', name: 'Struktur Beton Bertulang K-250 (Sloof & Kolom Utama 25/25)', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.12, baseUnitPrice: 5850000 },
      { code: '04.02', name: 'Plat Lantai 2 Beton Bertulang t=12cm (Wiremesh M8)', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.08, baseUnitPrice: 6200000 },
      { code: '04.03', name: 'Tangga Beton Bertulang + Railing Minimalis', category: 'Pekerjaan Struktur', unit: 'unit', volumeMultiplierPerM2: 0.01, baseUnitPrice: 12500000 },
      { code: '05.01', name: 'Pasangan Dinding Bata Ringan + Plester Acian', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 4.5, baseUnitPrice: 245000 },
      { code: '06.01', name: 'Lantai Granit Homogeneous Tile 60x60', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 1.0, baseUnitPrice: 325000 },
      { code: '07.01', name: 'Atap Baja Ringan + Genteng Flat Beton', category: 'Pekerjaan Atap', unit: 'm²', volumeMultiplierPerM2: 0.75, baseUnitPrice: 365000 },
      { code: '08.01', name: 'Plafon Gypsum Board Rangka Metal Furing', category: 'Pekerjaan Plafon', unit: 'm²', volumeMultiplierPerM2: 1.0, baseUnitPrice: 145000 },
      { code: '09.01', name: 'Pintu Engineering Wood & Jendela Alumunium 4"', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.15, baseUnitPrice: 2850000 },
      { code: '10.01', name: 'Instalasi Listrik 2200VA + Panel MCB Grouping', category: 'Pekerjaan Instalasi Listrik', unit: 'titik', volumeMultiplierPerM2: 0.55, baseUnitPrice: 285000 },
      { code: '11.01', name: 'Sanitasi Kamar Mandi Lengkap (Kloset Duduk, Wastafel, Toren Air 1000L)', category: 'Pekerjaan Sanitasi', unit: 'set', volumeMultiplierPerM2: 0.03, baseUnitPrice: 6500000 },
      { code: '12.01', name: 'Pengecatan Cat Dinding Premium & Plafon', category: 'Pekerjaan Pengecatan', unit: 'm²', volumeMultiplierPerM2: 8.5, baseUnitPrice: 45000 },
    ],
  },
  residential_luxury: {
    id: 'residential_luxury',
    name: 'Rumah Mewah / Villa Eksklusif',
    description: 'Finishing marmer/granit impor, kusen premium, smart lighting, sanitary premium.',
    defaultArea: 250,
    areaUnit: 'm²',
    estimatedCostPerM2: 8500000,
    categories: [...RAB_CATEGORIES],
    sampleItems: [
      { code: '01.01', name: 'Pekerjaan Persiapan & Manajemen Proyek', category: 'Pekerjaan Persiapan', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 15000000 },
      { code: '04.01', name: 'Struktur Beton Bertulang ReadyMix K-300 + Plat Lantai', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.28, baseUnitPrice: 6850000 },
      { code: '06.01', name: 'Lantai Marmer / Granit Slab Tile 80x80 Import', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 1.0, baseUnitPrice: 850000 },
      { code: '09.01', name: 'Pintu Kayu Solid Jati / Alumunium YKK AP', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.15, baseUnitPrice: 5500000 },
      { code: '11.01', name: 'Sanitary Toto Premium / Grohe + Bathtub', category: 'Pekerjaan Sanitasi', unit: 'set', volumeMultiplierPerM2: 0.03, baseUnitPrice: 14500000 },
      { code: '12.01', name: 'Pengecatan Interior & Eksterior Cat Dulux Weathershield Powerflexx', category: 'Pekerjaan Pengecatan', unit: 'm²', volumeMultiplierPerM2: 9.0, baseUnitPrice: 65000 },
    ],
  },
  shophouse: {
    id: 'shophouse',
    name: 'Ruko / Rukan 3 Lantai',
    description: 'Bangunan komersial 3 lantai, beban hidup tinggi, rolling door, canopy kaca / acp.',
    defaultArea: 180,
    areaUnit: 'm²',
    estimatedCostPerM2: 4800000,
    categories: [...RAB_CATEGORIES],
    sampleItems: [
      { code: '01.01', name: 'Pekerjaan Persiapan & Keamanan Lalu Lintas', category: 'Pekerjaan Persiapan', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 9500000 },
      { code: '04.01', name: 'Struktur Beton Bertulang Kolom & Balok K-250', category: 'Pekerjaan Struktur', unit: 'm³', volumeMultiplierPerM2: 0.24, baseUnitPrice: 5950000 },
      { code: '06.01', name: 'Lantai Granit Tile Heavy Duty 60x60', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 1.0, baseUnitPrice: 285000 },
      { code: '09.01', name: 'Rolling Door One Sheet Perforated + Pintu Kaca Tempered 12mm', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.05, baseUnitPrice: 8500000 },
      { code: '10.01', name: 'Instalasi Listrik 3 Phase 5500VA', category: 'Pekerjaan Instalasi Listrik', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 12000000 },
    ],
  },
  office_renovation: {
    id: 'office_renovation',
    name: 'Renovasi / Fit-Out Kantor',
    description: 'Pekerjaan partisi gypsum acoustic, karpet tile / vinyl SPC, plafon drop ceiling, tata cahaya, kabel LAN.',
    defaultArea: 100,
    areaUnit: 'm²',
    estimatedCostPerM2: 2800000,
    categories: [
      'Pekerjaan Persiapan',
      'Pekerjaan Dinding',
      'Pekerjaan Lantai',
      'Pekerjaan Plafon',
      'Pekerjaan Pintu dan Jendela',
      'Pekerjaan Instalasi Listrik',
      'Pekerjaan Pengecatan',
      'Pekerjaan Akhir',
    ],
    sampleItems: [
      { code: '01.01', name: 'Bongkaran Partisi Lama & Proteksi Area Gedung', category: 'Pekerjaan Persiapan', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 4500000 },
      { code: '05.01', name: 'Partisi Gypsum 2 Sisi Rangka Baja Ringan + Glasswool Peredam', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 1.2, baseUnitPrice: 245000 },
      { code: '06.01', name: 'Lantai Vinyl SPC Click 4mm / Karpet Tile 50x50', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 0.95, baseUnitPrice: 275000 },
      { code: '08.01', name: 'Plafon Gypsum Acoustic Tile 60x120 Rangka Exposed', category: 'Pekerjaan Plafon', unit: 'm²', volumeMultiplierPerM2: 0.95, baseUnitPrice: 165000 },
      { code: '09.01', name: 'Pintu Kaca Frameless Tempered 10mm + Patch Fitting', category: 'Pekerjaan Pintu dan Jendela', unit: 'unit', volumeMultiplierPerM2: 0.04, baseUnitPrice: 4850000 },
      { code: '10.01', name: 'Instalasi Lampu LED Panel 60x60 + Stop Kontak Meja Workstation', category: 'Pekerjaan Instalasi Listrik', unit: 'titik', volumeMultiplierPerM2: 0.6, baseUnitPrice: 320000 },
      { code: '12.01', name: 'Pengecatan Dinding & Kolom Cat Vinilex / Dulux', category: 'Pekerjaan Pengecatan', unit: 'm²', volumeMultiplierPerM2: 2.5, baseUnitPrice: 38000 },
    ],
  },
  steel_warehouse: {
    id: 'steel_warehouse',
    name: 'Gudang Konstruksi Rangka Baja',
    description: 'Pondasi pedestal bore pile, kolom & kuda-kuda baja WF, lantai cor beton tebal 15cm wiremesh, cladding atap Zincalume.',
    defaultArea: 300,
    areaUnit: 'm²',
    estimatedCostPerM2: 3200000,
    categories: [
      'Pekerjaan Persiapan',
      'Pekerjaan Tanah',
      'Pekerjaan Pondasi',
      'Pekerjaan Struktur',
      'Pekerjaan Dinding',
      'Pekerjaan Lantai',
      'Pekerjaan Atap',
      'Pekerjaan Instalasi Listrik',
      'Pekerjaan Sanitasi',
      'Pekerjaan Akhir',
    ],
    sampleItems: [
      { code: '01.01', name: 'Pengukuran Lapangan, Direksi Keet & Mobilisasi Alat Berat', category: 'Pekerjaan Persiapan', unit: 'ls', volumeMultiplierPerM2: 0.05, baseUnitPrice: 12000000 },
      { code: '02.01', name: 'Galian Tanah Pondasi Pedestal & Saluran Drainase', category: 'Pekerjaan Tanah', unit: 'm³', volumeMultiplierPerM2: 0.35, baseUnitPrice: 85000 },
      { code: '03.01', name: 'Pondasi Pedestal & Angkur Baut Baja Grade 8.8', category: 'Pekerjaan Pondasi', unit: 'titik', volumeMultiplierPerM2: 0.06, baseUnitPrice: 1850000 },
      { code: '04.01', name: 'Struktur Baja Profil WF 200/250/300 Termasuk Cat Zinkromate', category: 'Pekerjaan Struktur', unit: 'kg', volumeMultiplierPerM2: 22.0, baseUnitPrice: 36500 },
      { code: '05.01', name: 'Dinding Bata Merah / Hebel Bawah t=2.5m + Cladding Spandek', category: 'Pekerjaan Dinding', unit: 'm²', volumeMultiplierPerM2: 0.8, baseUnitPrice: 215000 },
      { code: '06.01', name: 'Lantai Kerja & Cor Beton K-300 t=15cm Floor Hardener', category: 'Pekerjaan Lantai', unit: 'm²', volumeMultiplierPerM2: 1.0, baseUnitPrice: 385000 },
      { code: '07.01', name: 'Atap Spandek Zincalume 0.40mm + Insulasi Glasswool Aluminium', category: 'Pekerjaan Atap', unit: 'm²', volumeMultiplierPerM2: 1.15, baseUnitPrice: 185000 },
      { code: '10.01', name: 'Instalasi Lampu High Bay LED Industri 100W', category: 'Pekerjaan Instalasi Listrik', unit: 'titik', volumeMultiplierPerM2: 0.08, baseUnitPrice: 950000 },
    ],
  },
};

/**
 * QuickRABBuilder Service
 */
export class QuickBuilderService {
  /**
   * Menghasilkan draft item RAB berdasarkan pilihan metode
   */
  static generateDraftItems(params: {
    method: QuickBuilderMethod;
    buildingType?: BuildingTypeOption;
    buildingArea: number;
    selectedCategories: RABCategory[];
    template?: RABTemplate;
    ahspItems?: AHSPItem[];
    priceDatabase?: PriceItem[];
  }): QuickBuilderDraftItem[] {
    const { method, buildingType, buildingArea, selectedCategories, template, ahspItems, priceDatabase } = params;
    const area = Math.max(1, buildingArea || 36);

    let draftItems: QuickBuilderDraftItem[] = [];

    if (method === 'template' && template && template.items) {
      draftItems = template.items.map((it, idx) => {
        const cat = normalizeCategory(it.category);
        const code = it.itemCode || (it as any).code || `${String(idx + 1).padStart(2, '0')}.01`;
        const name = it.description || (it as any).name || 'Pekerjaan Standar';
        return {
          id: `draft_${Date.now()}_${idx}`,
          projectId: '',
          code,
          name,
          category: cat,
          unit: it.unit || 'ls',
          volume: Number(it.volume || 1),
          unitPrice: Number(it.unitPrice || 0),
          totalCost: Number(it.volume || 1) * Number(it.unitPrice || 0),
          notes: it.notes || '',
          sourceType: 'template',
          sourceTemplateId: template.id,
          confidence: 95,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    } else if (method === 'building_type' || method === 'standard_list' || method === 'ai_estimator') {
      const presetKey = buildingType || 'simple_house_36_45';
      const config = PRESET_BUILDING_CONFIGS[presetKey] || PRESET_BUILDING_CONFIGS.simple_house_36_45;

      draftItems = config.sampleItems.map((item, idx) => {
        const volume = Number((item.volumeMultiplierPerM2 * area).toFixed(2));
        const unitPrice = item.baseUnitPrice;
        const totalCost = Number((volume * unitPrice).toFixed(0));

        return {
          id: `draft_${Date.now()}_${idx}`,
          projectId: '',
          code: item.code,
          name: item.name,
          category: item.category,
          unit: item.unit,
          volume,
          unitPrice,
          totalCost,
          sourceType: method === 'ai_estimator' ? 'ai' : 'standard',
          confidence: method === 'ai_estimator' ? 85 : 90,
          needsVerification: method === 'ai_estimator',
          assumptions: method === 'ai_estimator' ? [`Estimasi volume per m² berdasarkan luas ${area} m²`] : undefined,
          warnings: method === 'ai_estimator' ? ['Wajib verifikasi gambar kerja dan kondisi tanah lapangan'] : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    }

    // Filter hanya kategori yang dipilih
    if (selectedCategories.length > 0) {
      draftItems = draftItems.filter((it) => selectedCategories.includes(it.category));
    }

    // Periksa duplikasi kode & flag invalid
    const codeCounts = new Map<string, number>();
    draftItems.forEach((it) => {
      const c = (it.code || '').toLowerCase();
      codeCounts.set(c, (codeCounts.get(c) || 0) + 1);
    });

    draftItems.forEach((it) => {
      const c = (it.code || '').toLowerCase();
      it.isDuplicate = (codeCounts.get(c) || 0) > 1;
      it.isInvalid = !it.name || !it.code || it.volume < 0 || it.unitPrice < 0;
    });

    return draftItems;
  }

  /**
   * Menghitung kalkulasi rekapitulasi ringkasan wizard Quick RAB Builder
   */
  static calculateWizardSummary(
    items: QuickBuilderDraftItem[],
    overheadPercent: number,
    profitPercent: number,
    taxPercent: number,
    targetBudget: number = 0
  ): QuickBuilderSummary {
    const calc = calculateRAB(items, overheadPercent, profitPercent, taxPercent);

    const categoriesSet = new Set(items.map((it) => it.category));
    const warningCount = items.filter((it) => it.warnings && it.warnings.length > 0).length;
    const needsVerificationCount = items.filter((it) => it.needsVerification).length;
    const duplicateCount = items.filter((it) => it.isDuplicate).length;
    const invalidCount = items.filter((it) => it.isInvalid).length;

    const budgetVariance = targetBudget > 0 ? calc.grandTotal - targetBudget : 0;
    const budgetUsagePercent = targetBudget > 0 ? Number(((calc.grandTotal / targetBudget) * 100).toFixed(1)) : 0;

    return {
      itemCount: items.length,
      categoryCount: categoriesSet.size,
      directCost: calc.directCost,
      overheadCost: calc.overheadCost,
      profitCost: calc.profitCost,
      subtotalBeforeTax: calc.subtotalBeforeTax,
      taxCost: calc.taxCost,
      grandTotal: calc.grandTotal,
      targetBudget,
      budgetVariance,
      budgetUsagePercent,
      warningCount,
      needsVerificationCount,
      duplicateCount,
      invalidCount,
    };
  }
}
