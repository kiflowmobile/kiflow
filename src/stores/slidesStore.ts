import { supabase } from '@/src/config/supabaseClient';
import { Slide } from '@/src/constants/types/slides';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface SlidesState {
  slides: Slide[];
  currentSlideIndex: number;
  currentModuleId: string | null;
  isLoading: boolean;
  error: string | null;
  // Track which slides have been answered (one answer per AI slide)
  answeredBySlideId: Record<string, boolean>;

  fetchSlidesByModule: (moduleId: string) => Promise<void>;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  clearError: () => void;
  clearSlides: () => void;

  setSlides: (slides: Slide[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentModuleId: (moduleId: string | null) => void;
  getCurrentSlideId: () => string | null;
  isSlideAnswered: (slideId: string) => boolean;
  markSlideAnswered: (slideId: string) => void;
  clearAnsweredSlides: () => void;
}
type UUID = string & { readonly brand: unique symbol };

// const STORAGE_KEY = 'slides-store-answeredBySlideId';

// const readPersistedAnswered = async (): Promise<Record<string, boolean>> => {
//   try {
//     if (Platform.OS === 'web') {
//       const raw = window.localStorage.getItem(STORAGE_KEY);
//       return raw ? JSON.parse(raw) : {};
//     }
//     const raw = await AsyncStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : {};
//   } catch {
//     return {};
//   }
// };

// const writePersistedAnswered = async (value: Record<string, boolean>): Promise<void> => {
//   try {
//     const serialized = JSON.stringify(value);
//     if (Platform.OS === 'web') {
//       window.localStorage.setItem(STORAGE_KEY, serialized);
//       return;
//     }
//     await AsyncStorage.setItem(STORAGE_KEY, serialized);
//   } catch {}
// };

export const useSlidesStore = create<SlidesState>()((set, get) => ({
  slides: [],
  currentSlideIndex: 0,
  currentModuleId: null,
  isLoading: false,
  error: null,
  answeredBySlideId: {},

  fetchSlidesByModule: async (moduleId: string) => {
    set({ isLoading: true, error: null, currentModuleId: moduleId });

    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('module_id', moduleId)
        .order('slide_order', { ascending: true });

      if (error) throw error;

      const fetchedSlides: Slide[] = data || [];

      const dashboardSlide: Slide = {
        id: uuidv4() as UUID,
        slide_type: 'dashboard',
        slide_title: 'Твоя статистика',
        module_id: moduleId,
        slide_order: fetchedSlides.length,
      };

      set({
        slides: [...fetchedSlides, dashboardSlide],
        // slides: fetchedSlides,
        currentSlideIndex: 0,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch slides', isLoading: false });
      throw error;
    }
  },

  setCurrentSlideIndex: (index: number) => {
    const { slides } = get();
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    set({ currentSlideIndex: safeIndex });
  },

  nextSlide: () => {
    const { currentSlideIndex, slides } = get();
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      set({ currentSlideIndex: nextIndex });
    }
  },

  previousSlide: () => {
    const { currentSlideIndex } = get();
    const prevIndex = currentSlideIndex - 1;
    if (prevIndex >= 0) {
      set({ currentSlideIndex: prevIndex });
    }
  },

  clearError: () => set({ error: null }),

  clearSlides: () => {
    set({
      slides: [],
      currentSlideIndex: 0,
      currentModuleId: null,
      answeredBySlideId: {},
    });
    // writePersistedAnswered({});
  },

  setSlides: (slides: Slide[]) => set({ slides }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setCurrentModuleId: (moduleId: string | null) => set({ currentModuleId: moduleId }),

  getCurrentSlideId: () => {
    const { slides, currentSlideIndex } = get();
    return slides[currentSlideIndex]?.id ?? null;
  },

  isSlideAnswered: (slideId: string) => {
    return Boolean(get().answeredBySlideId[slideId]);
  },

  markSlideAnswered: (slideId: string) => {
    if (!slideId) return;
    set((state) => {
      const next = { ...state.answeredBySlideId, [slideId]: true };
      // writePersistedAnswered(next);
      return { answeredBySlideId: next };
    });
  },

  clearAnsweredSlides: () => {
    set((state) => {
      const next = Object.fromEntries(
        Object.keys(state.answeredBySlideId).map((key) => [key, false]),
      );
      // writePersistedAnswered(next);
      return { answeredBySlideId: next };
    });
  },
}));

// (async () => {
//   const initial = await readPersistedAnswered();
//   if (initial && typeof initial === 'object') {
//     useSlidesStore.setState({ answeredBySlideId: initial });
//   }
// })();
