import { AHSPItem, AHSPComponent } from '../types';
import { StorageAdapter, defaultStorage } from '../db/storageAdapter';
import { INITIAL_AHSP } from '../data/initialData';
import { calculateComponentAmount, roundCurrency } from '../utils/calculations';

const STORAGE_KEY = 'ahsp_items';

export class AHSPService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<AHSPItem[]> {
    return this.storage.getItem<AHSPItem[]>(STORAGE_KEY, INITIAL_AHSP);
  }

  async getById(id: string): Promise<AHSPItem | null> {
    const list = await this.getAll();
    return list.find((a) => a.id === id) || null;
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
    await this.storage.setItem(STORAGE_KEY, updatedList);
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
    await this.storage.setItem(STORAGE_KEY, list);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((a) => a.id !== id);
    await this.storage.setItem(STORAGE_KEY, filtered);
  }
}

export const ahspService = new AHSPService();
