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