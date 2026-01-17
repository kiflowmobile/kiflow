import { supabase, type ApiResponse } from '@/src/shared/lib/supabase';
import type { Course, CompanyCourse } from '../types';

export const coursesApi = {
  async getPublicCourses(): Promise<ApiResponse<Course[]>> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_public', true);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      return { data: data as Course[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch public courses'),
      };
    }
  },

  async getCompanyCourses(companyIds: string[]): Promise<ApiResponse<Course[]>> {
    if (companyIds.length === 0) {
      return { data: [], error: null };
    }

    try {
      // First get course IDs from company_courses
      const { data: companyCourses, error: companyCourseError } = await supabase
        .from('company_courses')
        .select('course_id')
        .in('company_id', companyIds);

      if (companyCourseError) {
        return { data: null, error: new Error(companyCourseError.message) };
      }

      if (!companyCourses?.length) {
        return { data: [], error: null };
      }

      const courseIds = companyCourses.map((item) => item.course_id);

      // Then fetch the actual courses
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Course[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch company courses'),
      };
    }
  },

  async getCoursesByIds(courseIds: string[]): Promise<ApiResponse<Course[]>> {
    if (courseIds.length === 0) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Course[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch courses by IDs'),
      };
    }
  },

  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Course, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch course'),
      };
    }
  },

  async getUserCompanyIds(userId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const companyIds = data?.map((item) => item.company_id) || [];
      return { data: companyIds, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to fetch user company IDs'),
      };
    }
  },
};
