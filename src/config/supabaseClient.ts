import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey)


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase env vars are missing! Check .env and app.config.js");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
