import { AppSettings } from '../types';
import { StorageAdapter, defaultStorage } from '../db/storageAdapter';
import { INITIAL_SETTINGS } from '../data/initialData';

const STORAGE_KEY = 'company_settings';

export class SettingsService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async get(): Promise<AppSettings> {
    return this.storage.getItem<AppSettings>(STORAGE_KEY, INITIAL_SETTINGS);
  }

  async update(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const updated: AppSettings = {
      ...current,
      ...settings,
    };
    await this.storage.setItem(STORAGE_KEY, updated);
    return updated;
  }

  async reset(): Promise<AppSettings> {
    await this.storage.setItem(STORAGE_KEY, INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
}

export const settingsService = new SettingsService();
