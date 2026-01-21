import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AuthProvider, useAuth } from '../AuthProvider';

const getSessionMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      onAuthStateChange: (callback: any) => ({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      })
    }
  }
}));

const createSession = (overrides: Partial<Session> = {}): Session => ({
  access_token: 'token',
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.round(Date.now() / 1000) + 3600,
  provider_token: null,
  provider_refresh_token: null,
  user: {
    id: 'user-1',
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
    updated_at: new Date().toISOString(),
    ...overrides.user
  },
  ...overrides
} as Session);

const AuthConsumer = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loading">{auth.isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="status">{auth.isAuthenticated ? 'auth' : 'guest'}</div>
      <div data-testid="roles">{auth.user?.roles.join(',') || 'none'}</div>
      <div data-testid="admin">{auth.hasPermission('admin') ? 'yes' : 'no'}</div>
    </div>
  );
};

describe('AuthProvider security', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('ignores forged localStorage entries when Supabase reports no session', async () => {
    localStorage.setItem('flashfusion-user', JSON.stringify({ id: 'forged', role: 'admin' }));
    localStorage.setItem('ff-demo-session', 'true');

    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('status').textContent).toBe('guest');
    expect(screen.getByTestId('roles').textContent).toBe('none');
    expect(screen.getByTestId('admin').textContent).toBe('no');
  });

  it('relies on Supabase app_metadata claims for permissions', async () => {
    const session = createSession({
      user: {
        app_metadata: { role: 'user' },
        user_metadata: { role: 'admin', roles: ['admin'] }
      }
    } as Partial<Session>);

    getSessionMock.mockResolvedValue({ data: { session }, error: null });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(screen.getByTestId('status').textContent).toBe('auth');
    expect(screen.getByTestId('roles').textContent).toBe('user');
    expect(screen.getByTestId('admin').textContent).toBe('no');
  });
});
