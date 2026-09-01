/**
 * ============================================================================
 * SKEMA DATABASE SISTEM APLIKASI RAB (RENCANA ANGGARAN BIAYA)
 * ============================================================================
 *
 * Dokumentasi Desain Skema Database Relasional / Dokumen (Scalable & Modular)
 * Mendukung penyimpanan lokal (LocalStorage/IndexedDB) dan Cloud Database
 * (PostgreSQL / Firestore / Supabase / Cloud SQL) tanpa merubah kode aplikasi.
 *
 * RELASI ENTITAS (ENTITY RELATIONSHIP):
 * -------------------------------------
 * [users] 1 -- * [projects]
 * [users] 1 -- * [price_items]
 * [users] 1 -- * [ahsp_items]
 * [users] 1 -- * [project_templates]
 * [users] 1 -- 1 [company_settings]
 *
 * [projects] 1 -- * [rab_items] (ON DELETE CASCADE)
 * [projects] 1 -- * [audit_logs]
 *
 * [ahsp_items] 1 -- * [ahsp_components] (ON DELETE CASCADE)
 * [price_items] 1 -- * [ahsp_components] (ON DELETE SET NULL / SOFT REFERENCE)
 *
 * [project_templates] 1 -- * [project_template_items] (ON DELETE CASCADE)
 */

export interface DatabaseTableDefinition {
  tableName: string;
  description: string;
  primaryKey: string;
  foreignKeys?: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
  fields: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'enum';
    required: boolean;
    defaultValue?: unknown;
    validationRule?: string;
    description: string;
  }>;
}

/**
 * 1. Skema Tabel: Pengguna / Akun Perusahaan (users)
 */
export const USERS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'users',
  description: 'Menyimpan data otentikasi dan profil estimator/kontraktor',
  primaryKey: 'id',
  indexes: [
    { name: 'idx_users_email', columns: ['email'], unique: true },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID unik pengguna' },
    name: { type: 'string', required: true, description: 'Nama lengkap pengguna/estimator' },
    email: { type: 'string', required: true, validationRule: 'email format', description: 'Alamat surel' },
    companyName: { type: 'string', required: true, description: 'Nama perusahaan/badan usaha' },
    role: { type: 'string', required: true, defaultValue: 'Estimator', description: 'Peran pengguna' },
    avatarUrl: { type: 'string', required: false, description: 'URL foto profil' },
    createdAt: { type: 'date', required: true, description: 'Waktu pembuatan akun' },
    updatedAt: { type: 'date', required: true, description: 'Waktu pembaruan profil' },
  },
};

/**
 * 2. Skema Tabel: Proyek Konstruksi (projects)
 */
export const PROJECTS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'projects',
  description: 'Menyimpan identitas proyek konstruksi, persentase overhead, profit, dan pajak',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'userId', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_projects_userId', columns: ['userId'] },
    { name: 'idx_projects_status', columns: ['status'] },
    { name: 'idx_projects_doc_no', columns: ['documentNo'], unique: true },
    { name: 'idx_projects_created', columns: ['createdAt'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID unik proyek' },
    userId: { type: 'string', required: true, description: 'ID pemilik proyek' },
    name: { type: 'string', required: true, validationRule: 'min 3 chars', description: 'Nama pekerjaan/proyek' },
    documentNo: { type: 'string', required: true, description: 'Nomor resmi dokumen RAB' },
    clientName: { type: 'string', required: true, description: 'Nama pemilik proyek / bouwheer' },
    location: { type: 'string', required: true, description: 'Lokasi geografis proyek' },
    contractor: { type: 'string', required: false, description: 'Nama kontraktor pelaksana' },
    consultant: { type: 'string', required: false, description: 'Nama konsultan perencana/pengawas' },
    status: { type: 'enum', required: true, defaultValue: 'Draft', description: 'Status: Draft | Berjalan | Selesai' },
    overheadPercent: { type: 'number', required: true, defaultValue: 5, validationRule: '0 <= x <= 100', description: 'Persentase biaya overhead operasional' },
    profitPercent: { type: 'number', required: true, defaultValue: 10, validationRule: '0 <= x <= 100', description: 'Persentase margin keuntungan kontraktor' },
    taxPercent: { type: 'number', required: true, defaultValue: 0, validationRule: '0 <= x <= 100', description: 'Persentase Pajak Pertambahan Nilai (PPN)' },
    startDate: { type: 'string', required: false, description: 'Target tanggal mulai kerja' },
    endDate: { type: 'string', required: false, description: 'Target tanggal selesai kerja' },
    notes: { type: 'string', required: false, description: 'Catatan teknis atau spesifikasi khusus' },
    createdAt: { type: 'date', required: true, description: 'Tanggal pembuatan data' },
    updatedAt: { type: 'date', required: true, description: 'Tanggal terakhir diperbarui' },
  },
};

/**
 * 3. Skema Tabel: Rincian Item Pekerjaan RAB (rab_items)
 */
export const RAB_ITEMS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'rab_items',
  description: 'Menyimpan setiap rincian pekerjaan dalam RAB beserta volume dan harga satuannya',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'projectId', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_rab_items_project', columns: ['projectId'] },
    { name: 'idx_rab_items_category', columns: ['projectId', 'category'] },
    { name: 'idx_rab_items_sort', columns: ['projectId', 'sortOrder'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID unik item RAB' },
    projectId: { type: 'string', required: true, description: 'ID referensi proyek' },
    code: { type: 'string', required: true, description: 'Kode pekerjaan standar (e.g. STR-01, DND-02)' },
    name: { type: 'string', required: true, description: 'Uraian lengkap pekerjaan' },
    category: { type: 'string', required: true, description: 'Kategori pekerjaan (SNI)' },
    unit: { type: 'string', required: true, description: 'Satuan pengukuran (m², m³, kg, ls, bh, dll)' },
    volume: { type: 'number', required: true, validationRule: 'volume > 0', description: 'Kuantitas/volume pekerjaan' },
    unitPrice: { type: 'number', required: true, validationRule: 'unitPrice >= 0', description: 'Harga satuan pekerjaan (HSP)' },
    totalCost: { type: 'number', required: true, description: 'Perhitungan: Volume * UnitPrice' },
    weightPercent: { type: 'number', required: false, description: 'Bobot persentase dari direct cost' },
    sortOrder: { type: 'number', required: false, defaultValue: 0, description: 'Urutan baris pada laporan' },
    notes: { type: 'string', required: false, description: 'Keterangan teknis / merk / spesifikasi' },
    createdAt: { type: 'date', required: true, description: 'Waktu pembuatan item' },
    updatedAt: { type: 'date', required: true, description: 'Waktu perubahan item' },
  },
};

/**
 * 4. Skema Tabel: Database Harga Master (price_items)
 */
export const PRICE_ITEMS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'price_items',
  description: 'Menyimpan master harga bahan material, upah tenaga kerja, dan sewa alat',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'userId', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_price_user_type', columns: ['userId', 'type'] },
    { name: 'idx_price_code', columns: ['userId', 'code'], unique: true },
    { name: 'idx_price_category', columns: ['userId', 'category'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID master item harga' },
    userId: { type: 'string', required: true, description: 'Pemilik data harga' },
    code: { type: 'string', required: true, description: 'Kode unik item (MAT-01, TNG-01, ALT-01)' },
    name: { type: 'string', required: true, description: 'Nama material, jabatan tenaga, atau alat' },
    type: { type: 'enum', required: true, description: 'Jenis: material | labor | equipment' },
    category: { type: 'string', required: true, description: 'Kategori pengelompokan' },
    unit: { type: 'string', required: true, description: 'Satuan dasar (sak, m³, kg, OH, hari, dll)' },
    price: { type: 'number', required: true, validationRule: 'price >= 0', description: 'Harga dasar satuan' },
    source: { type: 'string', required: false, description: 'Sumber referensi harga / toko mitra' },
    updatedAt: { type: 'string', required: true, description: 'Tanggal survei / pembaruan harga' },
  },
};

/**
 * 5. Skema Tabel: Analisis Harga Satuan Pekerjaan (ahsp_items)
 */
export const AHSP_ITEMS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'ahsp_items',
  description: 'Menyimpan formula AHSP standar SNI/Kementerian PUPR',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'userId', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_ahsp_user_cat', columns: ['userId', 'category'] },
    { name: 'idx_ahsp_code', columns: ['userId', 'code'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID AHSP' },
    userId: { type: 'string', required: true, description: 'Pemilik analisa' },
    code: { type: 'string', required: true, description: 'Kode analisa SNI (AHSP-PND-01)' },
    name: { type: 'string', required: true, description: 'Nama uraian pekerjaan analisa' },
    category: { type: 'string', required: true, description: 'Kategori pekerjaan' },
    unit: { type: 'string', required: true, description: 'Satuan hasil analisa (1 m², 1 m³, 1 unit)' },
    unitPrice: { type: 'number', required: true, description: 'Hasil akumulasi seluruh komponen' },
    notes: { type: 'string', required: false, description: 'Dasar hukum / referensi nomor SNI' },
  },
};

/**
 * 6. Skema Tabel: Komponen Komposisi AHSP (ahsp_components)
 */
export const AHSP_COMPONENTS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'ahsp_components',
  description: 'Menyimpan rincian koefisien bahan, tenaga, dan alat untuk setiap AHSP',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'ahspItemId', referencedTable: 'ahsp_items', referencedColumn: 'id', onDelete: 'CASCADE' },
    { column: 'priceItemId', referencedTable: 'price_items', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_ahsp_comp_parent', columns: ['ahspItemId'] },
    { name: 'idx_ahsp_comp_type', columns: ['ahspItemId', 'type'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID komponen analisa' },
    ahspItemId: { type: 'string', required: true, description: 'ID induk AHSP' },
    priceItemId: { type: 'string', required: false, description: 'Referensi ke master price item' },
    name: { type: 'string', required: true, description: 'Nama bahan/tenaga/alat' },
    type: { type: 'enum', required: true, description: 'Jenis: material | labor | equipment' },
    unit: { type: 'string', required: true, description: 'Satuan' },
    coefficient: { type: 'number', required: true, validationRule: 'coefficient > 0', description: 'Koefisien SNI' },
    unitPrice: { type: 'number', required: true, description: 'Harga satuan per komponen' },
    totalCost: { type: 'number', required: true, description: 'Perhitungan: coefficient * unitPrice' },
  },
};

/**
 * 7. Skema Tabel: Template Proyek (project_templates)
 */
export const PROJECT_TEMPLATES_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'project_templates',
  description: 'Menyimpan template struktur RAB untuk duplikasi cepat proyek baru',
  primaryKey: 'id',
  indexes: [
    { name: 'idx_tpl_category', columns: ['category'] },
    { name: 'idx_tpl_builtin', columns: ['isBuiltIn'] },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID template' },
    userId: { type: 'string', required: false, description: 'ID pembuat template' },
    name: { type: 'string', required: true, description: 'Nama template pekerjaan' },
    description: { type: 'string', required: false, description: 'Deskripsi peruntukan template' },
    category: { type: 'string', required: true, description: 'Kategori (Perumahan, Komersial, dll)' },
    projectType: { type: 'string', required: true, description: 'Jenis bangunan' },
    isBuiltIn: { type: 'boolean', required: false, defaultValue: false, description: 'True jika template bawaan' },
    defaultOverhead: { type: 'number', required: true, defaultValue: 5, description: 'Default overhead %' },
    defaultProfit: { type: 'number', required: true, defaultValue: 10, description: 'Default profit %' },
    defaultTax: { type: 'number', required: true, defaultValue: 0, description: 'Default PPN %' },
    createdAt: { type: 'date', required: true, description: 'Waktu pembuatan' },
  },
};

/**
 * 8. Skema Tabel: Pengaturan Perusahaan & Format Dokumen (company_settings)
 */
export const COMPANY_SETTINGS_TABLE_SCHEMA: DatabaseTableDefinition = {
  tableName: 'company_settings',
  description: 'Menyimpan profil kop surat perusahaan, format penomoran dan konfigurasi kalkulasi',
  primaryKey: 'id',
  foreignKeys: [
    { column: 'userId', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_settings_user', columns: ['userId'], unique: true },
  ],
  fields: {
    id: { type: 'string', required: true, description: 'UUID pengaturan' },
    userId: { type: 'string', required: true, description: 'ID pengguna pemilik' },
    companyName: { type: 'string', required: true, description: 'Nama resmi perusahaan' },
    companyAddress: { type: 'string', required: true, description: 'Alamat kantor lengkap' },
    companyPhone: { type: 'string', required: true, description: 'Nomor telepon / WhatsApp kantor' },
    companyEmail: { type: 'string', required: true, description: 'Email resmi' },
    logoUrl: { type: 'string', required: false, description: 'URL atau Base64 logo perusahaan' },
    defaultOverhead: { type: 'number', required: true, defaultValue: 5, description: 'Persentase overhead default' },
    defaultProfit: { type: 'number', required: true, defaultValue: 10, description: 'Persentase profit default' },
    defaultTax: { type: 'number', required: true, defaultValue: 0, description: 'Persentase PPN default' },
    decimalDigits: { type: 'number', required: true, defaultValue: 0, description: 'Jumlah digit desimal tampilan' },
    documentNumberFormat: { type: 'string', required: true, defaultValue: 'RAB/{YEAR}/{MONTH}/{SEQ}', description: 'Format penomoran dokumen' },
  },
};

/**
 * Daftar seluruh skema tabel aplikasi
 */
export const ALL_DATABASE_SCHEMAS: DatabaseTableDefinition[] = [
  USERS_TABLE_SCHEMA,
  PROJECTS_TABLE_SCHEMA,
  RAB_ITEMS_TABLE_SCHEMA,
  PRICE_ITEMS_TABLE_SCHEMA,
  AHSP_ITEMS_TABLE_SCHEMA,
  AHSP_COMPONENTS_TABLE_SCHEMA,
  PROJECT_TEMPLATES_TABLE_SCHEMA,
  COMPANY_SETTINGS_TABLE_SCHEMA,
];
