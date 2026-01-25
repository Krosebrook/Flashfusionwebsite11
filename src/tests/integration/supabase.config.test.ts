import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resetEnvironment = () => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
  localStorage.clear();
};

describe('supabase configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    resetEnvironment();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    resetEnvironment();
  });

  it('uses import.meta.env-driven credentials when provided', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'real-anon-key');
    vi.stubEnv('VITE_SUPABASE_PROJECT_ID', 'example');

    const createClient = vi.fn(() => ({ auth: {}, from: () => ({}) } as any));

    vi.doMock('@supabase/supabase-js', () => ({ createClient }));

    const { supabaseConfig, supabase } = await import('../../lib/supabase');
    const utilsBridge = await import('../../utils/supabase/info');
    const utilsClient = await import('../../utils/supabase/client');

    expect(supabaseConfig.url).toBe('https://example.supabase.co');
    expect(supabaseConfig.anonKey).toBe('real-anon-key');
    expect(supabaseConfig.projectId).toBe('example');
    expect(supabaseConfig.isDemoMode).toBe(false);
    expect(createClient).toHaveBeenCalledWith(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      expect.objectContaining({ auth: expect.any(Object) })
    );

    // Legacy bridge should expose the very same references
    expect(utilsBridge.supabaseConfig).toBe(supabaseConfig);
    expect(utilsBridge.supabase).toBe(supabase);
    expect(utilsClient.supabaseConfig).toBe(supabaseConfig);
    expect(utilsClient.supabase).toBe(supabase);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ff-demo-warning-shown')).toBeNull();
  });

  it('falls back to demo mode and emits a single warning when credentials are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_SUPABASE_PROJECT_ID', '');

    const createClient = vi.fn(() => ({ auth: {} } as any));
    vi.doMock('@supabase/supabase-js', () => ({ createClient }));
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { supabaseConfig } = await import('../../lib/supabase');

    expect(supabaseConfig.isDemoMode).toBe(true);
    expect(createClient).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('FlashFusion Demo Mode')
    );
    expect(sessionStorage.getItem('ff-demo-warning-shown')).toBe('true');

    consoleLogSpy.mockClear();

    // Re-import should not emit the warning twice in the same session
    const { supabaseConfig: secondLoadConfig } = await import('../../lib/supabase');
    expect(secondLoadConfig.isDemoMode).toBe(true);
    expect(consoleLogSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
