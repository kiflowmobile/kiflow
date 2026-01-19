import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useModulesStore } from '../store/modulesStore';
import { useCourseStore } from '@/features/courses';
import { sendLastSlideEmail } from '../utils/lastSlideEmail';
import { dedupeClientSkills, type SkillItem } from '../utils/dedupeSkills';

interface UseLastSlideEmailParams {
  user: User | null;
  moduleId?: string;
  courseId?: string;
  average: number | null;
  skills: SkillItem[] | undefined;
}

export function useLastSlideEmail({
  user,
  moduleId,
  courseId,
  average,
  skills,
}: UseLastSlideEmailParams) {
  const emailSentRef = useRef(false);

  const triggerEmail = useCallback(
    async (slideIndex: number, slides: Array<{ id: string; slide_title?: string | null }>) => {
      const isLastSlide = slideIndex === slides.length - 1;
      const currentSlide = slides[slideIndex];

      if (!isLastSlide || emailSentRef.current || !user?.email || !currentSlide) {
        return;
      }

      emailSentRef.current = true;

      try {
        const modulesState = useModulesStore.getState();
        const coursesState = useCourseStore.getState();

        const resolvedModuleTitle =
          (modulesState.currentModule?.id === moduleId && modulesState.currentModule?.title) ||
          (moduleId ? modulesState.getModule(moduleId)?.title : undefined) ||
          currentSlide.slide_title ||
          'Модуль без назви';

        const resolvedCourseTitle =
          (coursesState.currentCourse?.id === courseId && coursesState.currentCourse?.title) ||
          (courseId
            ? coursesState.courses.find((course) => course.id === courseId)?.title
            : undefined);

        const uniqueSkills = dedupeClientSkills(skills);

        const emailData = {
          userId: user.id,
          userName:
            (user?.user_metadata &&
              (user.user_metadata.full_name || user.user_metadata.first_name)) ||
            user.email ||
            undefined,
          userEmail: user.email,
          moduleId,
          moduleTitle: resolvedModuleTitle,
          courseTitle: resolvedCourseTitle,
          slide: currentSlide as Record<string, unknown>,
          averageScore: average ?? undefined,
          skills: uniqueSkills,
        };

        // Try to get quiz score from AsyncStorage
        if (courseId) {
          try {
            const key = `quiz-progress-${courseId}`;
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              const entries = Object.values(parsed || {});
              if (Array.isArray(entries) && entries.length > 0) {
                const correct = entries.filter(
                  (q: unknown) =>
                    typeof q === 'object' &&
                    q !== null &&
                    'selectedAnswer' in q &&
                    'correctAnswer' in q &&
                    (q as { selectedAnswer: number; correctAnswer: number }).selectedAnswer ===
                      (q as { selectedAnswer: number; correctAnswer: number }).correctAnswer,
                ).length;
                const rating = (correct / entries.length) * 5;
                (emailData as Record<string, unknown>).quizScore = Math.round(rating * 10) / 10;
              }
            }
          } catch (e) {
            console.warn('[useLastSlideEmail] Failed to read quiz progress', e);
          }
        }

        const result = await sendLastSlideEmail(emailData);
        if (!result.success) {
          console.error('Failed to send last slide email:', result.error);
        }
      } catch (e) {
        console.error('Error sending last slide email', e);
      }
    },
    [average, courseId, moduleId, skills, user],
  );

  return { triggerEmail };
}
