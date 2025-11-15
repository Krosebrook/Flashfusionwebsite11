/**
 * Supabase configuration bridge for legacy imports.
 *
 * This module proxies configuration from `src/lib/supabase` so existing code
 * depending on `/utils/supabase/info` can continue to function while the
 * application converges on a single configuration source.
 */

import { supabaseConfig } from '../../lib/supabase';

export const projectId = supabaseConfig.projectId;
export const publicAnonKey = supabaseConfig.anonKey;
export const supabaseUrl = supabaseConfig.url;
export const isDemoMode = supabaseConfig.isDemoMode;

export default supabaseConfig;
