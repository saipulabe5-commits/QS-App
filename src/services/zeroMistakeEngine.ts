import { Project, RABItem, RABCalculationResult } from '../types';
import { calculateRAB } from '../utils/calculations';
import { normalizeProject, normalizeRABItem } from '../utils/normalizers';
import { sha256Sync } from '../utils/cryptoUtils';

export interface ValidationIssue {
  field?: string;
  itemId?: string;
  itemCode?: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestedAction?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  calculatedSummary?: RABCalculationResult;
}

/**
 * ZeroMistakeEngine
 * Mesin validasi terpusat untuk menjamin integritas data, perhitungan matematis,
 * dan audit trail di seluruh modul (Project, RAB, Quick Builder, Revision, Sync, AI, Template).
 */
export class ZeroMistakeEngine {
  /**
   * Menghitung hash checksum deterministik (SHA-256) untuk data snapshot
   */
  static generateChecksum(data: any): string {
    const hash = sha256Sync(data);
    return 'chk_' + hash.substring(0, 16);
  }

  /**
   * Validasi data Proyek sebelum disimpan / dibuat
   */
  static validateProject(project: Partial<Project>): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    if (!project.name || project.name.trim().length === 0) {
      errors.push({
        field: 'name',
        type: 'error',
        message: 'Nama proyek wajib diisi.',
      });
    }

    if (!project.clientName || project.clientName.trim().length === 0) {
      warnings.push({
        field: 'clientName',
        type: 'warning',
        message: 'Nama pemilik / klien proyek disarankan diisi.',
      });
    }

    if (project.overheadPercent !== undefined && (project.overheadPercent < 0 || project.overheadPercent > 100)) {
      errors.push({
        field: 'overheadPercent',
        type: 'error',
        message: 'Persentase overhead harus berada di antara 0% - 100%.',
      });
    }

    if (project.profitPercent !== undefined && (project.profitPercent < 0 || project.profitPercent > 100)) {
      errors.push({
        field: 'profitPercent',
        type: 'error',
        message: 'Persentase profit/keuntungan harus berada di antara 0% - 100%.',
      });
    }

    if (project.taxPercent !== undefined && (project.taxPercent < 0 || project.taxPercent > 100)) {
      errors.push({
        field: 'taxPercent',
        type: 'error',
        message: 'Persentase pajak (PPN) harus berada di antara 0% - 100%.',
      });
    }

    if (project.targetBudget !== undefined && project.targetBudget < 0) {
      errors.push({
        field: 'targetBudget',
        type: 'error',
        message: 'Nilai anggaran target tidak boleh bernilai negatif.',
      });
    }

    if (project.buildingArea !== undefined && project.buildingArea < 0) {
      errors.push({
        field: 'buildingArea',
        type: 'error',
        message: 'Luas bangunan tidak boleh bernilai negatif.',
      });
    }

    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate).getTime();
      const end = new Date(project.endDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end < start) {
        errors.push({
          field: 'endDate',
          type: 'error',
          message: 'Target tanggal selesai tidak boleh lebih awal dari tanggal mulai proyek.',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Validasi daftar item RAB sebelum disimpan / diterapkan
   */
  static validateRABItems(items: Partial<RABItem>[], project?: Project): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const info: ValidationIssue[] = [];

    const codeSet = new Set<string>();

    items.forEach((item, index) => {
      const rowNum = index + 1;
      const code = (item.code || '').trim();
      const name = (item.name || '').trim();
      const unit = (item.unit || '').trim();
      const volume = Number(item.volume ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);

      // 1. Kode Pekerjaan
      if (!code) {
        errors.push({
          itemId: item.id,
          type: 'error',
          message: `Baris #${rowNum}: Kode pekerjaan wajib diisi.`,
        });
      } else {
        if (codeSet.has(code.toLowerCase())) {
          errors.push({
            itemId: item.id,
            itemCode: code,
            type: 'error',
            message: `Baris #${rowNum}: Kode pekerjaan duplikat "${code}". Setiap item RAB wajib memiliki kode unik.`,
          });
        } else {
          codeSet.add(code.toLowerCase());
        }
      }

      // 2. Uraian Pekerjaan
      if (!name) {
        errors.push({
          itemId: item.id,
          itemCode: code,
          type: 'error',
          message: `Baris #${rowNum}: Uraian pekerjaan tidak boleh kosong.`,
        });
      }

      // 3. Satuan
      if (!unit) {
        warnings.push({
          itemId: item.id,
          itemCode: code,
          type: 'warning',
          message: `Baris #${rowNum} ("${name || code}"): Satuan belum ditentukan. Default satuan 'ls' digunakan.`,
        });
      }

      // 4. Volume
      if (isNaN(volume) || volume < 0) {
        errors.push({
          itemId: item.id,
          itemCode: code,
          type: 'error',
          message: `Baris #${rowNum} ("${name || code}"): Volume tidak boleh negatif atau invalid.`,
        });
      } else if (volume === 0) {
        warnings.push({
          itemId: item.id,
          itemCode: code,
          type: 'warning',
          message: `Baris #${rowNum} ("${name || code}"): Volume masih bernilai 0.`,
        });
      }

      // 5. Harga Satuan
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({
          itemId: item.id,
          itemCode: code,
          type: 'error',
          message: `Baris #${rowNum} ("${name || code}"): Harga satuan tidak boleh negatif.`,
        });
      } else if (unitPrice === 0) {
        warnings.push({
          itemId: item.id,
          itemCode: code,
          type: 'warning',
          message: `Baris #${rowNum} ("${name || code}"): Harga satuan masih bernilai Rp 0.`,
        });
      }

      // 6. Source Metadata Warning
      if (item.sourceType === 'ai' && item.needsVerification) {
        info.push({
          itemId: item.id,
          itemCode: code,
          type: 'info',
          message: `Baris #${rowNum} ("${name || code}"): Item diestimasi oleh AI dan memerlukan verifikasi teknis.`,
        });
      }
    });

    const normalizedItems = items.map((it) => normalizeRABItem(it, project?.id));
    const calculatedSummary = calculateRAB(
      normalizedItems,
      project?.overheadPercent ?? 0,
      project?.profitPercent ?? 0,
      project?.taxPercent ?? 0
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      calculatedSummary,
    };
  }

  /**
   * Validasi pra-penyimpanan (Before Save)
   */
  static validateBeforeSave(project: Partial<Project>, items: Partial<RABItem>[]): ValidationResult {
    const projResult = this.validateProject(project);
    const rabResult = this.validateRABItems(items, project as Project);

    return {
      isValid: projResult.isValid && rabResult.isValid,
      errors: [...projResult.errors, ...rabResult.errors],
      warnings: [...projResult.warnings, ...rabResult.warnings],
      info: [...projResult.info, ...rabResult.info],
      calculatedSummary: rabResult.calculatedSummary,
    };
  }

  /**
   * Validasi pra-penerapan template / AI / OCR / Import
   */
  static validateBeforeApply(
    sourceName: string,
    items: Partial<RABItem>[],
    project: Project
  ): ValidationResult {
    if (!items || items.length === 0) {
      return {
        isValid: false,
        errors: [{ type: 'error', message: `Tidak ada item yang dapat diterapkan dari ${sourceName}.` }],
        warnings: [],
        info: [],
      };
    }

    return this.validateRABItems(items, project);
  }

  /**
   * Validasi pra-sinkronisasi (Before Sync)
   */
  static validateBeforeSync(operation: any): ValidationResult {
    const errors: ValidationIssue[] = [];
    if (!operation.id || !operation.entity || !operation.operation) {
      errors.push({
        type: 'error',
        message: 'Payload operasi sinkronisasi tidak lengkap atau tidak valid.',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      info: [],
    };
  }
}
