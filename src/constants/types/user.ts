export interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface UserUpdateData {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

