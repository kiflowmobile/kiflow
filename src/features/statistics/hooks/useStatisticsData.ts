import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { useCourses } from '@/features/courses';
import { useModules } from '@/features/modules';
import { useSkillRatings, useCriteria, useMainRatingStore } from '@/features/statistics';
import { useUserProgress } from '@/features/progress';
import { useQuizStore } from '@/features/quiz';
import type { Skill } from '../types';

export function useStatisticsData() {
  const { user } = useAuth();
  const { courses, fetchCourses, isLoading: coursesLoading } = useCourses();
  const { criteria, fetchAllCriteria } = useCriteria();
  const { fetchUserRatings, ratings } = useSkillRatings();
  const { modules, fetchModulesByCourses } = useModules();
  const { getCourseProgress, getModuleProgress } = useUserProgress();

  const [quizScores, setQuizScores] = useState<Record<string, number | undefined>>({});
  const [skillsByCourse, setSkillsByCourse] = useState<Record<string, Skill[]>>({});
  const [loading, setLoading] = useState({ skills: true, quiz: true });

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAllCriteria();
      fetchUserRatings(user.id);
    }
  }, [user?.id, fetchCourses, fetchAllCriteria, fetchUserRatings]);

  // Load modules for courses
  useEffect(() => {
    if (courses.length) {
      fetchModulesByCourses(courses.map((c) => c.id));
    }
  }, [courses, fetchModulesByCourses]);

  // Load quiz scores
  useEffect(() => {
    if (!courses.length) {
      setLoading((s) => ({ ...s, quiz: false }));
      return;
    }

    let canceled = false;
    const load = async () => {
      setLoading((s) => ({ ...s, quiz: true }));
      const map: Record<string, number | undefined> = {};
      const quizStore = useQuizStore.getState();

      for (const c of courses) {
        try {
          map[c.id] = await quizStore.getCourseScore(c.id);
        } catch {
          map[c.id] = undefined;
        }
      }

      if (!canceled) {
        setQuizScores(map);
        setLoading((s) => ({ ...s, quiz: false }));
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [courses]);

  // Load skills for each course
  useEffect(() => {
    if (!user?.id || !modules.length || !courses.length) {
      setLoading((s) => ({ ...s, skills: false }));
      return;
    }

    let canceled = false;
    const load = async () => {
      setLoading((s) => ({ ...s, skills: true }));
      const map: Record<string, Skill[]> = {};
      const { fetchSkills } = useMainRatingStore.getState();

      for (const course of courses) {
        const courseModules = modules.filter((m) => m.course_id === course.id);
        const acc: Skill[] = [];

        for (const mod of courseModules) {
          try {
            await fetchSkills(user.id, mod.id);
            const skills = useMainRatingStore.getState().skills as Skill[];
            if (skills?.length) acc.push(...skills);
          } catch {}
        }

        map[course.id] = acc;
      }

      if (!canceled) {
        setSkillsByCourse(map);
        setLoading((s) => ({ ...s, skills: false }));
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [user?.id, modules, courses]);

  const getModulesCount = (courseId: string) =>
    modules.filter((m) => m.course_id === courseId).length;

  const getCompletedModulesCount = (courseId: string) => {
    const courseModules = modules.filter((m) => m.course_id === courseId);
    return courseModules.reduce((acc, m) => {
      try {
        return acc + (getModuleProgress(courseId, m.id) >= 100 ? 1 : 0);
      } catch {
        return acc;
      }
    }, 0);
  };

  const getCourseAverage = (courseId: string) => {
    const courseSkills = skillsByCourse[courseId] ?? [];
    return courseSkills.length
      ? parseFloat(
          (
            courseSkills.reduce((sum, s) => sum + (s.average_score || 0), 0) / courseSkills.length
          ).toFixed(1),
        )
      : 0;
  };

  return {
    user,
    courses,
    criteria,
    ratings,
    modules,
    coursesLoading,
    quizScores,
    skillsByCourse,
    loading,
    getCourseProgress,
    getModulesCount,
    getCompletedModulesCount,
    getCourseAverage,
  };
}
