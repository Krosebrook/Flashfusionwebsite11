import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://demo.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'demo-key';
const FALLBACK_PROJECT_ID = 'demo';

const readEnv = (key: string): string | undefined => {
  const viteEnv = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
    ? (import.meta.env as Record<string, string | undefined>)[key]
    : undefined;

  if (typeof viteEnv === 'string' && viteEnv.trim().length > 0) {
    return viteEnv.trim();
  }

  if (typeof process !== 'undefined' && process.env) {
    const processValue = process.env[key];
    if (typeof processValue === 'string' && processValue.trim().length > 0) {
      return processValue.trim();
    }
  }

  return undefined;
};

const ensureUrlHasProtocol = (value: string): string => {
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
};

const deriveProjectId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const [maybeProjectId] = parsed.hostname.split('.');
    if (!maybeProjectId) {
      return null;
    }

    if (parsed.hostname.endsWith('.supabase.co')) {
      return maybeProjectId;
    }

    return null;
  } catch (error) {
    console.warn('Failed to derive Supabase project id from URL:', error);
    return null;
  }
};

const rawUrl = readEnv('VITE_SUPABASE_URL') || FALLBACK_SUPABASE_URL;
const supabaseUrl = ensureUrlHasProtocol(rawUrl).replace(/\/+$/, '');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_SUPABASE_ANON_KEY;
const explicitProjectId = readEnv('VITE_SUPABASE_PROJECT_ID');
const projectId = explicitProjectId || deriveProjectId(supabaseUrl) || FALLBACK_PROJECT_ID;

const isDemoMode =
  supabaseUrl === FALLBACK_SUPABASE_URL ||
  supabaseAnonKey === FALLBACK_SUPABASE_ANON_KEY ||
  projectId === FALLBACK_PROJECT_ID;

export interface SupabaseConfiguration {
  url: string;
  anonKey: string;
  projectId: string;
  isDemoMode: boolean;
}

export const supabaseConfig: SupabaseConfiguration = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  projectId,
  isDemoMode,
};

// Only show warning once per session
if (isDemoMode && typeof window !== 'undefined' && !sessionStorage.getItem('ff-demo-warning-shown')) {
  console.log('🚀 FlashFusion Demo Mode: Database features are simulated for exploration.');
  console.log('💡 To enable full functionality, see SETUP.md for Supabase configuration.');
  sessionStorage.setItem('ff-demo-warning-shown', 'true');
}

// Mock Supabase client for demo mode
type SupabaseClientType = ReturnType<typeof createClient<Database>>;

const createMockSupabaseClient = (): SupabaseClientType => {
  return {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Demo mode - Sign up disabled' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Demo mode - Sign in disabled' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Demo mode - OAuth disabled' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Return a mock subscription
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Demo mode - Database disabled' } }),
          order: () => ({
            limit: async () => ({ data: [], error: null })
          })
        }),
        order: () => ({
          limit: async () => ({ data: [], error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'Demo mode - Database disabled' } })
        })
      }),
      update: () => ({
        eq: async () => ({ data: null, error: { message: 'Demo mode - Database disabled' } })
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: { message: 'Demo mode - Database disabled' } })
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'Demo mode - Database disabled' } })
        })
      })
    }),
    rpc: async () => ({ data: null, error: { message: 'Demo mode - Functions disabled' } }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    })
  } as unknown as SupabaseClientType;
};

// Create either real or mock client based on configuration
export const supabase: SupabaseClientType = supabaseConfig.isDemoMode
  ? createMockSupabaseClient()
  : createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

// Database Types (same as before)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'free' | 'pro' | 'enterprise';
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'free' | 'pro' | 'enterprise';
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'free' | 'pro' | 'enterprise';
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          level: number;
          xp: number;
          total_projects: number;
          total_images: number;
          total_code: number;
          daily_tasks_completed: number;
          streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: number;
          xp?: number;
          total_projects?: number;
          total_images?: number;
          total_code?: number;
          daily_tasks_completed?: number;
          streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: number;
          xp?: number;
          total_projects?: number;
          total_images?: number;
          total_code?: number;
          daily_tasks_completed?: number;
          streak?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          framework: string;
          status: 'draft' | 'active' | 'completed' | 'archived';
          image_url: string | null;
          config: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description: string;
          framework: string;
          status?: 'draft' | 'active' | 'completed' | 'archived';
          image_url?: string | null;
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          framework?: string;
          status?: 'draft' | 'active' | 'completed' | 'archived';
          image_url?: string | null;
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned: boolean;
          earned_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned?: boolean;
          earned_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned?: boolean;
          earned_at?: string | null;
          created_at?: string;
        };
      };
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          completed: boolean;
          completed_at: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          completed?: boolean;
          completed_at?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          date?: string;
          created_at?: string;
        };
      };
      tool_usage: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          credits_used: number;
          config: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          credits_used: number;
          config?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          credits_used?: number;
          config?: any;
          created_at?: string;
        };
      };
      deployments: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          platform: string;
          url: string | null;
          status: 'deploying' | 'deployed' | 'failed' | 'paused';
          build_time: string | null;
          auto_deploy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          platform: string;
          url?: string | null;
          status?: 'deploying' | 'deployed' | 'failed' | 'paused';
          build_time?: string | null;
          auto_deploy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          platform?: string;
          url?: string | null;
          status?: 'deploying' | 'deployed' | 'failed' | 'paused';
          build_time?: string | null;
          auto_deploy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          service: string;
          status: 'connected' | 'disconnected' | 'error';
          config: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service: string;
          status?: 'connected' | 'disconnected' | 'error';
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service?: string;
          status?: 'connected' | 'disconnected' | 'error';
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'free' | 'pro' | 'enterprise';
      project_status: 'draft' | 'active' | 'completed' | 'archived';
      deployment_status: 'deploying' | 'deployed' | 'failed' | 'paused';
      integration_status: 'connected' | 'disconnected' | 'error';
    };
  };
}

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserStatsRow = Database['public']['Tables']['user_stats']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];
export type DailyTaskRow = Database['public']['Tables']['daily_tasks']['Row'];
export type ToolUsageRow = Database['public']['Tables']['tool_usage']['Row'];
export type DeploymentRow = Database['public']['Tables']['deployments']['Row'];
export type IntegrationRow = Database['public']['Tables']['integrations']['Row'];

// Export demo mode status for other components to use
export const isSupabaseConfigured = !isDemoMode;
export const getDemoModeStatus = () => isDemoMode;