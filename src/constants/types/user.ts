export interface User {
  id: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
  first_name?: string;
  last_name?: string;
}

export interface UserUpdateData {
  email?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
}
