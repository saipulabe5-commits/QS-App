import { Project, ProjectStatus } from '../types';
import { StorageAdapter, defaultStorage } from '../db/storageAdapter';
import { INITIAL_PROJECTS } from '../data/initialData';

const STORAGE_KEY = 'projects';

export class ProjectService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getAll(): Promise<Project[]> {
    return this.storage.getItem<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
  }

  async getById(id: string): Promise<Project | null> {
    const list = await this.getAll();
    return list.find((p) => p.id === id) || null;
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
    await this.storage.setItem(STORAGE_KEY, updatedList);
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
    await this.storage.setItem(STORAGE_KEY, list);
    return updatedProject;
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter((p) => p.id !== id);
    await this.storage.setItem(STORAGE_KEY, filtered);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.update(id, { status });
  }
}

export const projectService = new ProjectService();
