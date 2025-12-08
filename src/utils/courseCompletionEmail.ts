import { sendCourseCompletionEmail } from '@/src/services/emailService';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import { useModulesStore } from '@/src/stores/modulesStore';
import { useCourseStore } from '@/src/stores/courseStore';
import { useQuizStore } from '@/src/stores/quizStore';
import { courseService } from '@/src/services/courses';

interface ModuleItem {
  moduleId: string;
  moduleTitle?: string;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export async function sendCourseCompletionEmailUtil(
  courseId: string,
  user: User,
): Promise<void> {
  try {
    if (!user?.id) {
      console.warn('Cannot send course completion email: user ID is missing');
      return;
    }

    const mainRatingStore = useMainRatingStore.getState();
    const modulesStore = useModulesStore.getState();
    const courseStore = useCourseStore.getState();
    const quizStore = useQuizStore.getState();

    // 🔹 получаем модули курса
    const moduleItems: ModuleItem[] = (modulesStore.modules ?? [])
      .filter((m: any) => m.course_id === courseId)
      .map((m: any) => ({
        moduleId: m.id,
        moduleTitle: m.title,
      }));

    if (moduleItems.length === 0) {
      console.warn('No modules found for course', courseId);
    }

    const modulesWithSkills: any[] = [];

    // 🔹 собираем навыки по каждому модулю
    for (const mod of moduleItems) {
      const skillsForModule: any[] = [];
      try {
        if (mod.moduleId) {
          await mainRatingStore.fetchSkills(user.id, mod.moduleId);
          
          const currentState = useMainRatingStore.getState();
          const fetched = currentState.skills || [];
          
          for (const s of fetched) {
            skillsForModule.push({
              criterion_id: s.criterion_id,
              criterion_key: s.criterion_id,
              criterion_name: s.criterion_name,
              average_score: s.average_score,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch skills for module', mod.moduleId, e);
      }

      modulesWithSkills.push({
        moduleId: mod.moduleId,
        moduleTitle: mod.moduleTitle,
        skills: skillsForModule,
      });
    }

    // 🔹 считаем глобальный средний балл по курсу на основе всех оценок пользователя
    let averageScore: number | undefined = undefined;
    try {
      await mainRatingStore.fetchUserRatings(user.id);
      
      const currentRatingState = useMainRatingStore.getState();
      const allRatings = currentRatingState.ratings || [];

      const courseModuleIds: string[] =
        modulesStore.modules
          ?.filter((m: any) => m.course_id === courseId)
          ?.map((m: any) => m.id) ?? [];

      const courseRatings = allRatings.filter((r: any) =>
        courseModuleIds.includes(r.module_id),
      );

      if (courseRatings.length > 0) {
        const sum = courseRatings.reduce(
          (acc: number, r: any) => acc + (r.rating ?? 0),
          0,
        );
        const avg = sum / courseRatings.length;
        averageScore = Math.round(avg * 10) / 10;
      }
    } catch (e) {
      console.warn('Failed to compute average score for course', e);
    }

    // 🔹 считаем глобальные навыки по курсу (объединяем по ключу)
    const globalSkillsMap = new Map<
      string,
      { name: string; sum: number; count: number }
    >();

    for (const mod of modulesWithSkills) {
      for (const s of mod.skills ?? []) {
        const key = s.criterion_key || s.criterion_id;
        if (!key) continue;
        const existing = globalSkillsMap.get(key) ?? {
          name: s.criterion_name || key,
          sum: 0,
          count: 0,
        };
        existing.sum += s.average_score ?? 0;
        existing.count += 1;
        globalSkillsMap.set(key, existing);
      }
    }

    const globalSkills =
      globalSkillsMap.size > 0
        ? Array.from(globalSkillsMap.entries()).map(([key, value]) => ({
            criterion_id: key,
            criterion_key: key,
            criterion_name: value.name,
            average_score:
              value.count > 0 ? Math.round((value.sum / value.count) * 10) / 10 : 0,
          }))
        : undefined;

    // 🔹 получаем название курса
    let courseTitle: string | undefined = undefined;
    try {
      const course = courseStore.courses.find((c) => c.id === courseId);
      courseTitle = course?.title;

      // если не нашли в сторе, пытаемся получить через сервис
      if (!courseTitle) {
        const { data, error } = await courseService.getCourseById(courseId);
        if (error) {
          console.warn('Error fetching course:', error);
        } else {
          courseTitle = data?.title;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch course title', e);
    }

    // 🔹 получаем quiz score по курсу
    let quizScore: number | undefined = undefined;
    try {
      quizScore = await quizStore.getCourseScore(courseId);
      // если результат 0, возможно данных нет, оставляем undefined
      if (quizScore === 0) {
        quizScore = undefined;
      }
    } catch (e) {
      console.warn('Failed to fetch quiz score', e);
    }

    // 🔹 формируем payload для отправки
    const emailPayload = {
      userEmail: user.email || '',
      userName: user.user_metadata?.full_name || undefined,
      courseId,
      courseTitle,
      modules: modulesWithSkills,
      averageScore,
      quizScore,
      skills: globalSkills,
    };

    // 🔹 логируем payload для отладки
    console.log('📧 Course Completion Email Payload:', JSON.stringify(emailPayload, null, 2));
    console.log('📊 Payload Summary:', {
      courseId,
      courseTitle,
      userEmail: emailPayload.userEmail,
      userName: emailPayload.userName,
      modulesCount: modulesWithSkills.length,
      modulesWithSkillsCount: modulesWithSkills.filter((m) => m.skills?.length > 0).length,
      averageScore,
      quizScore,
      globalSkillsCount: globalSkills?.length ?? 0,
    });

    // 🔹 отправляем письмо
    await sendCourseCompletionEmail(emailPayload);
  } catch (e) {
    console.warn('Failed to send course completion email', e);
  }
}

