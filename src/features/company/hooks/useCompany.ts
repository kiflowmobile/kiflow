import { useState, useCallback } from 'react';
import { companyApi } from '../api/companyApi';
import type { Company, JoinCompanyResult } from '../types';

/**
 * Hook to manage company operations
 */
export function useCompany() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCompanies = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await companyApi.getUserCompanies(userId);
      if (apiError) throw apiError;
      setCompanies(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch companies';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinCompany = useCallback(async (code: string): Promise<JoinCompanyResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await companyApi.joinCompanyByCode(code);

      if (!result.success && result.error) {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : String(result.error);
        setError(errorMessage);
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to join company';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompanyById = useCallback(async (companyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await companyApi.getCompanyById(companyId);
      if (apiError) throw apiError;
      setCurrentCompany(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch company';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    companies,
    currentCompany,
    isLoading,
    error,
    fetchUserCompanies,
    joinCompany,
    fetchCompanyById,
    clearError,
  };
}
