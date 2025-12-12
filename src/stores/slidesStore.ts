import { supabase } from '@/src/config/supabaseClient';
import { Slide, DashboardSlide } from '@/src/constants/types/slides';
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

      if (error) throw error;

      const slides = data ?? [];
      
      // Сортируем уроки по lesson_order
      const sortedLessons = [...lessons].sort((a, b) => a.lesson_order - b.lesson_order);
      
      // Группируем слайды по урокам
      const slidesByLesson = new Map<string, Slide[]>();
      slides.forEach((slide) => {
        const lessonId = (slide as any).lesson_id;
        if (!lessonId) return;
        if (!slidesByLesson.has(lessonId)) {
          slidesByLesson.set(lessonId, []);
        }
        slidesByLesson.get(lessonId)!.push(slide as Slide);
      });

      // Для каждого урока проверяем, есть ли дашборд в конце, и добавляем если нет
      const finalSlides: Slide[] = [];
      sortedLessons.forEach((lesson) => {
        const lessonSlides = slidesByLesson.get(lesson.id) || [];
        
        // Сортируем слайды урока по порядку
        const sortedLessonSlides = [...lessonSlides].sort((a, b) => a.slide_order - b.slide_order);
        
        // Проверяем, есть ли дашборд в конце урока
        const lastSlide = sortedLessonSlides[sortedLessonSlides.length - 1];
        const hasDashboardAtEnd = lastSlide?.slide_type === 'dashboard';
        
        // Добавляем все слайды урока
        finalSlides.push(...sortedLessonSlides);
        
        // Если дашборда нет в конце, добавляем его
        if (!hasDashboardAtEnd) {
          const maxSlideOrder = sortedLessonSlides.length > 0 
            ? Math.max(...sortedLessonSlides.map(s => s.slide_order))
            : 0;
          
          const dashboardSlide: DashboardSlide = {
            id: `dashboard-${lesson.id}`,
            module_id: lesson.module_id,
            slide_order: maxSlideOrder + 1,
            slide_type: 'dashboard',
            slide_title: 'Статистика уроку',
            lesson_id: lesson.id,
          } as DashboardSlide;
          
          finalSlides.push(dashboardSlide);
        }
      });

      // Сортируем все слайды по lesson_id и slide_order
      finalSlides.sort((a, b) => {
        const lessonA = sortedLessons.findIndex(l => l.id === (a as any).lesson_id);
        const lessonB = sortedLessons.findIndex(l => l.id === (b as any).lesson_id);
        if (lessonA !== lessonB) {
          return lessonA - lessonB;
        }
        return a.slide_order - b.slide_order;
      });

      set({
        slides: finalSlides,
        isLoading: false
      })

    }catch(err){
      console.log(err)
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' });
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
