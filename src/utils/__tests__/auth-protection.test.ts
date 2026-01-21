import type { Session } from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { checkAuthenticationStatus, getSecureAccessToken } from '../auth-protection';

const getSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      signOut: signOutMock
    }
  }
}));

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.round(Date.now() / 1000) + 3600,
    provider_token: null,
    provider_refresh_token: null,
    user: {
      id: 'user-123',
      app_metadata: { role: 'user' },
      user_metadata: {},
      aud: 'authenticated',
      email: 'user@example.com',
      phone: '',
      created_at: new Date().toISOString(),
      role: 'authenticated',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      factors: [],
      identities: [],
      updated_at: new Date().toISOString()
    },
    ...overrides
  } as Session;
}

const createStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  } as Storage;
};

beforeAll(() => {
  vi.stubGlobal('localStorage', createStorage());
  vi.stubGlobal('sessionStorage', createStorage());
  vi.stubGlobal('document', { cookie: '' });
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('checkAuthenticationStatus', () => {
  it('returns unauthenticated when Supabase session is null despite forged storage', async () => {
    localStorage.setItem('ff-auth-token', 'fake-token');
    localStorage.setItem('ff-user-data', JSON.stringify({ id: 'fake', role: 'admin' }));

    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    const state = await checkAuthenticationStatus();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('derives roles from Supabase session claims', async () => {
    const session = createSession({
      user: {
        id: 'admin-1',
        app_metadata: { roles: ['admin', 'pro'] },
        user_metadata: { display_name: 'Admin User' },
        aud: 'authenticated',
        email: 'admin@example.com',
        phone: '',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        factors: [],
        identities: [],
        updated_at: new Date().toISOString()
      }
    } as Partial<Session>);

    getSessionMock.mockResolvedValue({ data: { session }, error: null });

    const state = await checkAuthenticationStatus();

    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('admin@example.com');
    expect(state.user?.roles).toContain('admin');
    expect(state.user?.roles).toContain('pro');
    expect(state.session).toBe(session);
  });

  it('ignores XSS-style token injection in localStorage when fetching secure token', async () => {
    localStorage.setItem('ff-auth-token', '<script>alert(1)</script>');
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    const token = await getSecureAccessToken();

    expect(token).toBeNull();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
