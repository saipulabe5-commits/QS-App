import { ItemType } from './price';

export const AHSP_CATEGORIES = [
  'Pekerjaan Persiapan',
  'Pekerjaan Tanah & Pondasi',
  'Pekerjaan Struktur Beton',
  'Pekerjaan Struktur Baja',
  'Pekerjaan Pasangan & Dinding',
  'Pekerjaan Pintu, Jendela & Kaca',
  'Pekerjaan Penutup Atap',
  'Pekerjaan Plafon',
  'Pekerjaan Penutup Lantai',
  'Pekerjaan Pengecatan',
  'Pekerjaan Sanitasi & Plumbing',
  'Pekerjaan Elektrikal',
  'Pekerjaan Landscape & Eksterior',
] as const;

export type AHSPCategory = typeof AHSP_CATEGORIES[number];

export interface AHSPCategoryMeta {
  category: AHSPCategory;
  codePrefix: string;
  subCategories: string[];
  description: string;
  iconName: string;
}

export const AHSP_CATEGORY_DEFINITIONS: Record<AHSPCategory, AHSPCategoryMeta> = {
  'Pekerjaan Persiapan': {
    category: 'Pekerjaan Persiapan',
    codePrefix: 'A.2.2.1',
    subCategories: ['Persiapan Lapangan', 'Pengukuran & Bouwplank', 'Fasilitas Sementara', 'Mobilisasi'],
    description: 'Pembersihan lapangan, pengukuran, bouwplank, direksi keet, pagar, dan jalan sementara.',
    iconName: 'Compass',
  },
  'Pekerjaan Tanah & Pondasi': {
    category: 'Pekerjaan Tanah & Pondasi',
    codePrefix: 'A.2.3.1',
    subCategories: ['Pekerjaan Tanah', 'Pekerjaan Pondasi', 'Pekerjaan Drainase'],
    description: 'Galian tanah, timbunan, pemadatan, cerucuk galam, batu kali, bored pile & strauss pile.',
    iconName: 'Shovel',
  },
  'Pekerjaan Struktur Beton': {
    category: 'Pekerjaan Struktur Beton',
    codePrefix: 'A.3.1.1',
    subCategories: ['Bekisting', 'Pembesian', 'Pengecoran Beton'],
    description: 'Bekisting, perakitan pembesian (polos/ulir/wiremesh), dan pengecoran beton (K225 - K400).',
    iconName: 'Box',
  },
  'Pekerjaan Struktur Baja': {
    category: 'Pekerjaan Struktur Baja',
    codePrefix: 'A.13.13.1',
    subCategories: ['Pekerjaan Struktur Baja', 'Pengelasan & Angkur', 'Kuda-Kuda Baja'],
    description: 'Kolom & balok baja WF, kuda-kuda IWF, base plate, ikatan angin, dan pengelasan elektroda.',
    iconName: 'Hammer',
  },
  'Pekerjaan Pasangan & Dinding': {
    category: 'Pekerjaan Pasangan & Dinding',
    codePrefix: 'A.4.4.1',
    subCategories: ['Dinding Bata', 'Plesteran & Acian', 'Finishing Dinding'],
    description: 'Pasangan bata merah, bata ringan (hebel), batako, plesteran, acian semen PC & mortar.',
    iconName: 'BrickWall',
  },
  'Pekerjaan Pintu, Jendela & Kaca': {
    category: 'Pekerjaan Pintu, Jendela & Kaca',
    codePrefix: 'A.5.5.1',
    subCategories: ['Kusen & Pintu', 'Aluminium & Kaca', 'Kaca Tempered & Curtain Wall'],
    description: 'Kusen kayu & aluminium, daun pintu panel, daun jendela, kaca 5mm-10mm tempered & curtain wall.',
    iconName: 'DoorOpen',
  },
  'Pekerjaan Penutup Atap': {
    category: 'Pekerjaan Penutup Atap',
    codePrefix: 'A.6.6.1',
    subCategories: ['Pekerjaan Atap', 'Rangka Atap', 'Penutup Atap', 'Talang & Bumbungan'],
    description: 'Rangka baja ringan / kaso kayu, genteng tanah liat, metal pasir, beton, keramik, spandek & talang.',
    iconName: 'Home',
  },
  'Pekerjaan Plafon': {
    category: 'Pekerjaan Plafon',
    codePrefix: 'A.7.7.1',
    subCategories: ['Pekerjaan Plafon', 'Rangka Plafon', 'Penutup Plafon', 'Partisi Plafon'],
    description: 'Rangka hollow galvanis, plafon gypsum 9-12mm, PVC, GRC, akustik tile, dan list profil.',
    iconName: 'Maximize2',
  },
  'Pekerjaan Penutup Lantai': {
    category: 'Pekerjaan Penutup Lantai',
    codePrefix: 'A.8.8.1',
    subCategories: ['Pekerjaan Lantai', 'Keramik & Granit', 'Vinyl & Parquet', 'Waterproofing & Epoxy'],
    description: 'Keramik, granit tile 60x60 - 60x120, marmer, vinyl plank, karpet, parquet jati, & waterproofing.',
    iconName: 'Grid',
  },
  'Pekerjaan Pengecatan': {
    category: 'Pekerjaan Pengecatan',
    codePrefix: 'A.9.9.1',
    subCategories: ['Pekerjaan Pengecatan', 'Cat Dinding Interior', 'Cat Dinding Eksterior', 'Cat Kayu & Besi'],
    description: 'Pengecatan dinding interior, eksterior weathershield, cat kayu/besi, melamine, & wallpaper.',
    iconName: 'Paintbrush',
  },
  'Pekerjaan Sanitasi & Plumbing': {
    category: 'Pekerjaan Sanitasi & Plumbing',
    codePrefix: 'A.11.11.1',
    subCategories: ['Pekerjaan Sanitasi & Plumbing', 'Instalasi Pipa', 'Sanitair & Aksesoris'],
    description: 'Pipa PVC AW/D, pipa PPR air panas/dingin, closet duduk & jongkok, wastafel, kitchen sink, & shower.',
    iconName: 'Droplets',
  },
  'Pekerjaan Elektrikal': {
    category: 'Pekerjaan Elektrikal',
    codePrefix: 'A.12.12.1',
    subCategories: ['Pekerjaan Elektrikal', 'Titik Instalasi', 'Panel MCB', 'Armatur Lampu'],
    description: 'Titik lampu NYM, stop kontak, saklar Broco, box panel MCB, kabel power NYY/NYM, dan downlight LED.',
    iconName: 'Zap',
  },
  'Pekerjaan Landscape & Eksterior': {
    category: 'Pekerjaan Landscape & Eksterior',
    codePrefix: 'A.14.14.1',
    subCategories: ['Pekerjaan Landscape & Eksterior', 'Paving Block', 'Pagar & Kanstin', 'Penanaman Pohon'],
    description: 'Paving block 6-8cm, grass block, kanstin, rumput gajah mini, pohon peneduh, & pagar BRC/besi.',
    iconName: 'Trees',
  },
};

export interface AHSPComponent {
  id: string;
  priceItemId?: string;
  name: string;
  type: ItemType;
  unit: string;
  coefficient: number;
  unitPrice: number;
  totalCost: number;
  spesifikasi?: string;
}

export interface AHSPItem {
  id: string;
  userId: string;
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  subKategori?: string;
  unit: string;
  components: AHSPComponent[];
  unitPrice: number; // sum of all components
  overheadPercent?: number;
  profitPercent?: number;
  notes?: string;
  sniReference?: string;
  tahun?: number;
  sumberData?: string;
  lastUpdated?: string;
  provinsi?: string;
}

