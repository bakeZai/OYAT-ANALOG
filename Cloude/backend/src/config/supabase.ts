import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Обычный клиент (с anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Админский клиент (с service role key) - для серверных операций
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Типы данных для базы данных
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          storage_used: number;
          storage_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          storage_used?: number;
          storage_limit?: number;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          storage_used?: number;
          storage_limit?: number;
        };
      };
      folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          user_id: string;
          path: string;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
        };
        Insert: {
          name: string;
          parent_id?: string | null;
          user_id: string;
          path: string;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          path?: string;
          is_deleted?: boolean;
        };
      };
      files: {
        Row: {
          id: string;
          name: string;
          original_name: string;
          size: number;
          mime_type: string;
          storage_path: string;
          folder_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          deleted_at: string | null;
        };
        Insert: {
          name: string;
          original_name: string;
          size: number;
          mime_type: string;
          storage_path: string;
          folder_id?: string | null;
          user_id: string;
        };
        Update: {
          name?: string;
          folder_id?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
        };
      };
    };
  };
};