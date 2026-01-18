import { supabase } from '@/src/shared/lib/supabase';
import { getCurrentUser } from '@/src/features/auth';
import type { Company, CompanyMember, JoinCompanyResult } from '../types';
import type { Database } from '@/src/shared/lib/supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const companyApi = {
  /**
   * Get company by code
   */
  getCompanyByCode: async (code: string): Promise<ApiResponse<Company>> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('code', code.toLowerCase())
        .maybeSingle();

      return { data, error };
    } catch (err) {
      console.error('Error fetching company by code:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get company by ID
   */
  getCompanyById: async (companyId: string): Promise<ApiResponse<Company>> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, code, service_standards, created_at')
        .eq('id', companyId)
        .maybeSingle();

      return { data, error };
    } catch (err) {
      console.error('Error fetching company by id:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get all companies
   */
  getAllCompanies: async (): Promise<ApiResponse<Company[]>> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, code, service_standards, created_at');

      return { data: data || [], error };
    } catch (err) {
      console.error('Error fetching all companies:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Add user to company
   */
  addUserToCompany: async (
    userId: string,
    companyId: string,
    joinedViaCode: string
  ): Promise<ApiResponse<CompanyMember>> => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .insert({
          user_id: userId,
          company_id: companyId,
          joined_via_code: joinedViaCode,
        } as any)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Error adding user to company:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Check if user is member of company
   */
  isUserMemberOfCompany: async (
    userId: string,
    companyId: string
  ): Promise<ApiResponse<CompanyMember>> => {
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
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get all companies for a user
   */
  getUserCompanies: async (userId: string): Promise<ApiResponse<Company[]>> => {
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

      const companies =
        data?.map((item: any) => item.companies).filter(Boolean) || [];

      return { data: companies as unknown as Company[], error: null };
    } catch (err) {
      console.error('Error fetching user companies:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Join company by code
   */
  joinCompanyByCode: async (code: string): Promise<JoinCompanyResult> => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Find company by code
      const { data: company, error: companyError } =
        await companyApi.getCompanyByCode(code);

      if (companyError || !company) {
        return { success: false, error: 'Company not found' };
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } =
        await companyApi.isUserMemberOfCompany(user.id, company.id);

      if (checkError) {
        console.error('Error checking existing membership:', checkError);
        return { success: false, error: checkError };
      }

      if (existingMember) {
        return { success: true, company, alreadyMember: true };
      }

      // Add user to company
      const { error: addError } = await companyApi.addUserToCompany(
        user.id,
        company.id,
        code
      );

      if (addError) {
        return { success: false, error: addError };
      }

      return { success: true, company };
    } catch (err) {
      console.error('Error joining company by code:', err);
      return { success: false, error: err as Error };
    }
  },

  /**
   * Update company service standards
   */
  updateCompanyServiceStandards: async (
    companyId: string,
    standards: any
  ): Promise<ApiResponse<Company>> => {
    try {
      const resp = await supabase
        .from('companies')
        // @ts-expect-error - Supabase type inference issue with update method
        .update({ service_standards: standards })
        .eq('id', companyId)
        .select();

      const { data, error } = resp as { data: any; error: any };

      if (error) {
        return { data: null, error };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        const noRowsError = new Error('No rows updated');
        return { data: null, error: noRowsError };
      }

      const updated = Array.isArray(data) ? data[0] : data;
      return { data: updated as Company, error: null };
    } catch (err) {
      console.error('Error updating company service_standards:', err);
      return { data: null, error: err as Error };
    }
  },
};
