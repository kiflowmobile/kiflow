import { supabase } from '@/src/config/supabaseClient';
import { Course } from '@/src/constants/types/course';

export const courseService = {
  getPublicCourses: async (): Promise<{ data: Course[] | null; error: any }> => {
    return await supabase
      .from('courses')
      .select('*')
      .eq('is_public', true);
  },

  getCompanyCourses: async (companyIds: string[]): Promise<{ data: Course[] | null; error: any }> => {
    if (companyIds.length === 0) return { data: [], error: null };

    const { data: companyCourses, error } = await supabase
      .from('company_courses')
      .select('course_id')
      .in('company_id', companyIds);

    if (error || !companyCourses?.length) return { data: [], error };

    const courseIds = companyCourses.map(item => item.course_id);
    return await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
  },

  getCoursesByIds: async (courseIds: string[]): Promise<{ data: Course[] | null; error: any }> => {
    if (courseIds.length === 0) return { data: [], error: null };

    return await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
  },

  getCourseById: async (id: string): Promise<{ data: Course | null; error: any }> => {
    return await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
  },

  getUserCompanyIds: async (userId: string): Promise<{ data: { company_id: string }[] | null; error: any }> => {
    return await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId);
  },

  updateLastSlideId: async (userId: string, courseId: string, slideId: string) => {
    return await supabase
      .from('user_course_summaries')
      .upsert(
        { user_id: userId, course_id: courseId, last_slide_id: slideId },
        { onConflict: 'user_id,course_id' }
      );
  },
};
