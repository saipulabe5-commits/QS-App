import { PriceItem, PriceItemType } from '../types';
import { StorageAdapter, defaultStorage, STORAGE_KEYS } from '../db/storageAdapter';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { INITIAL_PRICE_DATABASE } from '../data/initialData';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils';

const STORAGE_KEY = 'price_items';

export class PriceService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<PriceItem[]> {
    try {
      if (idbStorage.isSupported()) {
        const idb = await idbStorage.getAll<PriceItem>(DB_STORES.PRICES);
        if (idb && idb.length > 0) return idb;
      }
    } catch {}

    const raw = safeLocalStorageGet(STORAGE_KEYS.PRICES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return this.storage.getItem<PriceItem[]>(STORAGE_KEY, INITIAL_PRICE_DATABASE);
  }

  async getByType(type: PriceItemType): Promise<PriceItem[]> {
    const list = await this.getAll();
    return list.filter((i) => i.type === type);
  }

  async getById(id: string): Promise<PriceItem | null> {
    const list = await this.getAll();
    return list.find((i) => i.id === id) || null;
  }

  private async persistList(list: PriceItem[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, list);
    safeLocalStorageSet(STORAGE_KEYS.PRICES, JSON.stringify(list));
    if (idbStorage.isSupported()) {
      try {
        await idbStorage.setAll(DB_STORES.PRICES, list);
      } catch {}
    }
  }

  async addItem(data: Omit<PriceItem, 'id' | 'updatedAt'>): Promise<PriceItem> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nama item harga wajib diisi');
    }
    if (data.price < 0) {
      throw new Error('Harga satuan tidak boleh negatif');
    }

    const list = await this.getAll();
    const newItem: PriceItem = {
      ...data,
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const updatedList = [newItem, ...list];
    await this.persistList(updatedList);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<Omit<PriceItem, 'id'>>): Promise<PriceItem> {
    const list = await this.getAll();
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error('Item harga tidak ditemukan');
    }

    if (updates.price !== undefined && updates.price < 0) {
      throw new Error('Harga satuan tidak boleh negatif');
    }

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    list[index] = updated;
    await this.persistList(list);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((i) => i.id !== id);
    await this.persistList(filtered);
  }

  async bulkImport(items: Array<Omit<PriceItem, 'id' | 'userId' | 'updatedAt'>>, userId: string): Promise<number> {
    const list = await this.getAll();
    const newItems: PriceItem[] = items.map((item, idx) => ({
      ...item,
      id: `price_imp_${Date.now()}_${idx}`,
      userId,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));

    const updatedList = [...newItems, ...list];
    await this.persistList(updatedList);
    return newItems.length;
  }
}

export const priceService = new PriceService();
