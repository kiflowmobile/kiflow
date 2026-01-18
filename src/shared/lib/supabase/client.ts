import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { Database } from './types';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars are missing! Check .env and app.config.js');
}

// Typed Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);

// Re-export types for convenience
export type { Database } from './types';
export * from './types';

// Helper types for query results
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;

// Common error handling wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export async function handleSupabaseError<T>(
  promise: Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await promise;
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error occurred'),
    };
  }
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getPaginationRange(params: PaginationParams): { from: number; to: number } {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}
