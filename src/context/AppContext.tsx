import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Project,
  RABItem,
  PriceItem,
  AHSPItem,
  ProjectTemplate,
  RABTemplate,
  RABTemplateItem,
  RABTemplateVersion,
  RABImportJob,
  CompanySettings,
  ToastMessage,
  RABCategory,
  ProjectDrawing,
  DrawingAnalysis,
  EstimatedDrawingItem,
  VerificationStatus,
  ProjectSCurve,
  ScheduleItem,
  PeriodProgressRecord,
  DistributionPattern,
  ADMIN_PERMISSIONS,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_SETTINGS,
  INITIAL_PROJECTS,
  INITIAL_RAB_ITEMS,
  INITIAL_PRICE_DATABASE,
  INITIAL_AHSP,
  INITIAL_TEMPLATES,
  INITIAL_RAB_TEMPLATES,
  INITIAL_DRAWINGS,
  INITIAL_DRAWING_ANALYSES,
  INITIAL_SCURVES,
} from '../data/initialData';
import { buildSCurveFromRAB, recalculateSCurve, syncSCurveWithRAB } from '../utils/scurveUtils';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { normalizeProject, normalizeRABItem, normalizePriceItem, normalizeAHSPItem } from '../utils/normalizers';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storageUtils';

const STORAGE_KEYS = {
  USER: 'rabpro_user_v1',
  ACTIVE_PROJECT: 'rabpro_active_project_v1',
  PROJECTS: 'rabpro_projects_v1',
  RAB_ITEMS: 'rabpro_rab_items_v1',
  PRICES: 'rabpro_prices_v1',
  AHSP: 'rabpro_ahsp_v1',
  TEMPLATES: 'rabpro_templates_v1',
  RAB_TEMPLATES: 'rabpro_rab_templates_v1',
  IMPORT_JOBS: 'rabpro_import_jobs_v1',
  DRAWINGS: 'rabpro_drawings_v1',
  ANALYSES: 'rabpro_analyses_v1',
  SCURVES: 'rabpro_scurves_v1',
  SETTINGS: 'rabpro_settings_v1',
};

export type AuthResult = {
  success: boolean;
  error?: string;
  [key: string]: any;
};

export interface AppContextType {
  isDbBooting: boolean;
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  selectedProject: Project | null;
  activeProject: Project | null;
  projects: Project[];
  rabItems: RABItem[];
  projectRABItems: RABItem[];
  priceDatabase: PriceItem[];
  ahspItems: AHSPItem[];
  templates: ProjectTemplate[];
  rabTemplates: RABTemplate[];
  importJobs: RABImportJob[];
  activeImportJob: RABImportJob | null;
  drawings: ProjectDrawing[];
  projectDrawings: ProjectDrawing[];
  drawingAnalyses: DrawingAnalysis[];
  scurves: Record<string, ProjectSCurve>;
  projectSCurve: ProjectSCurve | undefined;
  settings: CompanySettings;
  toasts: ToastMessage[];
  isSyncing: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // Toast
  showToast: (titleOrMessage: string, messageOrType?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;

  // Auth
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (name: string, email: string, passwordOrCompany?: string, passwordParam?: string) => Promise<AuthResult>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;

  // Projects
  addProject: (project: Partial<Project>, templateId?: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;

  // RAB Items
  addRABItem: (item: Partial<RABItem>, reason?: string) => RABItem;
  updateRABItem: (id: string, updates: Partial<RABItem>, reason?: string) => void;
  deleteRABItem: (id: string) => void;
  duplicateRABItem: (id: string) => RABItem | null;
  importRABItems: (items: Partial<RABItem>[]) => number;
  reorderRABItems: (items: RABItem[]) => void;
  applyTemplateToProject: (templateId: string, projectId: string, mode?: 'append' | 'replace') => number;
  saveProjectAsTemplate: (projectId: string, name: string, description: string, category: string) => RABTemplate | null;
  clearProjectRAB: (projectId?: string) => void;

  // AHSP
  addAHSPItem: (item: Partial<AHSPItem>) => AHSPItem;
  updateAHSPItem: (id: string, updates: Partial<AHSPItem>) => void;
  deleteAHSPItem: (id: string) => void;
  duplicateAHSPItem: (id: string) => AHSPItem | null;
  importAHSPItems: (items: Partial<AHSPItem>[]) => number;
  syncAHSPWithPriceDatabase: (ahspId?: string) => void;
  recalculateAHSPPrices: (ahspId?: string) => void;
  addAHSPToProjectRAB: (ahspItem: AHSPItem, projectId: string, volume?: number) => RABItem;
  exportAHSPComponentsToPriceDatabase: (ahspId?: string) => number;

  // Price Database
  addPriceItem: (item: Partial<PriceItem>) => PriceItem;
  updatePriceItem: (id: string, updates: Partial<PriceItem>) => void;
  deletePriceItem: (id: string) => void;
  importPriceItems: (items: Partial<PriceItem>[]) => number;

  // Templates
  createTemplateFromProject: (projectId: string, templateName: string, description?: string) => ProjectTemplate | null;
  deleteTemplate: (id: string) => void;
  saveAsRABTemplate: (name: string, description: string, category: string, items: Partial<RABTemplateItem>[]) => RABTemplate;
  saveProjectAsRABTemplate: (projectId: string, name: string, description: string, category: string) => RABTemplate | null;
  updateRABTemplate: (id: string, updates: Partial<RABTemplate>) => void;
  deleteRABTemplate: (id: string) => void;
  duplicateRABTemplate: (id: string) => RABTemplate | null;
  addTemplateVersion: (templateId: string, changelog: string) => void;
  createTemplateVersion: (templateId: string, changelog: string) => void;
  syncTemplateWithPriceDatabase: (templateId: string) => void;
  applyRABTemplate: (templateId: string, projectId: string, mode?: 'append' | 'replace') => number;
  applyRABTemplateToProject: (templateId: string, projectId: string, mode?: 'append' | 'replace') => number;
  createProjectFromRABTemplate: (templateId: string, projectData: Partial<Project>) => Project;

  // Import Jobs
  startImportJob: (job: RABImportJob) => void;
  setActiveImportJob: (job: RABImportJob | null) => void;
  updateImportJob: (id: string, updates: Partial<RABImportJob>) => void;
  updateImportJobItem: (jobIdOrItemId: string, itemIdOrUpdates: any, updatesParam?: Partial<RABTemplateItem>) => void;
  removeImportJobItem: (jobIdOrItemId: string, itemIdParam?: string) => void;
  addImportJobItem: (jobIdOrItem: any, itemParam?: Partial<RABTemplateItem>) => void;
  saveImportJobAsTemplate: (jobIdOrOptions: any, optionsParam?: any) => RABTemplate | null;
  deleteImportJob: (id: string) => void;
  clearActiveImportJob: () => void;

  // Drawings & AI Vision
  addDrawing: (drawing: Partial<ProjectDrawing>) => ProjectDrawing;
  updateDrawing: (id: string, updates: Partial<ProjectDrawing>) => void;
  deleteDrawing: (id: string) => void;
  analyzeDrawingWithAI: (drawingId: string) => Promise<DrawingAnalysis>;
  updateAnalysisItem: (analysisId: string, itemId: string, updates: Partial<EstimatedDrawingItem>) => void;
  updateEstimatedItem: (analysisId: string, itemId: string, updates: Partial<EstimatedDrawingItem>) => void;
  verifyAnalysisItem: (analysisId: string, itemId: string, status: VerificationStatus, notes?: string) => void;
  setEstimatedItemStatus: (analysisId: string, itemId: string, status: VerificationStatus, notes?: string) => void;
  bulkVerifyAnalysisItems: (analysisId: string, status: VerificationStatus) => void;
  bulkSetItemStatus: (analysisId: string, status: VerificationStatus) => void;
  transferApprovedItemsToRAB: (analysisId: string, selectedItemIds?: string[]) => number;
  transferAnalysisToRAB: (analysisId: string, selectedItemIds?: string[]) => number;

  // S-Curve & Scheduling
  getSCurve: (projectId?: string) => ProjectSCurve | undefined;
  createSCurveFromRAB: (projectId: string, periodType?: 'weekly' | 'monthly', totalPeriods?: number) => ProjectSCurve;
  generateSCurveFromRAB: (projectId: string, periodType?: 'weekly' | 'monthly', totalPeriods?: number) => ProjectSCurve;
  syncSCurve: (projectId: string) => ProjectSCurve | undefined;
  syncSCurveFromRAB: (projectId: string) => ProjectSCurve | undefined;
  syncSCurveWithCurrentRAB: (projectId: string) => ProjectSCurve | undefined;
  updateScheduleItem: (projectId: string, itemId: string, updates: Partial<ScheduleItem>) => void;
  distributeScheduleWeights: (projectId: string, itemId: string, pattern: DistributionPattern) => void;
  updateDistributionPattern: (projectId: string, itemId: string, pattern: DistributionPattern) => void;
  savePeriodProgress: (projectId: string, periodNumber: number, progress: Partial<PeriodProgressRecord>) => void;
  updatePeriodRecord: (projectId: string, record: Partial<PeriodProgressRecord> & { period: number }) => void;
  updateActualProgressRecord: (projectId: string, periodNumber: number, progress: Partial<PeriodProgressRecord>) => void;
  importActualProgressCSV: (projectId: string, csvContent: string) => number;
  importSCurveCSV: (projectId: string, csvContent: string) => number;
  recalculateSCurveData: (projectId: string) => void;
  exportSCurveCSV: (projectId: string) => string;

  // Settings & Reset
  updateSettings: (updates: Partial<CompanySettings>) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDbBooting, setIsDbBooting] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(INITIAL_PROJECTS[0]?.id || null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [rabItems, setRabItems] = useState<RABItem[]>(INITIAL_RAB_ITEMS);
  const [priceDatabase, setPriceDatabase] = useState<PriceItem[]>(INITIAL_PRICE_DATABASE);
  const [ahspItems, setAhspItems] = useState<AHSPItem[]>(INITIAL_AHSP);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(INITIAL_TEMPLATES);
  const [rabTemplates, setRabTemplates] = useState<RABTemplate[]>(INITIAL_RAB_TEMPLATES);
  const [importJobs, setImportJobs] = useState<RABImportJob[]>([]);
  const [activeImportJob, setActiveImportJob] = useState<RABImportJob | null>(null);
  const [drawings, setDrawings] = useState<ProjectDrawing[]>(INITIAL_DRAWINGS);
  const [drawingAnalyses, setDrawingAnalyses] = useState<DrawingAnalysis[]>(INITIAL_DRAWING_ANALYSES);
  const [scurves, setScurves] = useState<Record<string, ProjectSCurve>>(INITIAL_SCURVES);
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing] = useState<boolean>(false);

  // Helper Toast supporting polymorphic arguments: showToast(title, msg, type) or showToast(msg, type)
  const showToast = (
    titleOrMessage: string,
    messageOrType?: string,
    typeParam?: 'info' | 'success' | 'warning' | 'error'
  ) => {
    let title = titleOrMessage;
    let message = messageOrType || '';
    let type: 'info' | 'success' | 'warning' | 'error' = typeParam || 'info';

    if (['info', 'success', 'warning', 'error'].includes(messageOrType as string) && !typeParam) {
      type = messageOrType as any;
      message = titleOrMessage;
      title = type === 'success' ? 'Berhasil' : type === 'error' ? 'Kesalahan' : type === 'warning' ? 'Perhatian' : 'Informasi';
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper loader for stores
  const loadStoreData = async <T,>(
    storeName: any,
    initialData: T[],
    lsKey: string,
    normalizer?: (it: any) => T
  ): Promise<T[]> => {
    try {
      if (idbStorage.isSupported()) {
        const idbData = await idbStorage.getAll<T>(storeName);
        if (idbData && idbData.length > 0) {
          return normalizer ? idbData.map(normalizer) : idbData;
        }
      }
    } catch {
      // ignore
    }

    const lsStr = safeLocalStorageGet(lsKey);
    if (lsStr) {
      try {
        const parsed = JSON.parse(lsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const norm = normalizer ? parsed.map(normalizer) : parsed;
          if (idbStorage.isSupported()) {
            idbStorage.putAll(storeName, norm).catch(() => {});
          }
          return norm;
        }
      } catch {
        // ignore
      }
    }

    if (idbStorage.isSupported() && initialData.length > 0) {
      idbStorage.putAll(storeName, initialData).catch(() => {});
    }
    return initialData;
  };

  // Initial DB Boot
  useEffect(() => {
    async function bootDB() {
      setIsDbBooting(true);
      try {
        const rawUser = safeLocalStorageGet(STORAGE_KEYS.USER);
        if (rawUser) {
          try {
            setUser(JSON.parse(rawUser));
          } catch {
            setUser(INITIAL_USER);
          }
        } else {
          setUser(INITIAL_USER);
        }

        const rawActiveProject = safeLocalStorageGet(STORAGE_KEYS.ACTIVE_PROJECT);
        if (rawActiveProject) {
          try {
            setActiveProjectId(JSON.parse(rawActiveProject));
          } catch {
            setActiveProjectId(rawActiveProject);
          }
        }

        const loadedProjects = await loadStoreData(DB_STORES.PROJECTS, INITIAL_PROJECTS, STORAGE_KEYS.PROJECTS, normalizeProject);
        setProjects(loadedProjects);
        if (!rawActiveProject && loadedProjects.length > 0) {
          setActiveProjectId(loadedProjects[0].id);
        }

        const loadedRAB = await loadStoreData(DB_STORES.RAB_ITEMS, INITIAL_RAB_ITEMS, STORAGE_KEYS.RAB_ITEMS, normalizeRABItem);
        setRabItems(loadedRAB);

        const loadedPrices = await loadStoreData(DB_STORES.PRICES, INITIAL_PRICE_DATABASE, STORAGE_KEYS.PRICES, normalizePriceItem);
        setPriceDatabase(loadedPrices);

        const loadedAHSP = await loadStoreData(DB_STORES.AHSP, INITIAL_AHSP, STORAGE_KEYS.AHSP, normalizeAHSPItem);
        setAhspItems(loadedAHSP);

        const loadedTemplates = await loadStoreData(DB_STORES.TEMPLATES, INITIAL_TEMPLATES, STORAGE_KEYS.TEMPLATES);
        setTemplates(loadedTemplates);

        const loadedRabTemplates = await loadStoreData(DB_STORES.RAB_TEMPLATES, INITIAL_RAB_TEMPLATES, STORAGE_KEYS.RAB_TEMPLATES);
        setRabTemplates(loadedRabTemplates);

        const loadedDrawings = await loadStoreData(DB_STORES.DRAWINGS, INITIAL_DRAWINGS, STORAGE_KEYS.DRAWINGS);
        setDrawings(loadedDrawings);

        const loadedAnalyses = await loadStoreData(DB_STORES.ANALYSES, INITIAL_DRAWING_ANALYSES, STORAGE_KEYS.ANALYSES);
        setDrawingAnalyses(loadedAnalyses);

        const rawSCurves = safeLocalStorageGet(STORAGE_KEYS.SCURVES);
        if (rawSCurves) {
          try {
            setScurves(JSON.parse(rawSCurves));
          } catch {
            setScurves(INITIAL_SCURVES);
          }
        } else {
          setScurves(INITIAL_SCURVES);
        }

        const rawSettings = safeLocalStorageGet(STORAGE_KEYS.SETTINGS);
        if (rawSettings) {
          try {
            setSettings(JSON.parse(rawSettings));
          } catch {
            setSettings(INITIAL_SETTINGS);
          }
        }

        // Auto authenticate if token missing
        if (!safeLocalStorageGet('rabpro_token')) {
          try {
            const res = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: rawUser ? JSON.parse(rawUser)?.email : 'saipulabe@gmail.com' }),
            });
            const data = await res.json();
            if (data.token) {
              safeLocalStorageSet('rabpro_token', data.token);
            }
          } catch (e) {
            console.warn('Auto auth token init:', e);
          }
        }
      } catch (e) {
        console.error('Error during DB boot:', e);
      } finally {
        setIsDbBooting(false);
      }
    }

    bootDB();
  }, []);

  // Save changes to IDB & LocalStorage debounce
  useEffect(() => {
    if (isDbBooting) return;
    safeLocalStorageSet(STORAGE_KEYS.USER, JSON.stringify(user));
  }, [user, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    safeLocalStorageSet(STORAGE_KEYS.ACTIVE_PROJECT, JSON.stringify(activeProjectId));
  }, [activeProjectId, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.PROJECTS, projects).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.RAB_ITEMS, rabItems).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.RAB_ITEMS, JSON.stringify(rabItems));
  }, [rabItems, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.PRICES, priceDatabase).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.PRICES, JSON.stringify(priceDatabase));
  }, [priceDatabase, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.AHSP, ahspItems).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.AHSP, JSON.stringify(ahspItems));
  }, [ahspItems, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.TEMPLATES, templates).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }, [templates, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.RAB_TEMPLATES, rabTemplates).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.RAB_TEMPLATES, JSON.stringify(rabTemplates));
  }, [rabTemplates, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.DRAWINGS, drawings).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.DRAWINGS, JSON.stringify(drawings));
  }, [drawings, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    idbStorage.setAll(DB_STORES.ANALYSES, drawingAnalyses).catch(() => {});
    safeLocalStorageSet(STORAGE_KEYS.ANALYSES, JSON.stringify(drawingAnalyses));
  }, [drawingAnalyses, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    safeLocalStorageSet(STORAGE_KEYS.SCURVES, JSON.stringify(scurves));
  }, [scurves, isDbBooting]);

  useEffect(() => {
    if (isDbBooting) return;
    safeLocalStorageSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, isDbBooting]);

  // Derived state
  const selectedProject = projects.find((p) => p.id === activeProjectId) || null;
  const activeProject = selectedProject;
  const projectRABItems = rabItems.filter((it) => it.projectId === activeProjectId);
  const projectDrawings = drawings.filter((d) => d.projectId === activeProjectId);
  const projectSCurve = activeProjectId ? scurves[activeProjectId] : undefined;

  // ── Auth Handlers ──────────────────────────────────────────────────────────
  const login = async (email: string, password?: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }
      if (data.token) {
        safeLocalStorageSet('rabpro_token', data.token);
      }
      const loggedUser: User = data.user || {
        id: 'usr_1',
        name: email.split('@')[0],
        email: email,
        role: 'superadmin',
        companyName: 'PT. Citra Kusuma Development',
        permissions: ADMIN_PERMISSIONS,
        avatarUrl: '',
      };
      setUser(loggedUser);
      showToast('Login Berhasil', `Selamat datang kembali, ${loggedUser.name}!`, 'success');
      return { success: true, user: loggedUser };
    } catch (err: any) {
      // Offline fallback
      const fallbackUser: User = {
        id: 'usr_offline',
        name: email.split('@')[0] || 'Pengguna RAB',
        email: email || 'user@rabpro.id',
        role: 'superadmin',
        companyName: 'PT. Citra Kusuma Development',
        permissions: ADMIN_PERMISSIONS,
        avatarUrl: '',
      };
      setUser(fallbackUser);
      showToast('Login Berhasil (Offline)', `Masuk sebagai ${fallbackUser.name}`, 'success');
      return { success: true, user: fallbackUser, error: err.message };
    }
  };

  const register = async (
    name: string,
    email: string,
    passwordOrCompany?: string,
    passwordParam?: string
  ): Promise<AuthResult> => {
    const password = passwordParam || (passwordOrCompany && !passwordOrCompany.includes(' ') && passwordOrCompany.length > 5 ? passwordOrCompany : 'password123');
    const company = passwordParam ? passwordOrCompany : 'PT. Citra Kusuma Development';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pendaftaran gagal');
      }
      if (data.token) {
        safeLocalStorageSet('rabpro_token', data.token);
      }
      const newUser: User = data.user || {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'superadmin',
        companyName: company || 'PT. Citra Kusuma Development',
        permissions: ADMIN_PERMISSIONS,
        avatarUrl: '',
      };
      setUser(newUser);
      showToast('Akun Dibuat', `Selamat datang di RAB Pro, ${name}!`, 'success');
      return { success: true, user: newUser };
    } catch (err: any) {
      const offlineUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'superadmin',
        companyName: company || 'PT. Citra Kusuma Development',
        permissions: ADMIN_PERMISSIONS,
        avatarUrl: '',
      };
      setUser(offlineUser);
      showToast('Akun Dibuat (Offline)', `Selamat datang, ${name}!`, 'success');
      return { success: true, user: offlineUser, error: err.message };
    }
  };

  const logout = () => {
    safeLocalStorageRemove('rabpro_token');
    safeLocalStorageRemove(STORAGE_KEYS.USER);
    setUser(null);
    showToast('Keluar', 'Anda telah keluar dari aplikasi.', 'info');
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<AuthResult> => {
    try {
      const token = safeLocalStorageGet('rabpro_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Gagal mengubah kata sandi');
      }
      showToast('Kata Sandi Berhasil Diubah', 'Kata sandi akun Anda telah diperbarui.', 'success');
      return { success: true };
    } catch (err: any) {
      showToast('Gagal Ubah Sandi', err.message || 'Terjadi kesalahan sistem.', 'error');
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal meminta reset password');
      showToast('Kode Reset Terkirim', 'Silakan periksa instruksi reset password.', 'info');
      return { success: true, code: data.code };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const resetPasswordWithCode = async (
    email: string,
    code: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset password');
      showToast('Password Berhasil Direset', 'Silakan login dengan password baru Anda.', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── Project Handlers ────────────────────────────────────────────────────────
  const addProject = (projectData: Partial<Project>, templateId?: string): Project => {
    const newProject: Project = {
      id: projectData.id || `proj_${Date.now()}`,
      userId: user?.id || 'usr_1',
      name: projectData.name || 'Proyek Baru',
      documentNo: projectData.documentNo || (projectData as any).code || `PRJ-${Date.now().toString().slice(-4)}`,
      clientName: projectData.clientName || (projectData as any).client || 'Klien Umum',
      location: projectData.location || 'Indonesia',
      contractor: projectData.contractor || 'PT. Citra Kusuma Development',
      consultant: projectData.consultant || 'Konsultan Perencana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      endDate: projectData.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      notes: projectData.notes || '',
      status: projectData.status || 'Draft',
      overheadPercent: projectData.overheadPercent ?? 5,
      profitPercent: projectData.profitPercent ?? 10,
      taxPercent: projectData.taxPercent ?? 11,
      targetBudget: projectData.targetBudget ?? 0,
      projectType: projectData.projectType || 'Bangunan Gedung',
      buildingArea: projectData.buildingArea ?? 0,
      areaUnit: projectData.areaUnit || 'm²',
    };
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);

    if (templateId) {
      setTimeout(() => {
        applyTemplateToProject(templateId, newProject.id, 'append');
      }, 0);
    }

    showToast('Proyek Ditambahkan', `Proyek "${newProject.name}" berhasil dibuat.`, 'success');
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    showToast('Proyek Diperbarui', 'Perubahan proyek berhasil disimpan.', 'success');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setRabItems((prev) => prev.filter((it) => it.projectId !== id));
    setDrawings((prev) => prev.filter((d) => d.projectId !== id));
    setScurves((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setActiveProjectId(remaining[0]?.id || null);
    }
    showToast('Proyek Dihapus', 'Proyek beserta seluruh item RAB terkait telah dihapus.', 'info');
  };

  const duplicateProject = (id: string): Project | null => {
    const target = projects.find((p) => p.id === id);
    if (!target) return null;
    const newId = `proj_${Date.now()}`;
    const newProj: Project = {
      ...target,
      id: newId,
      name: `${target.name} (Salinan)`,
      documentNo: `${target.documentNo}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const clonedItems: RABItem[] = rabItems
      .filter((it) => it.projectId === id)
      .map((it, idx) => ({
        ...it,
        id: `rab_${Date.now()}_${idx}`,
        projectId: newId,
      }));
    setProjects((prev) => [newProj, ...prev]);
    setRabItems((prev) => [...prev, ...clonedItems]);
    setActiveProjectId(newId);
    showToast('Proyek Diduplikasi', `Berhasil menduplikasi proyek "${target.name}".`, 'success');
    return newProj;
  };

  // ── RAB Item Handlers ───────────────────────────────────────────────────────
  const addRABItem = (itemData: Partial<RABItem>, _reason?: string): RABItem => {
    const vol = Number(itemData.volume) || 1;
    const up = Number(itemData.unitPrice) || 0;
    const newItem: RABItem = {
      id: itemData.id || `rab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: itemData.projectId || activeProjectId || '',
      code: itemData.code || 'A.1.1',
      name: itemData.name || 'Item Pekerjaan Baru',
      category: itemData.category || 'Pekerjaan Persiapan',
      unit: itemData.unit || 'ls',
      volume: vol,
      unitPrice: up,
      totalCost: vol * up,
      notes: itemData.notes || '',
      sortOrder: itemData.sortOrder || rabItems.length + 1,
      sourceType: itemData.sourceType || 'manual',
      sourceAHSPId: (itemData as any).ahspId || itemData.sourceAHSPId,
      confidence: itemData.confidence ?? 100,
      needsVerification: itemData.needsVerification ?? false,
      verificationStatus: (itemData.verificationStatus as any) || 'verified',
    };
    setRabItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateRABItem = (id: string, updates: Partial<RABItem>, _reason?: string) => {
    setRabItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const vol = updates.volume !== undefined ? Number(updates.volume) : it.volume;
        const up = updates.unitPrice !== undefined ? Number(updates.unitPrice) : it.unitPrice;
        return {
          ...it,
          ...updates,
          volume: vol,
          unitPrice: up,
          totalCost: vol * up,
        };
      })
    );
  };

  const deleteRABItem = (id: string) => {
    setRabItems((prev) => prev.filter((it) => it.id !== id));
    showToast('Item Dihapus', 'Item RAB berhasil dihapus.', 'info');
  };

  const duplicateRABItem = (id: string): RABItem | null => {
    const target = rabItems.find((it) => it.id === id);
    if (!target) return null;
    const newItem: RABItem = {
      ...target,
      id: `rab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Salinan)`,
      sortOrder: (target.sortOrder || 0) + 1,
    };
    setRabItems((prev) => [...prev, newItem]);
    showToast('Item Diduplikasi', `Berhasil menduplikasi "${target.name}".`, 'success');
    return newItem;
  };

  const importRABItems = (items: Partial<RABItem>[]): number => {
    const targetProjId = activeProjectId || '';
    const validItems: RABItem[] = items.map((it, idx) => {
      const vol = Number(it.volume) || 1;
      const up = Number(it.unitPrice) || 0;
      return {
        id: it.id || `rab_${Date.now()}_${idx}`,
        projectId: it.projectId || targetProjId,
        code: it.code || `K-${idx + 1}`,
        name: it.name || 'Pekerjaan',
        category: (it.category as RABCategory) || 'Pekerjaan Persiapan',
        unit: it.unit || 'ls',
        volume: vol,
        unitPrice: up,
        totalCost: vol * up,
        notes: it.notes || '',
        sortOrder: it.sortOrder || idx + 1,
        sourceType: it.sourceType || 'manual',
        verificationStatus: (it.verificationStatus as any) || 'verified',
      };
    });
    setRabItems((prev) => [...prev, ...validItems]);
    showToast('Import Berhasil', `Berhasil mengimpor ${validItems.length} item pekerjaan.`, 'success');
    return validItems.length;
  };

  const reorderRABItems = (newOrder: RABItem[]) => {
    setRabItems((prev) => {
      const currentProjId = activeProjectId;
      const otherItems = prev.filter((it) => it.projectId !== currentProjId);
      const indexed = newOrder.map((it, idx) => ({ ...it, sortOrder: idx + 1 }));
      return [...otherItems, ...indexed];
    });
  };

  const clearProjectRAB = (projectId?: string) => {
    const targetId = projectId || activeProjectId;
    if (!targetId) return;
    setRabItems((prev) => prev.filter((it) => it.projectId !== targetId));
    showToast('RAB Dikosongkan', 'Seluruh item pekerjaan pada proyek ini telah dihapus.', 'info');
  };

  const applyTemplateToProject = (templateId: string, projectId: string, mode: 'append' | 'replace' = 'append'): number => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return 0;
    const newItems: RABItem[] = tmpl.items.map((it, idx) => ({
      id: `rab_${Date.now()}_${idx}`,
      projectId,
      code: it.code,
      name: it.name,
      category: it.category,
      unit: it.unit,
      volume: it.volume,
      unitPrice: it.unitPrice,
      totalCost: it.volume * it.unitPrice,
      notes: it.notes || '',
      sortOrder: idx + 1,
      sourceType: 'template',
      verificationStatus: 'verified',
    }));
    setRabItems((prev) => {
      const filtered = mode === 'replace' ? prev.filter((i) => i.projectId !== projectId) : prev;
      return [...filtered, ...newItems];
    });
    showToast('Template Diterapkan', `Berhasil memasukkan ${newItems.length} item dari template "${tmpl.name}".`, 'success');
    return newItems.length;
  };

  const saveProjectAsTemplate = (
    projectId: string,
    name: string,
    description: string,
    category: string
  ): RABTemplate | null => {
    const pItems = rabItems.filter((it) => it.projectId === projectId);
    const proj = projects.find((p) => p.id === projectId);
    const tplId = `tpl_${Date.now()}`;
    const tplItems: RABTemplateItem[] = pItems.map((it, idx) => ({
      id: `tpl_it_${Date.now()}_${idx}`,
      templateId: tplId,
      itemCode: it.code,
      description: it.name,
      category: it.category,
      unit: it.unit,
      volume: it.volume,
      unitPrice: it.unitPrice,
      calculatedAmount: it.totalCost,
      notes: it.notes || '',
      verificationStatus: 'verified',
      sortOrder: idx + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const total = pItems.reduce((s, it) => s + (it.totalCost || 0), 0);
    const newTmpl: RABTemplate = {
      id: tplId,
      ownerId: user?.id || 'usr_1',
      ownerName: user?.name || 'Administrator',
      name,
      description,
      projectType: proj?.projectType || 'Bangunan Gedung',
      category: category || 'Umum',
      status: 'active',
      visibility: 'team',
      isBuiltIn: false,
      isFavorite: false,
      version: '1.0.0',
      verificationStatus: 'verified',
      itemCount: tplItems.length,
      estimatedTotal: total,
      defaultOverhead: proj?.overheadPercent ?? 5,
      defaultProfit: proj?.profitPercent ?? 10,
      defaultTax: proj?.taxPercent ?? 11,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: tplItems,
      versions: [],
    };
    setRabTemplates((prev) => [newTmpl, ...prev]);
    showToast('Template Tersimpan', `Template "${name}" berhasil dibuat dari RAB proyek.`, 'success');
    return newTmpl;
  };

  // ── AHSP Handlers ──────────────────────────────────────────────────────────
  const addAHSPItem = (itemData: Partial<AHSPItem>): AHSPItem => {
    const comps = itemData.components || [];
    const calcPrice = comps.reduce((s, c) => s + (c.totalCost || c.coefficient * c.unitPrice || 0), 0);
    const newItem: AHSPItem = {
      id: itemData.id || `ahsp_${Date.now()}`,
      userId: user?.id || 'usr_1',
      code: itemData.code || 'A.1.1.1',
      name: itemData.name || 'Analisa Pekerjaan Baru',
      category: itemData.category || 'Pekerjaan Persiapan',
      subCategory: itemData.subCategory || '',
      unit: itemData.unit || 'm²',
      unitPrice: itemData.unitPrice || calcPrice || 0,
      components: comps,
      notes: itemData.notes || '',
      sniReference: itemData.sniReference || (itemData as any).standardSource || '',
      tahun: itemData.tahun || 2026,
      sumberData: itemData.sumberData || 'PUPR 2024 / Standar SNI',
      lastUpdated: new Date().toISOString(),
    };
    setAhspItems((prev) => [newItem, ...prev]);
    showToast('AHSP Ditambahkan', `Analisa "${newItem.name}" berhasil dibuat.`, 'success');
    return newItem;
  };

  const updateAHSPItem = (id: string, updates: Partial<AHSPItem>) => {
    setAhspItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const comps = updates.components || it.components;
        const calcPrice = comps.reduce((s, c) => s + (c.totalCost || c.coefficient * c.unitPrice || 0), 0);
        return {
          ...it,
          ...updates,
          components: comps,
          unitPrice: updates.unitPrice !== undefined ? updates.unitPrice : calcPrice,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
    showToast('AHSP Diperbarui', 'Analisa harga satuan berhasil diperbarui.', 'success');
  };

  const deleteAHSPItem = (id: string) => {
    setAhspItems((prev) => prev.filter((it) => it.id !== id));
    showToast('AHSP Dihapus', 'Item AHSP telah dihapus.', 'info');
  };

  const duplicateAHSPItem = (id: string): AHSPItem | null => {
    const target = ahspItems.find((it) => it.id === id);
    if (!target) return null;
    const newItem: AHSPItem = {
      ...target,
      id: `ahsp_${Date.now()}`,
      name: `${target.name} (Salinan)`,
      code: `${target.code}-COPY`,
      lastUpdated: new Date().toISOString(),
    };
    setAhspItems((prev) => [newItem, ...prev]);
    showToast('AHSP Diduplikasi', `Berhasil menduplikasi "${target.name}".`, 'success');
    return newItem;
  };

  const importAHSPItems = (items: Partial<AHSPItem>[]): number => {
    const validItems: AHSPItem[] = items.map((it, idx) => {
      const comps = it.components || [];
      const calcPrice = comps.reduce((s, c) => s + (c.totalCost || c.coefficient * c.unitPrice || 0), 0);
      return {
        id: it.id || `ahsp_${Date.now()}_${idx}`,
        userId: user?.id || 'usr_1',
        code: it.code || `A.${idx + 1}`,
        name: it.name || 'Pekerjaan Standar',
        category: it.category || 'Pekerjaan Persiapan',
        subCategory: it.subCategory || '',
        unit: it.unit || 'm²',
        unitPrice: it.unitPrice || calcPrice || 0,
        components: comps,
        notes: it.notes || '',
        sniReference: it.sniReference || (it as any).standardSource || '',
        tahun: it.tahun || 2026,
        sumberData: it.sumberData || 'PUPR 2024',
        lastUpdated: new Date().toISOString(),
      };
    });
    setAhspItems((prev) => [...validItems, ...prev]);
    showToast('Import AHSP Berhasil', `Berhasil mengimpor ${validItems.length} analisa AHSP.`, 'success');
    return validItems.length;
  };

  const syncAHSPWithPriceDatabase = (ahspId?: string) => {
    const priceMap = new Map<string, number>();
    priceDatabase.forEach((p) => {
      priceMap.set(p.name.toLowerCase().trim(), p.price);
      priceMap.set(p.code.toLowerCase().trim(), p.price);
    });

    setAhspItems((prev) =>
      prev.map((ahsp) => {
        if (ahspId && ahsp.id !== ahspId) return ahsp;
        const updatedComps = ahsp.components.map((comp) => {
          const matchedPrice = priceMap.get(comp.name.toLowerCase().trim());
          if (matchedPrice !== undefined) {
            return {
              ...comp,
              unitPrice: matchedPrice,
              totalCost: comp.coefficient * matchedPrice,
            };
          }
          return comp;
        });
        const total = updatedComps.reduce((s, c) => s + (c.totalCost || c.coefficient * c.unitPrice || 0), 0);
        return { ...ahsp, components: updatedComps, unitPrice: total, lastUpdated: new Date().toISOString() };
      })
    );
    showToast('Sinkronisasi AHSP', 'Komponen analisa telah disinkronkan dengan database harga.', 'success');
  };

  const recalculateAHSPPrices = (ahspId?: string) => {
    syncAHSPWithPriceDatabase(ahspId);
  };

  const addAHSPToProjectRAB = (ahspItem: AHSPItem, projectId: string, volume: number = 1): RABItem => {
    const newItem: RABItem = {
      id: `rab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      code: ahspItem.code,
      name: ahspItem.name,
      category: (ahspItem.category as RABCategory) || 'Pekerjaan Persiapan',
      unit: ahspItem.unit,
      volume,
      unitPrice: ahspItem.unitPrice,
      totalCost: volume * ahspItem.unitPrice,
      notes: ahspItem.sniReference ? `Ref: ${ahspItem.sniReference}` : '',
      sortOrder: rabItems.length + 1,
      sourceType: 'ahsp',
      sourceAHSPId: ahspItem.id,
      verificationStatus: 'verified',
    };
    setRabItems((prev) => [...prev, newItem]);
    showToast('Item Ditambahkan ke RAB', `"${ahspItem.name}" berhasil ditambahkan ke RAB proyek.`, 'success');
    return newItem;
  };

  const exportAHSPComponentsToPriceDatabase = (ahspId?: string): number => {
    const targets = ahspId ? ahspItems.filter((a) => a.id === ahspId) : ahspItems;
    let addedCount = 0;
    targets.forEach((target) => {
      target.components.forEach((comp, idx) => {
        const exists = priceDatabase.some((p) => p.name.toLowerCase() === comp.name.toLowerCase());
        if (!exists) {
          addPriceItem({
            code: `MAT-AHSP-${idx + 1}`,
            name: comp.name,
            type: comp.type || 'material',
            category: 'Komponen AHSP',
            unit: comp.unit,
            price: comp.unitPrice,
            source: `AHSP ${target.code}`,
          });
          addedCount++;
        }
      });
    });
    showToast('Ekspor Komponen', `${addedCount} komponen baru ditambahkan ke database harga.`, 'success');
    return addedCount;
  };

  // ── Price Database Handlers ────────────────────────────────────────────────
  const addPriceItem = (itemData: Partial<PriceItem>): PriceItem => {
    const newItem: PriceItem = {
      id: itemData.id || `price_${Date.now()}`,
      userId: user?.id || 'usr_1',
      code: itemData.code || `MAT-${Date.now().toString().slice(-4)}`,
      name: itemData.name || 'Item Harga Baru',
      type: (itemData.type as any) || 'material',
      category: itemData.category || 'Bahan Bangunan',
      unit: itemData.unit || 'bh',
      price: Number(itemData.price) || 0,
      source: itemData.source || 'Harga Pasar Lokal',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setPriceDatabase((prev) => [newItem, ...prev]);
    showToast('Item Harga Ditambahkan', `Item "${newItem.name}" berhasil ditambahkan ke database.`, 'success');
    return newItem;
  };

  const updatePriceItem = (id: string, updates: Partial<PriceItem>) => {
    setPriceDatabase((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : it))
    );
    showToast('Harga Diperbarui', 'Perubahan harga berhasil disimpan.', 'success');
  };

  const deletePriceItem = (id: string) => {
    setPriceDatabase((prev) => prev.filter((it) => it.id !== id));
    showToast('Item Dihapus', 'Item harga telah dihapus dari database.', 'info');
  };

  const importPriceItems = (items: Partial<PriceItem>[]): number => {
    const validItems: PriceItem[] = items.map((it, idx) => ({
      id: it.id || `price_${Date.now()}_\${idx}`,
      userId: user?.id || 'usr_1',
      code: it.code || `MAT-${idx + 1}`,
      name: it.name || 'Item Harga',
      type: (it.type as any) || 'material',
      category: it.category || 'Bahan Bangunan',
      unit: it.unit || 'satuan',
      price: Number(it.price) || 0,
      source: it.source || 'Import Harga',
      updatedAt: new Date().toISOString().split('T')[0],
    }));
    setPriceDatabase((prev) => [...validItems, ...prev]);
    showToast('Import Database Berhasil', `Berhasil mengimpor ${validItems.length} item harga.`, 'success');
    return validItems.length;
  };

  // ── Template Handlers ──────────────────────────────────────────────────────
  const createTemplateFromProject = (
    projectId: string,
    templateName: string,
    description: string = ''
  ): ProjectTemplate | null => {
    const proj = projects.find((p) => p.id === projectId);
    const pItems = rabItems.filter((it) => it.projectId === projectId);
    if (!proj) return null;
    const newTmpl: ProjectTemplate = {
      id: `ptpl_${Date.now()}`,
      userId: user?.id || 'usr_1',
      name: templateName,
      description: description || proj.notes || '',
      category: 'Proyek',
      projectType: proj.projectType || 'Bangunan Gedung',
      isBuiltIn: false,
      defaultOverhead: proj.overheadPercent,
      defaultProfit: proj.profitPercent,
      defaultTax: proj.taxPercent,
      items: pItems.map((it) => ({
        code: it.code,
        name: it.name,
        category: it.category,
        unit: it.unit,
        volume: it.volume,
        unitPrice: it.unitPrice,
        notes: it.notes,
      })),
    };
    setTemplates((prev) => [newTmpl, ...prev]);
    showToast('Template Berhasil Dibuat', `Template "${templateName}" telah disimpan.`, 'success');
    return newTmpl;
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast('Template Dihapus', 'Template proyek telah dihapus.', 'info');
  };

  const saveAsRABTemplate = (
    name: string,
    description: string,
    category: string,
    items: Partial<RABTemplateItem>[]
  ): RABTemplate => {
    const tplId = `tpl_${Date.now()}`;
    const tplItems: RABTemplateItem[] = items.map((it, idx) => {
      const vol = Number(it.volume) || 1;
      const up = Number(it.unitPrice) || 0;
      return {
        id: it.id || `tpl_it_${Date.now()}_${idx}`,
        templateId: tplId,
        itemCode: it.itemCode || `K-${idx + 1}`,
        description: it.description || 'Pekerjaan',
        category: (it.category as RABCategory) || 'Pekerjaan Persiapan',
        unit: it.unit || 'ls',
        volume: vol,
        unitPrice: up,
        calculatedAmount: it.calculatedAmount || vol * up,
        notes: it.notes || '',
        verificationStatus: it.verificationStatus || 'verified',
        sortOrder: idx + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    const total = tplItems.reduce((s, it) => s + it.calculatedAmount, 0);
    const newTmpl: RABTemplate = {
      id: tplId,
      ownerId: user?.id || 'usr_1',
      ownerName: user?.name || 'Administrator',
      name,
      description,
      projectType: 'Bangunan Gedung',
      category: category || 'Umum',
      status: 'active',
      visibility: 'team',
      isBuiltIn: false,
      isFavorite: false,
      version: '1.0.0',
      verificationStatus: 'verified',
      itemCount: tplItems.length,
      estimatedTotal: total,
      defaultOverhead: 5,
      defaultProfit: 10,
      defaultTax: 11,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: tplItems,
      versions: [],
    };
    setRabTemplates((prev) => [newTmpl, ...prev]);
    showToast('Template Disimpan', `Template "${name}" berhasil dibuat (${items.length} item).`, 'success');
    return newTmpl;
  };

  const saveProjectAsRABTemplate = (projectId: string, name: string, description: string, category: string): RABTemplate | null => {
    return saveProjectAsTemplate(projectId, name, description, category);
  };

  const updateRABTemplate = (id: string, updates: Partial<RABTemplate>) => {
    setRabTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    showToast('Template Diperbarui', 'Informasi template berhasil diperbarui.', 'success');
  };

  const deleteRABTemplate = (id: string) => {
    setRabTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast('Template Dihapus', 'Template RAB berhasil dihapus.', 'info');
  };

  const duplicateRABTemplate = (id: string): RABTemplate | null => {
    const target = rabTemplates.find((t) => t.id === id);
    if (!target) return null;
    const newId = `tpl_${Date.now()}`;
    const duplicatedItems: RABTemplateItem[] = (target.items || []).map((it, idx) => ({
      ...it,
      id: `item_${Date.now()}_${idx}`,
      templateId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const newTpl: RABTemplate = {
      ...target,
      id: newId,
      name: `${target.name} (Salinan)`,
      isBuiltIn: false,
      items: duplicatedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRabTemplates((prev) => [newTpl, ...prev]);
    showToast('Template Diduplikasi', `Berhasil menduplikasi "${target.name}"`, 'success');
    return newTpl;
  };

  const addTemplateVersion = (templateId: string, changelog: string) => {
    setRabTemplates((prev) =>
      prev.map((tmpl) => {
        if (tmpl.id !== templateId) return tmpl;
        const currentVer = tmpl.version || '1.0.0';
        const parts = currentVer.split('.').map(Number);
        const nextVer = `${parts[0] || 1}.${(parts[1] || 0) + 1}.0`;
        const newVersionObj: RABTemplateVersion = {
          id: `v_${Date.now()}`,
          templateId,
          versionNumber: nextVer,
          snapshotData: {
            name: tmpl.name,
            description: tmpl.description,
            category: tmpl.category,
            projectType: tmpl.projectType,
            defaultOverhead: tmpl.defaultOverhead,
            defaultProfit: tmpl.defaultProfit,
            defaultTax: tmpl.defaultTax,
            estimatedTotal: tmpl.estimatedTotal,
            items: [...tmpl.items],
          },
          changeSummary: changelog || 'Pembaruan versi template',
          createdBy: user?.name || 'Superadmin',
          createdAt: new Date().toISOString(),
        };
        const versions = tmpl.versions ? [newVersionObj, ...tmpl.versions] : [newVersionObj];
        return { ...tmpl, version: nextVer, versions, updatedAt: new Date().toISOString() };
      })
    );
  };

  const createTemplateVersion = addTemplateVersion;

  const syncTemplateWithPriceDatabase = (templateId: string) => {
    const priceMap = new Map<string, number>();
    priceDatabase.forEach((p) => priceMap.set(p.name.toLowerCase().trim(), p.price));

    setRabTemplates((prev) =>
      prev.map((tmpl) => {
        if (tmpl.id !== templateId) return tmpl;
        const updatedItems = tmpl.items.map((it) => {
          const matched = priceMap.get(it.description.toLowerCase().trim());
          if (matched !== undefined) {
            return {
              ...it,
              unitPrice: matched,
              calculatedAmount: it.volume * matched,
              priceSource: 'Database Harga',
            };
          }
          return it;
        });
        const total = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
        return { ...tmpl, items: updatedItems, estimatedTotal: total, updatedAt: new Date().toISOString() };
      })
    );
    showToast('Sinkronisasi Harga Selesai', 'Harga item template telah disesuaikan dengan database.', 'success');
  };

  const applyRABTemplate = (templateId: string, projectId: string, mode: 'append' | 'replace' = 'append'): number => {
    const tmpl = rabTemplates.find((t) => t.id === templateId);
    if (!tmpl) return 0;
    const newItems: RABItem[] = tmpl.items.map((it, idx) => ({
      id: `rab_${Date.now()}_${idx}`,
      projectId,
      code: it.itemCode,
      name: it.description,
      category: it.category,
      unit: it.unit,
      volume: it.volume,
      unitPrice: it.unitPrice,
      totalCost: it.calculatedAmount || it.volume * it.unitPrice,
      notes: it.notes || '',
      sortOrder: idx + 1,
      sourceType: 'template',
      sourceTemplateId: tmpl.id,
      verificationStatus: 'verified',
    }));
    setRabItems((prev) => {
      const filtered = mode === 'replace' ? prev.filter((i) => i.projectId !== projectId) : prev;
      return [...filtered, ...newItems];
    });
    showToast('Template Berhasil Diterapkan', `Berhasil memasukkan ${newItems.length} item dari template "${tmpl.name}".`, 'success');
    return newItems.length;
  };

  const applyRABTemplateToProject = applyRABTemplate;

  const createProjectFromRABTemplate = (templateId: string, projectData: Partial<Project>): Project => {
    const tmpl = rabTemplates.find((t) => t.id === templateId);
    const newProject = addProject({
      ...projectData,
      name: projectData.name || (tmpl ? `Proyek dari ${tmpl.name}` : 'Proyek Baru'),
      overheadPercent: tmpl?.defaultOverhead ?? 5,
      profitPercent: tmpl?.defaultProfit ?? 10,
      taxPercent: tmpl?.defaultTax ?? 11,
    });
    if (tmpl) {
      applyRABTemplate(templateId, newProject.id, 'replace');
    }
    return newProject;
  };

  // ── Import Jobs ────────────────────────────────────────────────────────────
  const startImportJob = (job: RABImportJob) => {
    setImportJobs((prev) => [job, ...prev]);
    setActiveImportJob(job);
  };

  const updateImportJob = (id: string, updates: Partial<RABImportJob>) => {
    setImportJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
    if (activeImportJob && activeImportJob.id === id) {
      setActiveImportJob((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const updateImportJobItem = (
    jobIdOrItemId: string,
    itemIdOrUpdates: any,
    updatesParam?: Partial<RABTemplateItem>
  ) => {
    const targetJobId = updatesParam ? jobIdOrItemId : activeImportJob?.id;
    const itemId = updatesParam ? (itemIdOrUpdates as string) : jobIdOrItemId;
    const updates = updatesParam || (itemIdOrUpdates as Partial<RABTemplateItem>);

    setImportJobs((prev) =>
      prev.map((job) => {
        if (targetJobId && job.id !== targetJobId && !(!targetJobId && job.id === activeImportJob?.id)) {
          return job;
        }
        const updatedItems = (job.parsedItems || []).map((it) =>
          it.id === itemId
            ? {
                ...it,
                ...updates,
                calculatedAmount: (updates.volume ?? it.volume) * (updates.unitPrice ?? it.unitPrice),
              }
            : it
        );
        const newTotal = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
        return {
          ...job,
          parsedItems: updatedItems,
          fileCalculatedTotal: newTotal,
          systemCalculatedTotal: newTotal,
        };
      })
    );

    if (activeImportJob) {
      const updatedItems = (activeImportJob.parsedItems || []).map((it) =>
        it.id === itemId
          ? {
              ...it,
              ...updates,
              calculatedAmount: (updates.volume ?? it.volume) * (updates.unitPrice ?? it.unitPrice),
            }
          : it
      );
      const newTotal = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
      setActiveImportJob((prev) =>
        prev
          ? {
              ...prev,
              parsedItems: updatedItems,
              fileCalculatedTotal: newTotal,
              systemCalculatedTotal: newTotal,
            }
          : null
      );
    }
  };

  const removeImportJobItem = (jobIdOrItemId: string, itemIdParam?: string) => {
    const targetJobId = itemIdParam ? jobIdOrItemId : activeImportJob?.id;
    const itemId = itemIdParam || jobIdOrItemId;

    setImportJobs((prev) =>
      prev.map((job) => {
        if (targetJobId && job.id !== targetJobId) return job;
        const updatedItems = (job.parsedItems || []).filter((it) => it.id !== itemId);
        const newTotal = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
        return {
          ...job,
          parsedItems: updatedItems,
          fileCalculatedTotal: newTotal,
          systemCalculatedTotal: newTotal,
          totalRows: updatedItems.length,
          processedRows: updatedItems.length,
          successCount: updatedItems.length,
        };
      })
    );

    if (activeImportJob) {
      const updatedItems = (activeImportJob.parsedItems || []).filter((it) => it.id !== itemId);
      const newTotal = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
      setActiveImportJob((prev) =>
        prev
          ? {
              ...prev,
              parsedItems: updatedItems,
              fileCalculatedTotal: newTotal,
              systemCalculatedTotal: newTotal,
              totalRows: updatedItems.length,
              processedRows: updatedItems.length,
              successCount: updatedItems.length,
            }
          : null
      );
    }
  };

  const addImportJobItem = (jobIdOrItem: any, itemParam?: Partial<RABTemplateItem>) => {
    const item = itemParam || (jobIdOrItem as Partial<RABTemplateItem>);
    const targetJob = (typeof jobIdOrItem === 'string' ? importJobs.find((j) => j.id === jobIdOrItem) : activeImportJob) || activeImportJob;
    if (!targetJob) return;

    const vol = Number(item.volume) || 1;
    const up = Number(item.unitPrice) || 0;
    const newItem: RABTemplateItem = {
      id: `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      templateId: targetJob.templateId || '',
      itemCode: item.itemCode || `K-${targetJob.parsedItems.length + 1}`,
      description: item.description || 'Pekerjaan Baru',
      category: (item.category as RABCategory) || 'Pekerjaan Persiapan',
      unit: item.unit || 'ls',
      volume: vol,
      unitPrice: up,
      calculatedAmount: vol * up,
      notes: item.notes || '',
      verificationStatus: 'verified',
      sortOrder: targetJob.parsedItems.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedItems = [...targetJob.parsedItems, newItem];
    const newTotal = updatedItems.reduce((s, it) => s + it.calculatedAmount, 0);
    updateImportJob(targetJob.id, {
      parsedItems: updatedItems,
      fileCalculatedTotal: newTotal,
      systemCalculatedTotal: newTotal,
      totalRows: updatedItems.length,
      processedRows: updatedItems.length,
      successCount: updatedItems.length,
    });
  };

  const saveImportJobAsTemplate = (jobIdOrOptions: any, optionsParam?: any): RABTemplate | null => {
    const options = optionsParam || jobIdOrOptions;
    const targetJob = (typeof jobIdOrOptions === 'string' ? importJobs.find((j) => j.id === jobIdOrOptions) : activeImportJob) || activeImportJob;
    if (!targetJob) return null;

    const tpl = saveAsRABTemplate(
      options.name || targetJob.fileName.replace(/\.[^/.]+$/, ''),
      options.description || `Impor dari ${targetJob.fileName}`,
      options.category || 'Umum',
      targetJob.parsedItems
    );
    updateImportJob(targetJob.id, { status: 'saved', templateId: tpl.id });
    return tpl;
  };

  const deleteImportJob = (id: string) => {
    setImportJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeImportJob?.id === id) {
      setActiveImportJob(null);
    }
  };

  const clearActiveImportJob = () => {
    setActiveImportJob(null);
  };

  // ── Drawings & AI Vision ───────────────────────────────────────────────────
  const addDrawing = (drawingData: Partial<ProjectDrawing>): ProjectDrawing => {
    const newDrawing: ProjectDrawing = {
      id: drawingData.id || `dwg_${Date.now()}`,
      projectId: drawingData.projectId || activeProjectId || '',
      fileName: drawingData.fileName || 'Gambar Kerja',
      fileSize: drawingData.fileSize || 0,
      fileType: drawingData.fileType || 'image/png',
      fileData: drawingData.fileData || '',
      fileUrl: drawingData.fileUrl || '',
      category: drawingData.category || 'Detail Arsitektur',
      uploadDate: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      scale: drawingData.scale || '1:100',
      description: drawingData.description || '',
      analysisStatus: 'pending',
    };
    setDrawings((prev) => [newDrawing, ...prev]);
    showToast('Gambar Ditambahkan', `Gambar "${newDrawing.fileName}" berhasil diunggah.`, 'success');
    return newDrawing;
  };

  const updateDrawing = (id: string, updates: Partial<ProjectDrawing>) => {
    setDrawings((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDrawing = (id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
    setDrawingAnalyses((prev) => prev.filter((a) => a.drawingId !== id));
    showToast('Gambar Dihapus', 'Gambar kerja telah dihapus.', 'info');
  };

  const analyzeDrawingWithAI = async (drawingId: string): Promise<DrawingAnalysis> => {
    const drawing = drawings.find((d) => d.id === drawingId);
    if (!drawing) throw new Error('Gambar tidak ditemukan');

    updateDrawing(drawingId, { analysisStatus: 'processing' });
    showToast('Menganalisis Gambar', 'AI sedang membaca denah, dimensi & menghitung volume...', 'info');

    try {
      const token = safeLocalStorageGet('rabpro_token');
      const res = await fetch('/api/ai/analyze-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          drawingId: drawing.id,
          fileName: drawing.fileName,
          fileData: drawing.fileData,
          category: drawing.category,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menganalisis gambar dengan server AI');
      }

      const aiData = await res.json();
      const estimated: EstimatedDrawingItem[] = (aiData.estimatedItems || []).map((it: any, idx: number) => {
        const vol = Number(it.volume) || 1;
        const up = Number(it.unitPrice) || 0;
        return {
          id: it.id || `est_${Date.now()}_${idx}`,
          drawingId: drawing.id,
          category: it.category || 'Pekerjaan Struktur',
          itemCode: it.itemCode || `DWG-${idx + 1}`,
          workCode: it.itemCode || `DWG-${idx + 1}`,
          name: it.name || 'Item Terdeteksi',
          workName: it.name || 'Item Terdeteksi',
          unit: it.unit || 'm²',
          volume: vol,
          unitPrice: up,
          totalPrice: vol * up,
          totalCost: vol * up,
          notes: it.notes || '',
          confidenceScore: it.confidence || 90,
          verificationStatus: 'verified',
        };
      });

      const total = estimated.reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
      const newAnalysis: DrawingAnalysis = {
        id: `ana_${Date.now()}`,
        drawingId: drawing.id,
        projectId: drawing.projectId,
        fileName: drawing.fileName,
        status: 'completed',
        analyzedAt: new Date().toISOString(),
        summary: aiData.summary || 'Analisis dokumen gambar konstruksi selesai.',
        detectedElements: aiData.detectedElements || [],
        extractedDimensions: aiData.extractedDimensions || [],
        estimatedItems: estimated,
        totalEstimatedCost: total,
        estimatedTotal: total,
        rawAIResponse: JSON.stringify(aiData),
      };

      setDrawingAnalyses((prev) => [newAnalysis, ...prev.filter((a) => a.drawingId !== drawing.id)]);
      updateDrawing(drawingId, { analysisStatus: 'completed' });
      showToast('Analisis Selesai', `Berhasil mengekstrak ${estimated.length} volume pekerjaan dari gambar.`, 'success');
      return newAnalysis;
    } catch (err: any) {
      updateDrawing(drawingId, { analysisStatus: 'failed' });
      showToast('Analisis Gagal', err.message || 'Gagal memproses gambar.', 'error');
      throw err;
    }
  };

  const updateEstimatedItem = (analysisId: string, itemId: string, updates: Partial<EstimatedDrawingItem>) => {
    setDrawingAnalyses((prev) =>
      prev.map((ana) => {
        if (ana.id !== analysisId) return ana;
        const newItems = (ana.estimatedItems || []).map((it) => {
          if (it.id !== itemId) return it;
          const vol = updates.volume !== undefined ? Number(updates.volume) : it.volume;
          const up = updates.unitPrice !== undefined ? Number(updates.unitPrice) : it.unitPrice;
          return {
            ...it,
            ...updates,
            volume: vol,
            unitPrice: up,
            totalPrice: vol * up,
            totalCost: vol * up,
          };
        });
        const total = newItems.reduce((s, it) => s + (it.totalPrice || it.totalCost || 0), 0);
        return { ...ana, estimatedItems: newItems, totalEstimatedCost: total, estimatedTotal: total };
      })
    );
  };

  const updateAnalysisItem = updateEstimatedItem;

  const setEstimatedItemStatus = (analysisId: string, itemId: string, status: VerificationStatus, notes?: string) => {
    setDrawingAnalyses((prev) =>
      prev.map((ana) => {
        if (ana.id !== analysisId) return ana;
        const updated = (ana.estimatedItems || []).map((it) =>
          it.id === itemId ? { ...it, verificationStatus: status, notes: notes || it.notes } : it
        );
        return { ...ana, estimatedItems: updated };
      })
    );
  };

  const verifyAnalysisItem = setEstimatedItemStatus;

  const bulkSetItemStatus = (analysisId: string, status: VerificationStatus) => {
    setDrawingAnalyses((prev) =>
      prev.map((ana) => {
        if (ana.id !== analysisId) return ana;
        const updated = (ana.estimatedItems || []).map((it) => ({ ...it, verificationStatus: status }));
        return { ...ana, estimatedItems: updated };
      })
    );
  };

  const bulkVerifyAnalysisItems = bulkSetItemStatus;

  const transferApprovedItemsToRAB = (analysisId: string, selectedItemIds?: string[]): number => {
    const analysis = drawingAnalyses.find((a) => a.id === analysisId);
    if (!analysis) return 0;
    const drawing = drawings.find((d) => d.id === analysis.drawingId);
    const targetProjId = drawing?.projectId || activeProjectId;
    if (!targetProjId) {
      showToast('Pilih Proyek', 'Pilih atau buka proyek terlebih dahulu untuk memindahkan item RAB.', 'warning');
      return 0;
    }

    const itemsToTransfer = (analysis.estimatedItems || []).filter((it) =>
      selectedItemIds ? selectedItemIds.includes(it.id) : it.verificationStatus === 'verified'
    );

    if (itemsToTransfer.length === 0) {
      showToast('Tidak Ada Item', 'Tidak ada item terverifikasi yang dipilih untuk ditransfer.', 'warning');
      return 0;
    }

    const newRABItems: RABItem[] = itemsToTransfer.map((it, idx) => {
      const vol = it.volume || 1;
      const up = it.unitPrice || 0;
      return {
        id: `rab_${Date.now()}_${idx}`,
        projectId: targetProjId,
        code: it.itemCode || it.workCode || `DWG-${idx + 1}`,
        name: it.name || it.workName || 'Item Pekerjaan Gambar',
        category: (it.category as RABCategory) || 'Pekerjaan Struktur',
        unit: it.unit || 'm²',
        volume: vol,
        unitPrice: up,
        totalCost: it.totalPrice || it.totalCost || vol * up,
        notes: it.notes ? `[Dari Gambar: ${analysis.fileName || ''}] ${it.notes}` : `[Dari Gambar: ${analysis.fileName || ''}]`,
        sortOrder: rabItems.length + idx + 1,
        sourceType: 'ai',
        sourceDrawingId: drawing?.id,
        confidence: it.confidenceScore || 90,
        verificationStatus: 'verified',
      };
    });

    setRabItems((prev) => [...prev, ...newRABItems]);
    showToast('Transfer Selesai', `Berhasil memasukkan ${newRABItems.length} item ke RAB proyek.`, 'success');
    return newRABItems.length;
  };

  const transferAnalysisToRAB = transferApprovedItemsToRAB;

  // ── S-Curve & Scheduling Handlers ──────────────────────────────────────────
  const getSCurve = (projectId?: string): ProjectSCurve | undefined => {
    const pId = projectId || activeProjectId;
    return pId ? scurves[pId] : undefined;
  };

  const createSCurveFromRAB = (
    projectId: string,
    periodType: 'weekly' | 'monthly' = 'weekly',
    totalPeriods: number = 12
  ): ProjectSCurve => {
    const proj = projects.find((p) => p.id === projectId);
    const pItems = rabItems.filter((it) => it.projectId === projectId);
    const scurve = buildSCurveFromRAB(
      projectId,
      pItems,
      periodType,
      totalPeriods,
      proj?.startDate
    );
    setScurves((prev) => ({ ...prev, [projectId]: scurve }));
    showToast('Kurva-S Dibuat', `Jadwal pelaksanaan (${totalPeriods} periode) berhasil dibuat.`, 'success');
    return scurve;
  };

  const generateSCurveFromRAB = createSCurveFromRAB;

  const syncSCurve = (projectId: string): ProjectSCurve | undefined => {
    const cur = scurves[projectId];
    if (!cur) return undefined;
    const pItems = rabItems.filter((it) => it.projectId === projectId);
    const synced = syncSCurveWithRAB(cur, pItems);
    setScurves((prev) => ({ ...prev, [projectId]: synced }));
    showToast('Kurva-S Disinkronkan', 'Bobot dan item pekerjaan telah disinkronkan dengan RAB terbaru.', 'success');
    return synced;
  };

  const syncSCurveFromRAB = syncSCurve;
  const syncSCurveWithCurrentRAB = syncSCurve;

  const updateScheduleItem = (projectId: string, itemId: string, updates: Partial<ScheduleItem>) => {
    setScurves((prev) => {
      const cur = prev[projectId];
      if (!cur) return prev;
      const updatedItems = cur.scheduleItems.map((item) =>
        item.rabItemId === itemId || item.id === itemId ? { ...item, ...updates } : item
      );
      const recalculated = recalculateSCurve({ ...cur, scheduleItems: updatedItems });
      return { ...prev, [projectId]: recalculated };
    });
  };

  const distributeScheduleWeights = (projectId: string, itemId: string, pattern: DistributionPattern) => {
    updateScheduleItem(projectId, itemId, { distributionType: pattern });
    showToast('Distribusi Bobot', `Pola distribusi item diatur ke "${pattern}".`, 'info');
  };

  const updateDistributionPattern = distributeScheduleWeights;

  const savePeriodProgress = (projectId: string, periodNumber: number, progress: Partial<PeriodProgressRecord>) => {
    setScurves((prev) => {
      const cur = prev[projectId];
      if (!cur) return prev;
      const updatedRecords = cur.periodRecords.map((r) =>
        r.period === periodNumber
          ? { ...r, ...progress, reportDate: progress.reportDate || r.reportDate || new Date().toISOString().split('T')[0] }
          : r
      );
      const recalculated = recalculateSCurve({ ...cur, periodRecords: updatedRecords });
      return { ...prev, [projectId]: recalculated };
    });
    showToast('Progress Disimpan', `Data progres periode ${periodNumber} berhasil disimpan.`, 'success');
  };

  const updatePeriodRecord = (projectId: string, record: Partial<PeriodProgressRecord> & { period: number }) => {
    if (record.period) {
      savePeriodProgress(projectId, record.period, record);
    }
  };

  const updateActualProgressRecord = savePeriodProgress;

  const importActualProgressCSV = (projectId: string, csvContent: string): number => {
    const cur = scurves[projectId];
    if (!cur) return 0;
    const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
    let updatedCount = 0;
    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const period = parseInt(parts[0]);
      const actualProg = parseFloat(parts[1]);
      if (!isNaN(period) && !isNaN(actualProg)) {
        savePeriodProgress(projectId, period, { actualProgress: actualProg, notes: parts[2] || 'Import CSV' });
        updatedCount++;
      }
    });
    showToast('Import Progress Selesai', `${updatedCount} data periode progres berhasil diimpor.`, 'success');
    return updatedCount;
  };

  const importSCurveCSV = importActualProgressCSV;

  const recalculateSCurveData = (projectId: string) => {
    setScurves((prev) => {
      const cur = prev[projectId];
      if (!cur) return prev;
      return { ...prev, [projectId]: recalculateSCurve(cur) };
    });
  };

  const exportSCurveCSV = (projectId: string): string => {
    const cur = scurves[projectId];
    if (!cur) return '';
    const headers = ['Periode', 'Tanggal', 'Rencana (%)', 'Aktual (%)', 'Deviasi (%)', 'Catatan'];
    const rows = cur.periodRecords.map((r) => [
      r.period,
      r.reportDate || '',
      r.plannedCumulative.toFixed(2),
      r.actualCumulative !== undefined ? r.actualCumulative.toFixed(2) : '',
      r.deviation !== undefined ? r.deviation.toFixed(2) : '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // ── Settings & Reset ───────────────────────────────────────────────────────
  const updateSettings = (updates: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Pengaturan Disimpan', 'Pengaturan perusahaan berhasil diperbarui.', 'success');
  };

  const resetToDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setRabItems(INITIAL_RAB_ITEMS);
    setPriceDatabase(INITIAL_PRICE_DATABASE);
    setAhspItems(INITIAL_AHSP);
    setTemplates(INITIAL_TEMPLATES);
    setRabTemplates(INITIAL_RAB_TEMPLATES);
    setDrawings(INITIAL_DRAWINGS);
    setDrawingAnalyses(INITIAL_DRAWING_ANALYSES);
    setScurves(INITIAL_SCURVES);
    setSettings(INITIAL_SETTINGS);
    setActiveProjectId(INITIAL_PROJECTS[0]?.id || null);
    showToast('Reset Berhasil', 'Data aplikasi telah dikembalikan ke data demo standar.', 'info');
  };

  const contextValue: AppContextType = {
    isDbBooting,
    user,
    activeTab,
    setActiveTab,
    activeProjectId,
    setActiveProjectId,
    selectedProject,
    activeProject,
    projects,
    rabItems,
    projectRABItems,
    priceDatabase,
    ahspItems,
    templates,
    rabTemplates,
    importJobs,
    activeImportJob,
    drawings,
    projectDrawings,
    drawingAnalyses,
    scurves,
    projectSCurve,
    settings,
    toasts,
    isSyncing,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,

    showToast,
    dismissToast,

    login,
    register,
    logout,
    changePassword,
    requestPasswordReset,
    resetPasswordWithCode,

    addProject,
    updateProject,
    deleteProject,
    duplicateProject,

    addRABItem,
    updateRABItem,
    deleteRABItem,
    duplicateRABItem,
    importRABItems,
    reorderRABItems,
    applyTemplateToProject,
    saveProjectAsTemplate,
    clearProjectRAB,

    addAHSPItem,
    updateAHSPItem,
    deleteAHSPItem,
    duplicateAHSPItem,
    importAHSPItems,
    syncAHSPWithPriceDatabase,
    recalculateAHSPPrices,
    addAHSPToProjectRAB,
    exportAHSPComponentsToPriceDatabase,

    addPriceItem,
    updatePriceItem,
    deletePriceItem,
    importPriceItems,

    createTemplateFromProject,
    deleteTemplate,
    saveAsRABTemplate,
    saveProjectAsRABTemplate,
    updateRABTemplate,
    deleteRABTemplate,
    duplicateRABTemplate,
    addTemplateVersion,
    createTemplateVersion,
    syncTemplateWithPriceDatabase,
    applyRABTemplate,
    applyRABTemplateToProject,
    createProjectFromRABTemplate,

    startImportJob,
    setActiveImportJob,
    updateImportJob,
    updateImportJobItem,
    removeImportJobItem,
    addImportJobItem,
    saveImportJobAsTemplate,
    deleteImportJob,
    clearActiveImportJob,

    addDrawing,
    updateDrawing,
    deleteDrawing,
    analyzeDrawingWithAI,
    updateAnalysisItem,
    updateEstimatedItem,
    verifyAnalysisItem,
    setEstimatedItemStatus,
    bulkVerifyAnalysisItems,
    bulkSetItemStatus,
    transferApprovedItemsToRAB,
    transferAnalysisToRAB,

    getSCurve,
    createSCurveFromRAB,
    generateSCurveFromRAB,
    syncSCurve,
    syncSCurveFromRAB,
    syncSCurveWithCurrentRAB,
    updateScheduleItem,
    distributeScheduleWeights,
    updateDistributionPattern,
    savePeriodProgress,
    updatePeriodRecord,
    updateActualProgressRecord,
    importActualProgressCSV,
    importSCurveCSV,
    recalculateSCurveData,
    exportSCurveCSV,

    updateSettings,
    resetToDemoData,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
