import { AHSPItem, AHSPComponent } from '../types';
import { StorageAdapter, defaultStorage, STORAGE_KEYS } from '../db/storageAdapter';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { INITIAL_AHSP } from '../data/initialData';
import { calculateComponentAmount, roundCurrency } from '../utils/calculations';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils';

const STORAGE_KEY = 'ahsp_items';

export class AHSPService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<AHSPItem[]> {
    try {
      if (idbStorage.isSupported()) {
        const idb = await idbStorage.getAll<AHSPItem>(DB_STORES.AHSP);
        if (idb && idb.length > 0) return idb;
      }
    } catch {}

    const raw = safeLocalStorageGet(STORAGE_KEYS.AHSP);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return this.storage.getItem<AHSPItem[]>(STORAGE_KEY, INITIAL_AHSP);
  }

  async getById(id: string): Promise<AHSPItem | null> {
    const list = await this.getAll();
    return list.find((a) => a.id === id) || null;
  }

  private async persistList(list: AHSPItem[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, list);
    safeLocalStorageSet(STORAGE_KEYS.AHSP, JSON.stringify(list));
    if (idbStorage.isSupported()) {
      try {
        await idbStorage.setAll(DB_STORES.AHSP, list);
      } catch {}
    }
  }

  async addItem(data: Omit<AHSPItem, 'id' | 'unitPrice'> & { components: AHSPComponent[] }): Promise<AHSPItem> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nama analisis harga satuan wajib diisi');
    }

    const calculatedUnitPrice = roundCurrency(
      data.components.reduce((sum, c) => sum + calculateComponentAmount(c.coefficient, c.unitPrice), 0)
    );

    const list = await this.getAll();
    const newItem: AHSPItem = {
      ...data,
      id: `ahsp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      unitPrice: calculatedUnitPrice,
    };

    const updatedList = [newItem, ...list];
    await this.persistList(updatedList);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<AHSPItem>): Promise<AHSPItem> {
    const list = await this.getAll();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Analisis Harga Satuan tidak ditemukan');
    }

    const current = list[index];
    const components = updates.components || current.components;
    const unitPrice = roundCurrency(
      components.reduce((sum, c) => sum + calculateComponentAmount(c.coefficient, c.unitPrice), 0)
    );

    const updated: AHSPItem = {
      ...current,
      ...updates,
      components,
      unitPrice,
    };

    list[index] = updated;
    await this.persistList(list);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((a) => a.id !== id);
    await this.persistList(filtered);
  }
}

export const ahspService = new AHSPService();
