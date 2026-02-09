import { supabase } from "./supabase";
import {
  AssessmentCriterion,
  Course,
  CourseUserProgress,
  Lesson,
  Module,
  Slide,
  UserLessonCriteriaScore,
  UserModuleCriteriaScore,
} from "./types";

// ==================== INVITE CODES ====================

export async function redeemInviteCode(
  code: string
): Promise<{ success: boolean; courses?: Course[]; error?: string }> {
  try {
    const { data, error } = await (supabase.rpc as any)("redeem_invite_code", {
      input_code: code,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, courses: data || [] };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to redeem invite code",
    };
  }
}

export async function getUserEnrollments(userId: string): Promise<{ course_id: string }[]> {
  const { data, error } = await supabase.from("user_course_enrollments").select("course_id").eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data;
}

// ==================== COURSES ====================

export async function getCourses(userId?: string): Promise<Course[]> {
  // Get all courses - RLS policy handles filtering:
  // - Public courses (is_public = true) are visible to all
  // - Private courses are visible only if user is enrolled
  const { data: allCourses, error: allError } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (allError || !allCourses) {
    return [];
  }

  return allCourses;
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// ==================== MODULES ====================

export async function getModulesByCourseId(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getModuleById(moduleId: string): Promise<Module | null> {
  const { data, error } = await supabase.from("course_modules").select("*").eq("id", moduleId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// ==================== LESSONS ====================

export async function getLessonCountByCourseId(courseId: string): Promise<number> {
  const { data: modules, error: moduleError } = await (supabase.from("course_modules") as any)
    .select("id")
    .eq("course_id", courseId);

  if (moduleError || !modules || modules.length === 0) {
    return 0;
  }

  const moduleIds = (modules as any[]).map((m) => m.id);
  const { count: lessonCount, error: lessonError } = await (supabase.from("course_lessons") as any)
    .select("id", { count: "exact", head: true })
    .in("module_id", moduleIds);

  if (lessonError) {
    return 0;
  }

  return lessonCount || 0;
}

export async function getLessonsByModuleId(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// ==================== SLIDES ====================

export async function getSlidesByLessonId(lessonId: string): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("course_slides")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getSlideById(slideId: string): Promise<Slide | null> {
  const { data, error } = await supabase.from("course_slides").select("*").eq("id", slideId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// ==================== ASSESSMENT CRITERIA ====================

export async function getAssessmentCriteria(courseId: string): Promise<AssessmentCriterion[]> {
  const { data, error } = await supabase.from("course_assessment_criteria").select("*").eq("course_id", courseId);

  if (error || !data) {
    return [];
  }

  return data;
}

// ==================== USER PROGRESS ====================

export async function getUserCourseCriteriaScores(
  userId: string,
  courseId: string
): Promise<UserModuleCriteriaScore[]> {
  const { data, error } = await supabase
    .from("course_case_study_scores")
    .select(
      `
      score,
      criterion_id,
      course_case_study_interactions!inner(
        user_id,
        course_slides!inner(
          course_lessons!inner(
            course_modules!inner(
              id,
              course_id
            )
          )
        )
      )
    `
    )
    .eq("course_case_study_interactions.user_id", userId)
    .eq("course_case_study_interactions.course_slides.course_lessons.course_modules.course_id", courseId);

  if (error || !data) {
    return [];
  }

  // Group by criterion_id and calculate average score across the whole course
  const scoresByCriterion: Record<string, { total: number; count: number; moduleId: string }> = {};

  (data as any[]).forEach((item) => {
    const criterionId = item.criterion_id;
    const moduleId = item.course_case_study_interactions.course_slides.course_lessons.course_modules.id;
    if (!scoresByCriterion[criterionId]) {
      scoresByCriterion[criterionId] = { total: 0, count: 0, moduleId };
    }
    scoresByCriterion[criterionId].total += item.score;
    scoresByCriterion[criterionId].count += 1;
  });

  return Object.entries(scoresByCriterion).map(([criterionId, stats]) => ({
    id: `${courseId}-${criterionId}`,
    score: Math.round(stats.total / stats.count),
    criterion_id: criterionId,
    user_id: userId,
    module_id: stats.moduleId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export async function getUserCourseSlideInteractions(userId: string, courseId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("course_slides")
    .select(
      `
      id,
      type,
      course_lessons!inner(
        module_id,
        course_modules!inner(
          course_id
        )
      )
    `
    )
    .eq("course_lessons.course_modules.course_id", courseId);

  if (error || !data) return [];

  const slideIds = (data as any[]).map((s) => s.id);

  const [quizInteractions, caseInteractions] = await Promise.all([
    supabase.from("course_quiz_interactions").select("*").eq("user_id", userId).in("slide_id", slideIds),
    supabase
      .from("course_case_study_interactions")
      .select("*, course_case_study_scores(*)")
      .eq("user_id", userId)
      .in("slide_id", slideIds),
  ]);

  const interactions: any[] = [];

  if (quizInteractions.data) {
    (quizInteractions.data as any[]).forEach((q) => {
      const slide = (data as any[]).find((s) => s.id === q.slide_id);
      interactions.push({
        slide_id: q.slide_id,
        type: "quiz",
        score: q.selected_option_index === q.correct_option_index ? 5 : 0,
        module_id: slide?.course_lessons?.module_id,
      });
    });
  }

  if (caseInteractions.data) {
    (caseInteractions.data as any[]).forEach((c) => {
      const slide = (data as any[]).find((s) => s.id === c.slide_id);
      const scores = c.course_case_study_scores || [];
      const avgScore =
        scores.length > 0 ? scores.reduce((acc: number, curr: any) => acc + curr.score, 0) / scores.length : 0;
      interactions.push({
        slide_id: c.slide_id,
        type: "case_study",
        score: Math.round(avgScore),
        module_id: slide?.course_lessons?.module_id,
      });
    });
  }

  return interactions;
}

export async function getUserProgress(userId: string, courseId: string): Promise<CourseUserProgress | null> {
  const { data, error } = await (supabase.from("course_user_progress") as any)
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateUserProgress(
  userId: string,
  courseId: string,
  lastSlideId: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase.from("course_user_progress") as any).upsert(
    {
      user_id: userId,
      course_id: courseId,
      last_slide_id: lastSlideId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,course_id",
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetCourseProgress(
  userId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get all slides for the course to delete interactions
    const modules = await getModulesByCourseId(courseId);
    const allSlideIds: string[] = [];

    for (const module of modules) {
      const lessons = await getLessonsByModuleId(module.id);
      for (const lesson of lessons) {
        const slides = await getSlidesByLessonId(lesson.id);
        allSlideIds.push(...slides.map((s) => s.id));
      }
    }

    if (allSlideIds.length > 0) {
      // Delete quiz interactions
      await supabase
        .from("course_quiz_interactions")
        .delete()
        .eq("user_id", userId)
        .in("slide_id", allSlideIds);

      // Delete case study interactions (scores should cascade delete or be handled by database constraints)
      // Note: If scores don't cascade, we might need to delete them explicitly, but typically interactions are the parent.
      await supabase
        .from("course_case_study_interactions")
        .delete()
        .eq("user_id", userId)
        .in("slide_id", allSlideIds);
    }

    // 2. Delete user progress pointer
    const { error } = await supabase
      .from("course_user_progress")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reset course progress" };
  }
}

export async function calculateCourseProgress(userId: string, courseId: string): Promise<number> {
  // Get all slides for the course in order
  const modules = await getModulesByCourseId(courseId);
  const allSlides: Slide[] = [];

  for (const module of modules) {
    const lessons = await getLessonsByModuleId(module.id);
    for (const lesson of lessons) {
      const slides = await getSlidesByLessonId(lesson.id);
      allSlides.push(...slides);
    }
  }

  if (allSlides.length === 0) {
    return 0;
  }

  // Get user progress for the course
  const progress = await getUserProgress(userId, courseId);
  if (!progress?.last_slide_id) {
    return 0;
  }

  // Find index of the last viewed slide
  const lastSlideIndex = allSlides.findIndex((s) => s.id === progress.last_slide_id);
  if (lastSlideIndex < 0) {
    return 0;
  }

  // Progress is (last slide index + 1) / total slides
  return Math.round(((lastSlideIndex + 1) / allSlides.length) * 100);
}

export async function calculateModuleProgress(userId: string, moduleId: string): Promise<number> {
  const module = await getModuleById(moduleId);
  if (!module) return 0;

  const lessons = await getLessonsByModuleId(moduleId);
  const moduleSlides: Slide[] = [];

  for (const lesson of lessons) {
    const slides = await getSlidesByLessonId(lesson.id);
    moduleSlides.push(...slides);
  }

  if (moduleSlides.length === 0) {
    return 0;
  }

  // Check user progress for viewed slides
  const progress = await getUserProgress(userId, module.course_id);
  if (!progress?.last_slide_id) {
    return 0;
  }

  // Find if last_slide_id is in this module
  const currentSlideIndex = moduleSlides.findIndex((s) => s.id === progress.last_slide_id);

  if (currentSlideIndex >= 0) {
    // Last slide is in this module
    return Math.round(((currentSlideIndex + 1) / moduleSlides.length) * 100);
  } else {
    // If current slide is NOT in this module, check if it's in a LATER module
    const lastSlide = await getSlideById(progress.last_slide_id);
    if (lastSlide) {
      const lastLesson = await getLessonById(lastSlide.lesson_id);
      if (lastLesson) {
        const lastModule = await getModuleById(lastLesson.module_id);
        if (lastModule && lastModule.order_index > module.order_index) {
          return 100;
        }
      }
    }
    // Otherwise it's in an earlier module
    return 0;
  }
}

// ==================== USER MODULE CRITERIA SCORES ====================

export async function getLessonCriteriaScores(userId: string, lessonId: string): Promise<UserLessonCriteriaScore[]> {
  const { data, error } = await supabase
    .from("course_case_study_scores")
    .select(
      `
      score,
      criterion_id,
      course_case_study_interactions!inner(
        user_id,
        course_slides!inner(
          lesson_id
        )
      )
    `
    )
    .eq("course_case_study_interactions.user_id", userId)
    .eq("course_case_study_interactions.course_slides.lesson_id", lessonId);

  if (error || !data) {
    return [];
  }

  // Group by criterion_id and calculate average score (in case of multiple case studies in one lesson)
  const scoresByCriterion: Record<string, { total: number; count: number }> = {};

  (data as any[]).forEach((item) => {
    const criterionId = item.criterion_id;
    if (!scoresByCriterion[criterionId]) {
      scoresByCriterion[criterionId] = { total: 0, count: 0 };
    }
    scoresByCriterion[criterionId].total += item.score;
    scoresByCriterion[criterionId].count += 1;
  });

  return Object.entries(scoresByCriterion).map(([criterionId, stats]) => ({
    id: `${lessonId}-${criterionId}`, // Synthetic ID
    lesson_id: lessonId,
    score: Math.round(stats.total / stats.count),
    criterion_id: criterionId,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export async function getUserModuleCriteriaScores(
  userId: string,
  moduleId: string
): Promise<UserModuleCriteriaScore[]> {
  const { data, error } = await supabase
    .from("course_case_study_scores")
    .select(
      `
      score,
      criterion_id,
      course_case_study_interactions!inner(
        user_id,
        course_slides!inner(
          course_lessons!inner(
            module_id
          )
        )
      )
    `
    )
    .eq("course_case_study_interactions.user_id", userId)
    .eq("course_case_study_interactions.course_slides.course_lessons.module_id", moduleId);

  if (error || !data) {
    return [];
  }

  // Group by criterion_id and calculate average score
  const scoresByCriterion: Record<string, { total: number; count: number }> = {};

  (data as any[]).forEach((item) => {
    const criterionId = item.criterion_id;
    if (!scoresByCriterion[criterionId]) {
      scoresByCriterion[criterionId] = { total: 0, count: 0 };
    }
    scoresByCriterion[criterionId].total += item.score;
    scoresByCriterion[criterionId].count += 1;
  });

  return Object.entries(scoresByCriterion).map(([criterionId, stats]) => ({
    id: `${moduleId}-${criterionId}`, // Synthetic ID
    score: Math.round(stats.total / stats.count),
    criterion_id: criterionId,
    user_id: userId,
    module_id: moduleId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

// ==================== QUIZ RESPONSES ====================

export async function getLessonQuizScores(userId: string, lessonId: string): Promise<{ score: number }[]> {
  const { data, error } = await supabase
    .from("course_quiz_interactions")
    .select(
      `
      selected_option_index,
      correct_option_index,
      course_slides!inner(
        lesson_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("course_slides.lesson_id", lessonId);

  if (error || !data) {
    return [];
  }

  return (data as any[]).map((item) => ({
    score: item.selected_option_index === item.correct_option_index ? 5 : 0,
  }));
}

export async function upsertQuizResponse(
  userId: string,
  slideId: string,
  selectedOptionIndex: number,
  correctOptionIndex: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase.from("course_quiz_interactions") as any).upsert(
    {
      user_id: userId,
      slide_id: slideId,
      selected_option_index: selectedOptionIndex,
      correct_option_index: correctOptionIndex,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,slide_id",
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getQuizResponse(
  userId: string,
  slideId: string
): Promise<{
  selected_option_index: number;
  correct_option_index: number;
  created_at: string;
} | null> {
  const { data, error } = await (supabase.from("course_quiz_interactions") as any)
    .select("selected_option_index, correct_option_index, created_at")
    .eq("user_id", userId)
    .eq("slide_id", slideId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getCaseResponse(
  userId: string,
  slideId: string
): Promise<{
  id: string;
  user_answer: string;
  ai_feedback: string | null;
  created_at: string;
  scores?: { criterion_id: string; score: number }[];
} | null> {
  const { data, error } = await (supabase.from("course_case_study_interactions") as any)
    .select(
      `
      id, 
      user_answer, 
      ai_feedback, 
      created_at,
      course_case_study_scores (
        criterion_id,
        score
      )
    `
    )
    .eq("user_id", userId)
    .eq("slide_id", slideId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    user_answer: data.user_answer,
    ai_feedback: data.ai_feedback,
    created_at: data.created_at,
    scores: data.course_case_study_scores,
  };
}

// ==================== HELPER FUNCTIONS ====================

export async function getCourseWithModulesAndLessons(courseId: string): Promise<{
  course: Course | null;
  modules: (Module & { lessons: (Lesson & { slides: Slide[] })[] })[];
}> {
  const course = await getCourseById(courseId);
  if (!course) {
    return { course: null, modules: [] };
  }

  const modules = await getModulesByCourseId(courseId);
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const lessons = await getLessonsByModuleId(module.id);
      const lessonsWithSlides = await Promise.all(
        lessons.map(async (lesson) => {
          const slides = await getSlidesByLessonId(lesson.id);
          return { ...lesson, slides };
        })
      );
      return { ...module, lessons: lessonsWithSlides };
    })
  );

  return { course, modules: modulesWithLessons };
}
