import { ProjectTemplate } from '../types';
import { StorageAdapter, defaultStorage } from '../db/storageAdapter';
import { INITIAL_TEMPLATES } from '../data/initialData';

const STORAGE_KEY = 'project_templates';

export class TemplateService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<ProjectTemplate[]> {
    return this.storage.getItem<ProjectTemplate[]>(STORAGE_KEY, INITIAL_TEMPLATES);
  }

  async getById(id: string): Promise<ProjectTemplate | null> {
    const list = await this.getAll();
    return list.find((t) => t.id === id) || null;
  }

  async create(data: Omit<ProjectTemplate, 'id'>): Promise<ProjectTemplate> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nama template wajib diisi');
    }

    const list = await this.getAll();
    const newTemplate: ProjectTemplate = {
      ...data,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };

    const updatedList = [newTemplate, ...list];
    await this.storage.setItem(STORAGE_KEY, updatedList);
    return newTemplate;
  }

  async update(id: string, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    const list = await this.getAll();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Template tidak ditemukan');
    }

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    await this.storage.setItem(STORAGE_KEY, list);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((t) => t.id !== id);
    await this.storage.setItem(STORAGE_KEY, filtered);
  }
}

export const templateService = new TemplateService();
