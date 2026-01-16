import { getCurrentUser } from '@/src/utils/authUtils';
import { supabase } from '../config/supabaseClient';
import { useAnalyticsStore } from '../stores/analyticsStore';

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
export const getCompanyByCode = async (
  code: string,
): Promise<{ data: Company | null; error: any }> => {
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
  joinedViaCode: string,
): Promise<{ data: CompanyMember | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .insert({
        user_id: userId,
        company_id: companyId,
        joined_via_code: joinedViaCode,
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
  companyId: string,
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
export const getUserCompanies = async (
  userId: string,
): Promise<{ data: Company[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select(
        `
        company_id,
        companies (
          id,
          name,
          code,
          service_standards,
          created_at
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      return { data: null, error };
    }

    // Витягуємо дані компаній з результату
    const companies = data?.map((item) => item.companies).filter(Boolean) || [];

    return { data: companies as unknown as Company[], error: null };
  } catch (err) {
    console.error('Error fetching user companies:', err);
    return { data: null, error: err };
  }
};

/**
 * Приєднатися до компанії за кодом
 */
export const joinCompanyByCode = async (
  code: string,
): Promise<{ success: boolean; error?: any; company?: Company; alreadyMember?: boolean }> => {
  try {
    const analyticsStore = useAnalyticsStore.getState();
    // Отримуємо поточного користувача
    const user = await getCurrentUser();

    

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Знаходимо компанію за кодом
    const { data: company, error: companyError } = await getCompanyByCode(code);

    if (companyError || !company) {
      return { success: false, error: 'Company not found' };
    }

    // Перевіряємо, чи не є користувач уже членом цієї компанії
    const { data: existingMember, error: checkError } = await isUserMemberOfCompany(
      user.id,
      company.id,
    );

    if (checkError) {
      console.error('Error checking existing membership:', checkError);
      return { success: false, error: checkError };
    }

    if (existingMember) {
      return { success: true, company, alreadyMember: true }; // Вже член компанії
    }

    // Додаємо користувача до компанії
    const { error: addError } = await addUserToCompany(user.id, company.id, code);


    if (existingMember) {
      // Логування події для користувача, який вже член компанії
      analyticsStore.trackEvent('join_company__already_member', { companyCode: code });
      return { success: true, company, alreadyMember: true };
    }

    if (addError) {
      return { success: false, error: addError };
    }

    return { success: true, company };
  } catch (err) {
    console.error('Error joining company by code:', err);
    return { success: false, error: err };
  }
};

/**
 * Отримати всі компанії
 */
export const getAllCompanies = async (): Promise<{ data: Company[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`id, name, code, service_standards, created_at`);

    return { data, error };
  } catch (err) {
    console.error('Error fetching all companies:', err);
    return { data: null, error: err };
  }
};

/**
 * Отримати компанію по id
 */
export const getCompanyById = async (
  companyId: string,
): Promise<{ data: Company | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, code, service_standards, created_at')
      .eq('id', companyId)
      .maybeSingle();
    return { data, error };
  } catch (err) {
    console.error('Error fetching company by id:', err);
    return { data: null, error: err };
  }
};

/**
 * Оновити поле service_standards для компанії
 */
export const updateCompanyServiceStandards = async (
  companyId: string,
  standards: any,
): Promise<{ data: Company | null; error: any }> => {
  try {
    const resp = await supabase
      .from('companies')
      .update({ service_standards: standards })
      .eq('id', companyId)
      .select();

    const { data, error } = resp as { data: any; error: any };

    // Debug: логируем ответ от Supabase для упрощения дебага

    if (error) {
      return { data: null, error };
    }

    // Если массив пустой => не найдено строк для обновления
    if (!data || (Array.isArray(data) && data.length === 0)) {
      const noRowsError = {
        message: 'No rows updated',
        details: 'The update matched 0 rows',
      };
      return { data: null, error: noRowsError };
    }

    // Если вернулся массив, берем первый элемент
    const updated = Array.isArray(data) ? data[0] : data;
    return { data: updated as Company, error: null };
  } catch (err) {
    console.error('Error updating company service_standards:', err);
    return { data: null, error: err };
  }
};
