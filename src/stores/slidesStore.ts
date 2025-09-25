import { supabase } from '@/src/config/supabaseClient';
import { Slide } from '@/src/constants/types/slides';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface SlidesState {
  slides: Slide[];
  currentSlideIndex: number;
  currentModuleId: string | null;
  isLoading: boolean;
  error: string | null;
  answeredBySlide: Record<string, boolean>;
  isAnsweredHydrated?: boolean;
  
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

  // Per-slide answer control
  markSlideAnswered: (slideId: string) => void;
  isSlideAnswered: (slideId: string) => boolean;
  hydrateAnsweredFromStorage: () => Promise<void>;
  persistAnsweredToStorage: () => Promise<void>;

}


export const useSlidesStore = create<SlidesState>()(
  (set, get) => ({
    slides: [],
    currentSlideIndex: 0,
    currentModuleId: null,
    isLoading: false,
    error: null,
    answeredBySlide: {},
    isAnsweredHydrated: false,

    fetchSlidesByModule: async (moduleId: string) => {
      set({ isLoading: true, error: null, currentModuleId: moduleId });
      
      try {
        const { data, error } = await supabase
          .from('slides')
          .select('*')
          .eq('module_id', moduleId)
          .order('slide_order', { ascending: true });

        if (error) throw error;
        
        set({ 
          slides: data || [], 
          currentSlideIndex: 0,
          isLoading: false, 
          error: null 
        });
        
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch slides', 
          isLoading: false 
        });
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

    clearSlides: () => set({ 
      slides: [], 
      currentSlideIndex: 0, 
      currentModuleId: null
    }),

    setSlides: (slides: Slide[]) => set({ slides }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    setCurrentModuleId: (moduleId: string | null) => set({ currentModuleId: moduleId }),

    getCurrentSlideId: () => {
      const { slides, currentSlideIndex } = get();
      return slides[currentSlideIndex]?.id ?? null;
    },

    markSlideAnswered: (slideId: string) => {
      set(state => ({
        answeredBySlide: { ...state.answeredBySlide, [slideId]: true }
      }));
      // Persist asynchronously, no await to avoid blocking UI
      get().persistAnsweredToStorage().catch(() => {});
    },

    isSlideAnswered: (slideId: string) => {
      const { answeredBySlide } = get();
      return !!answeredBySlide[slideId];
    },

    hydrateAnsweredFromStorage: async () => {
      try {
        const raw = await AsyncStorage.getItem('answered_by_slide_v1');
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, boolean>;
          set({ answeredBySlide: parsed, isAnsweredHydrated: true });
        } else {
          set({ isAnsweredHydrated: true });
        }
      } catch {
        set({ isAnsweredHydrated: true });
      }
    },

    persistAnsweredToStorage: async () => {
      try {
        const { answeredBySlide } = get();
        await AsyncStorage.setItem('answered_by_slide_v1', JSON.stringify(answeredBySlide));
      } catch {
        // ignore
      }
    },
  })
);

// Hydrate answered flags on store import
useSlidesStore.getState().hydrateAnsweredFromStorage();
