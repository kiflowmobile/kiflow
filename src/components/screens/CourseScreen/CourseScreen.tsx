import { Module } from '@/src/constants/types/modules';
import { Slide } from '@/src/constants/types/slides';
import { getCourseById } from '@/src/services/courses';
import { getModulesByCourse } from '@/src/services/modules';
import { getSlidesByModule } from '@/src/services/slides';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import CourseSwiper from './CourseSwiper';

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string; moduleOrder?: string; slideOrder?: string }>();
  const router = useRouter();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchModulesAndSlides = async () => {
      setLoading(true);

      if (!params.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: courseData, error: courseError } = await getCourseById(params.id);
        if (courseError) {
          console.error(courseError);
          setLoading(false);
          return;
        }
        if (!courseData) return;

        const firstSlide: Slide = {
          id: 'first-slide',
          module_id: '-1',
          slide_order: 0,
          slide_type: 'first_slide',
          slide_data: courseData.description ?? '',
          slide_title: courseData.title ?? 'Назва курсу',
        };

        const { data: fetchedModules, error: modulesError } = await getModulesByCourse(params.id);
        if (modulesError) {
          console.error(modulesError);
          return;
        }
        if (!fetchedModules) return;

        setModules(fetchedModules);

        const secondSlide: Slide = {
          id: 'second-slide',
          module_id: '-2',
          slide_order: 0,
          slide_type: 'second_slide',
          slide_data: fetchedModules.map(mod => ({
            id: mod.id,
            title: mod.title,
            description: mod.description,
          })),
          slide_title: 'Модулі курсу',
        };

        const allSlides: Slide[] = [];
        for (const mod of fetchedModules) {
          const { data: slidesData, error: slidesError } = await getSlidesByModule(mod.id);
          if (slidesError) {
            console.error(slidesError);
            continue;
          }
          if (slidesData) {
            allSlides.push(...slidesData);
          }
        }

        setSlides([firstSlide, secondSlide, ...allSlides]);
      } catch (err) {
        console.error('Unexpected error fetching modules and slides:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndSlides();
  }, [params.id]);

  // 🟢 Обробка зміни слайду
  const handleSlideChange = (index: number) => {
    const currentSlide = slides[index];
    if (!currentSlide) return;

    const module = modules.find(m => m.id === currentSlide.module_id);

    router.setParams({
      moduleOrder: module ? String(module.module_order) : '-1',
      slideOrder: String(currentSlide.slide_order),
    });
  };

  // 🟢 Обчислюємо початковий індекс слайду з moduleOrder + slideOrder
  const initialIndex = (() => {
    if (params.moduleOrder && params.slideOrder) {
      const moduleOrder = parseInt(params.moduleOrder, 10);
      const slideOrder = parseInt(params.slideOrder, 10);

      const targetModule = modules.find(m => m.module_order === moduleOrder);
      if (targetModule) {
        const targetSlideIndex = slides.findIndex(
          s => s.module_id === targetModule.id && s.slide_order === slideOrder
        );
        if (targetSlideIndex >= 0) return targetSlideIndex;
      }
    }
    return 0;
  })();

  return (
    <View style={styles.container}>
      <CourseSwiper
        slides={slides}
        initialIndex={initialIndex}
        onIndexChange={handleSlideChange}
        totalSlides={slides.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
