import { RABItem } from '../types';
import { StorageAdapter, defaultStorage } from '../db/storageAdapter';
import { INITIAL_RAB_ITEMS } from '../data/initialData';

const STORAGE_KEY = 'rab_items';

export class RABService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<RABItem[]> {
    return this.storage.getItem<RABItem[]>(STORAGE_KEY, INITIAL_RAB_ITEMS);
  }

  async getByProjectId(projectId: string): Promise<RABItem[]> {
    const list = await this.getAll();
    return list.filter((item) => item.projectId === projectId);
  }

  async addItem(itemData: Omit<RABItem, 'id' | 'totalCost'>): Promise<RABItem> {
    if (!itemData.name || itemData.name.trim().length === 0) {
      throw new Error('Uraian pekerjaan wajib diisi');
    }
    if (itemData.volume <= 0) {
      throw new Error('Volume pekerjaan harus bernilai lebih dari 0');
    }
    if (itemData.unitPrice < 0) {
      throw new Error('Harga satuan tidak boleh negatif');
    }

    const list = await this.getAll();
    const newItem: RABItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      totalCost: itemData.volume * itemData.unitPrice,
    };

    const updatedList = [...list, newItem];
    await this.storage.setItem(STORAGE_KEY, updatedList);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<Omit<RABItem, 'id'>>): Promise<RABItem> {
    const list = await this.getAll();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Item RAB tidak ditemukan');
    }

    const current = list[index];
    const volume = updates.volume !== undefined ? updates.volume : current.volume;
    const unitPrice = updates.unitPrice !== undefined ? updates.unitPrice : current.unitPrice;
    
    if (volume <= 0) {
      throw new Error('Volume pekerjaan harus bernilai lebih dari 0');
    }
    if (unitPrice < 0) {
      throw new Error('Harga satuan tidak boleh negatif');
    }

    const updatedItem: RABItem = {
      ...current,
      ...updates,
      volume,
      unitPrice,
      totalCost: volume * unitPrice,
    };

    list[index] = updatedItem;
    await this.storage.setItem(STORAGE_KEY, list);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    await this.storage.setItem(STORAGE_KEY, filtered);
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((item) => item.projectId !== projectId);
    await this.storage.setItem(STORAGE_KEY, filtered);
  }

  async bulkAddItems(itemsData: Array<Omit<RABItem, 'id' | 'totalCost'>>): Promise<RABItem[]> {
    const list = await this.getAll();
    const newItems: RABItem[] = itemsData.map((d, index) => ({
      ...d,
      id: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      totalCost: d.volume * d.unitPrice,
    }));

    const updatedList = [...list, ...newItems];
    await this.storage.setItem(STORAGE_KEY, updatedList);
    return newItems;
  }
}

export const rabService = new RABService();
