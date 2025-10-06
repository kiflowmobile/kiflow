import { getCurrentUser } from '@/src/utils/authUtils';
import { supabase } from '../config/supabaseClient';

export interface Company {
  id: string;
  name: string;
  code: string;
  service_standards?: any;
  created_at: string;
}

export interface CompanyMember {
  user_id: string;
  company_id: string;
  joined_via_code?: string;
  created_at: string;
}

/**
 * Знайти компанію за кодом
 */
export const getCompanyByCode = async (code: string): Promise<{ data: Company | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('code', code.toLowerCase())
      .maybeSingle();

    return { data, error };
  } catch (err) {
    console.error('Error fetching company by code:', err);
    return { data: null, error: err };
  }
};

/**
 * Додати користувача до компанії
 */
export const addUserToCompany = async (
  userId: string, 
  companyId: string, 
  joinedViaCode: string
): Promise<{ data: CompanyMember | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .insert({
        user_id: userId,
        company_id: companyId,
        joined_via_code: joinedViaCode
      })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    console.error('Error adding user to company:', err);
    return { data: null, error: err };
  }
};

/**
 * Перевірити, чи є користувач членом компанії
 */
export const isUserMemberOfCompany = async (
  userId: string, 
  companyId: string
): Promise<{ data: CompanyMember | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    return { data, error };
  } catch (err) {
    console.error('Error checking company membership:', err);
    return { data: null, error: err };
  }
};

/**
 * Отримати всі компанії користувача
 */
export const getUserCompanies = async (userId: string): Promise<{ data: Company[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select(`
        company_id,
        companies (
          id,
          name,
          code,
          service_standards,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error };
    }

    // Витягуємо дані компаній з результату
    const companies = data?.map(item => item.companies).filter(Boolean) || [];
    
    return { data: companies as unknown as Company[], error: null };
  } catch (err) {
    console.error('Error fetching user companies:', err);
    return { data: null, error: err };
  }
};

/**
 * Приєднатися до компанії за кодом
 */
export const joinCompanyByCode = async (code: string): Promise<{ success: boolean; error?: any; company?: Company; alreadyMember?: boolean }> => {
  console.log("joinCompanyByCode", joinCompanyByCode)  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

  //   // 1. Отримуємо компанію
    const { data: company, error: companyError } = await getCompanyByCode(code);
    if (companyError || !company) {
      return { success: false, error: 'Company not found' };
    }

    // 2. Перевіряємо членство
    const { data: existingMember, error: checkError } = await isUserMemberOfCompany(user.id, company.id);
    if (checkError) {
      console.error('Error checking existing membership:', checkError);
      return { success: false, error: checkError };
    }

    if (existingMember) {
      return { success: true, company, alreadyMember: true };
    }

    // 3. Додаємо користувача в компанію
    const { error: addError } = await addUserToCompany(user.id, company.id, code);
    if (addError) {
      return { success: false, error: addError };
    }
      

    return { success: true, company };
  } catch (err) {
    console.error('Error joining company by code:', err);
    return { success: false, error: err };
  }
};

// export const updateCourseProgress = async (userId: string, courseId: string, progress: number) => {
//   const { error } = await supabase
//     .from('user_course_summaries')
//     .update({ progress })
//     .eq('user_id', userId)
//     .eq('course_id', courseId);

//   if (error) throw error;
// };