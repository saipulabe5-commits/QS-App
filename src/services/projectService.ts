import { Project, ProjectStatus } from '../types';
import { StorageAdapter, defaultStorage, STORAGE_KEYS } from '../db/storageAdapter';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { INITIAL_PROJECTS } from '../data/initialData';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils';

const STORAGE_KEY = 'projects';

export class ProjectService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<Project[]> {
    try {
      if (idbStorage.isSupported()) {
        const idb = await idbStorage.getAll<Project>(DB_STORES.PROJECTS);
        if (idb && idb.length > 0) return idb;
      }
    } catch {}

    const raw = safeLocalStorageGet(STORAGE_KEYS.PROJECTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return this.storage.getItem<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
  }

  async getById(id: string): Promise<Project | null> {
    const list = await this.getAll();
    return list.find((p) => p.id === id) || null;
  }

  private async persistList(list: Project[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, list);
    safeLocalStorageSet(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    if (idbStorage.isSupported()) {
      try {
        await idbStorage.setAll(DB_STORES.PROJECTS, list);
      } catch {}
    }
  }

  async create(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    // Validasi
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nama proyek wajib diisi');
    }

    const list = await this.getAll();
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updatedList = [newProject, ...list];
    await this.persistList(updatedList);
    return newProject;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const list = await this.getAll();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Proyek tidak ditemukan');
    }

    const updatedProject = { ...list[index], ...updates };
    list[index] = updatedProject;
    await this.persistList(list);
    return updatedProject;
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((p) => p.id !== id);
    await this.persistList(filtered);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.update(id, { status });
  }
}

export const projectService = new ProjectService();
