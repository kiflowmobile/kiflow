import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey)


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase env vars are missing! Check .env and app.config.js");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
