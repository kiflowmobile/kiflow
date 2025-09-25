import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ProgressMap = Record<string, number>;

interface UserProgressState {
  // Стан
  progressByModule: ProgressMap;
  isHydrated: boolean;
  isSaving: boolean;
  error: string | null;

  // Похідні геттери
  getModuleProgress: (moduleId: string) => number;
  getCourseProgress: (moduleIds: string[]) => number;

  // Дії
  setModuleProgress: (moduleId: string, progressPercent: number) => Promise<void>;
  setModuleProgressSafe: (moduleId: string, progressPercent: number) => Promise<void>;
  incrementModuleProgress: (moduleId: string, deltaPercent: number) => Promise<void>;
  resetModuleProgress: (moduleId: string) => Promise<void>;
  clearAllProgress: () => Promise<void>;

  // Внутрішні методи
  hydrateFromStorage: () => Promise<void>;
  persistToStorage: () => Promise<void>;
}

const STORAGE_KEY = 'user_progress_v1';

export const useUserProgressStore = create<UserProgressState>()((set, get) => ({
  // Початковий стан
  progressByModule: {},
  isHydrated: false,
  isSaving: false,
  error: null,

  // Похідні геттери
  getModuleProgress: (moduleId: string) => {
    const { progressByModule } = get();
    return Math.max(0, Math.min(100, progressByModule[moduleId] ?? 0));
  },

  getCourseProgress: (moduleIds: string[]) => {
    if (moduleIds.length === 0) return 0;
    
    const { progressByModule } = get();
    const totalProgress = moduleIds.reduce((sum, moduleId) => {
      return sum + (progressByModule[moduleId] ?? 0);
    }, 0);
    
    const averageProgress = totalProgress / moduleIds.length;
    return Math.max(0, Math.min(100, Math.round(averageProgress)));
  },

  // Дії
  setModuleProgress: async (moduleId: string, progressPercent: number) => {
    const safe = Math.max(0, Math.min(100, Math.round(progressPercent)));
    set(state => ({
      progressByModule: { ...state.progressByModule, [moduleId]: safe },
      error: null,
    }));
    await get().persistToStorage();
  },

  setModuleProgressSafe: async (moduleId: string, progressPercent: number) => {
    const safe = Math.max(0, Math.min(100, Math.round(progressPercent)));
    const current = get().getModuleProgress(moduleId);
    
    // Якщо модуль вже завершено на 100%, не зменшуємо прогрес
    if (current >= 100 && safe < 100) {
      return; // Не оновлюємо прогрес, але last_slide_id буде оновлено окремо
    }
    
    set(state => ({
      progressByModule: { ...state.progressByModule, [moduleId]: safe },
      error: null,
    }));
    await get().persistToStorage();
  },

  incrementModuleProgress: async (moduleId: string, deltaPercent: number) => {
    const current = get().getModuleProgress(moduleId);
    const next = current + deltaPercent;
    await get().setModuleProgress(moduleId, next);
  },

  resetModuleProgress: async (moduleId: string) => {
    set(state => {
      const copy = { ...state.progressByModule };
      delete copy[moduleId];
      return { progressByModule: copy } as Partial<UserProgressState> as UserProgressState;
    });
    await get().persistToStorage();
  },

  clearAllProgress: async () => {
    set({ progressByModule: {} });
    await get().persistToStorage();
  },

  // Внутрішні методи
  hydrateFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProgressMap;
        set({ progressByModule: parsed, isHydrated: true, error: null });
      } else {
        set({ isHydrated: true, error: null });
      }
    } catch (e: any) {
      set({ isHydrated: true, error: e?.message ?? 'Failed to load progress' });
    }
  },

  persistToStorage: async () => {
    try {
      set({ isSaving: true });
      const { progressByModule } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progressByModule));
      set({ isSaving: false, error: null });
    } catch (e: any) {
      set({ isSaving: false, error: e?.message ?? 'Failed to save progress' });
    }
  },
}));

// Запускаємо гідратацію при імпорті
useUserProgressStore.getState().hydrateFromStorage();


