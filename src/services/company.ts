// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/company directly
import { companyApi } from '@/src/features/company';
export type { Company, CompanyMember } from '@/src/features/company';

// Legacy function exports for backwards compatibility
export const getCompanyByCode = companyApi.getCompanyByCode;
export const addUserToCompany = companyApi.addUserToCompany;
export const isUserMemberOfCompany = companyApi.isUserMemberOfCompany;
export const getUserCompanies = companyApi.getUserCompanies;
export const joinCompanyByCode = companyApi.joinCompanyByCode;
export const getAllCompanies = companyApi.getAllCompanies;
export const getCompanyById = companyApi.getCompanyById;
export const updateCompanyServiceStandards = companyApi.updateCompanyServiceStandards;
