import { supabase } from '@/src/config/supabaseClient';
import { Slide } from '@/src/constants/types/slides';
import { create } from 'zustand';
import { Lessons } from '../constants/types/lesson';

interface SlidesState {
  slides: Slide[];
  currentSlideIndex: number;
  currentModuleId: string | null;
  isLoading: boolean;
  error: string | null;
  answeredBySlideId: Record<string, boolean>;

  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  clearError: () => void;
  clearSlides: () => void;
  fetchSlidesByLessons: (lessons:Lessons[]) => void;
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


export const useSlidesStore = create<SlidesState>()((set, get) => ({
  slides: [],
  currentSlideIndex: 0,
  currentModuleId: null,
  isLoading: false,
  error: null,
  answeredBySlideId: {},

  fetchSlidesByLessons:async (lessons) =>{
    try{
      set({ isLoading: true, error: null});

      if (!lessons || lessons.length === 0) {
        set({ slides: [], isLoading: false });
        return;
      }

      const lessonIds = lessons.map((l) => l.id);

      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('slide_order', { ascending: true });

        set({
          slides:data ?? [],
          isLoading: false
        })

    }catch(err){
      console.log(err)
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
      return { answeredBySlideId: next };
    });
  },

  clearAnsweredSlides: () => {
    set((state) => {
      const next = Object.fromEntries(
        Object.keys(state.answeredBySlideId).map((key) => [key, false]),
      );
      return { answeredBySlideId: next };
    });
  },
}));
