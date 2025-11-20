import React from 'react';
import { describe, it, beforeAll, afterAll, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

afterAll(() => {
  server.close();
});

describe('Supabase auth integration', () => {
  it('logs in through the UI using the shared Supabase client configuration', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:9999');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    vi.stubEnv('VITE_SUPABASE_PROJECT_ID', 'test-project');

    const { supabaseConfig, supabase } = await import('../../lib/supabase');
    const utilsBridge = await import('../../utils/supabase/info');
    const baseUrl = supabaseConfig.url.replace(/\/+$/, '');

    expect(utilsBridge.supabaseConfig).toBe(supabaseConfig);
    expect(utilsBridge.supabase).toBe(supabase);

    let receivedAuthHeader: string | null = null;
    let receivedProfileAuth: string | null = null;

    server.use(
      http.post(`${baseUrl}/auth/v1/token`, async ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('grant_type')).toBe('password');
        const body = await request.json();
        expect(body).toEqual({ email: 'user@example.com', password: 'secret123!' });
        receivedAuthHeader = request.headers.get('apikey');
        return HttpResponse.json({
          access_token: 'access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'refresh-token',
          user: {
            id: 'user-123',
            email: 'user@example.com',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email' },
            user_metadata: { name: 'Test User' },
            aud: 'authenticated',
            role: 'authenticated',
          },
        });
      }),
      http.get(`${baseUrl}/rest/v1/user_profiles`, async ({ request }) => {
        receivedProfileAuth = request.headers.get('apikey');
        const url = new URL(request.url);
        expect(url.searchParams.get('id')).toBe('eq.user-123');
        return HttpResponse.json(
          {
            id: 'user-123',
            email: 'user@example.com',
            name: 'MSW User',
            avatar: null,
            role: 'pro',
            subscription_tier: 'enterprise',
          },
          {
            headers: {
              'Content-Range': '0-0/1',
            },
          },
        );
      }),
    );

    const { AuthenticationSystem } = await import('../../components/auth/AuthenticationSystem');
    const onAuthSuccess = vi.fn();
    const onAuthError = vi.fn();

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <AuthenticationSystem
        onAuthSuccess={onAuthSuccess}
        onAuthError={onAuthError}
      />,
    );

    const emailInput = screen.getAllByPlaceholderText('Enter your email')[0];
    const passwordInput = screen.getAllByPlaceholderText('Enter your password')[0];
    const captchaInput = screen.getByPlaceholderText('Answer');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123!' } });
    fireEvent.change(captchaInput, { target: { value: '2' } });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalled());
    expect(onAuthError).not.toHaveBeenCalled();
    expect(receivedAuthHeader).toBe('test-anon-key');
    expect(receivedProfileAuth).toBe('test-anon-key');
    expect(onAuthSuccess.mock.calls[0][0]).toMatchObject({
      id: 'user-123',
      email: 'user@example.com',
      name: 'MSW User',
      subscription: 'enterprise',
    });

    randomSpy.mockRestore();
  });

  it('signs in and out via AuthProvider using the shared Supabase client configuration', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:9999');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    vi.stubEnv('VITE_SUPABASE_PROJECT_ID', 'test-project');

    const { supabaseConfig } = await import('../../lib/supabase');
    const baseUrl = supabaseConfig.url.replace(/\/+$/, '');

    const observedRequests: string[] = [];
    let tokenAuthHeader: string | null = null;
    let logoutAuthHeader: string | null = null;

    server.use(
      http.post(`${baseUrl}/auth/v1/token`, async ({ request }) => {
        observedRequests.push(request.url);
        tokenAuthHeader = request.headers.get('apikey');
        const body = await request.json();
        expect(body).toEqual({ email: 'user@example.com', password: 'secret123!' });
        return HttpResponse.json({
          access_token: 'provider-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'provider-refresh',
          user: {
            id: 'provider-user-123',
            email: 'user@example.com',
            email_confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email', role: 'admin' },
            user_metadata: { role: 'admin' },
            aud: 'authenticated',
            role: 'authenticated',
          },
        });
      }),
      http.post(`${baseUrl}/auth/v1/logout`, async ({ request }) => {
        observedRequests.push(request.url);
        logoutAuthHeader = request.headers.get('apikey');
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const authModule = await import('../../components/auth/AuthProvider');
    const { AuthProvider, useAuth } = authModule;

    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    const AuthConsumer = () => {
      const auth = useAuth();
      return (
        <div>
          <div data-testid="loading-state">{auth.isLoading ? 'loading' : 'idle'}</div>
          <div data-testid="auth-state">{auth.isAuthenticated ? 'auth' : 'guest'}</div>
          <button onClick={() => auth.signIn({ email: 'user@example.com', password: 'secret123!' })}>
            sign-in
          </button>
          <button onClick={() => auth.signOut()}>
            sign-out
          </button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading-state').textContent).toBe('idle'));

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('auth'));
    expect(observedRequests.filter(url => url.includes('/auth/v1/token')).length).toBe(1);
    expect(tokenAuthHeader).toBe('test-anon-key');

    fireEvent.click(screen.getByText('sign-out'));

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('guest'));
    expect(observedRequests.filter(url => url.includes('/auth/v1/logout')).length).toBe(1);
    expect(logoutAuthHeader).toBe('test-anon-key');

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });
});
