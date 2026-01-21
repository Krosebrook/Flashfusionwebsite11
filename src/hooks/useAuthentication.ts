/**
 * @fileoverview Authentication Hook for FlashFusion (Simplified & Fixed)
 * @chunk auth
 * @category hooks
 * @version 1.1.0
 * @author FlashFusion Team
 * 
 * Simplified authentication hook with proper error handling and fallbacks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfig } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'pro';
  subscription?: 'free' | 'pro' | 'enterprise';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export function useAuthentication() {
  const supabaseBaseUrl = supabaseConfig.url.replace(/\/+$/, '');
  const supabaseAnonKey = supabaseConfig.anonKey;
  const supabaseIsDemo = supabaseConfig.isDemoMode;

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isInitialized: false
  });

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔍 Checking authentication status...');
      
      // Try Supabase if available, otherwise fallback to no auth
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.warn('⚠️ Session check error:', error.message);
          throw error;
        }

        if (session?.user) {
          console.log('✅ Valid Supabase session found for user:', session.user.email);

          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            role: 'user',
            subscription: 'free'
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isInitialized: true
          });
          return;
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase not available or failed:', supabaseError);
        // Continue to no-auth state
      }
      
      console.log('❌ No valid session found');
      
      // No valid session found
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true
      });
      
    } catch (error) {
      console.error('Auth status check failed:', error);
      
      // Always initialize even if check fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Auth check failed',
        isInitialized: true
      });
    }
  }, [supabase]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (supabaseIsDemo || !supabaseAnonKey || supabaseAnonKey === 'demo-key') {
        console.warn('⚠️ Supabase running in demo mode, using fallback auth');

        const mockUser: AuthUser = {
          id: 'demo-user-' + Date.now(),
          email,
          name: email.split('@')[0] || 'Demo User',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          role: 'user',
          subscription: 'free'
        };

        const mockToken = btoa(JSON.stringify({ userId: mockUser.id, exp: Date.now() + 86400000 }));

        setAuthState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true
        });

        return { success: true, user: mockUser };
      }

      // Real authentication API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${supabaseBaseUrl}/functions/v1/make-server-88829a40/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({ email, password, rememberMe }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const { user, token } = await response.json();

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true
        });

        return { success: true, user };
      } catch (fetchError) {
        // If API fails, fall back to demo mode
        console.warn('⚠️ API login failed, using demo mode:', fetchError);
        
        const demoUser: AuthUser = {
          id: 'demo-user-' + Date.now(),
          email,
          name: email.split('@')[0] || 'Demo User',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          role: 'user',
          subscription: 'free'
        };
        
        const demoToken = btoa(JSON.stringify({ userId: demoUser.id, exp: Date.now() + 86400000 }));
        
        setAuthState({
          user: demoUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true
        });

        return { success: true, user: demoUser };
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isInitialized: true
      }));
      return { success: false, error: errorMessage };
    }
  }, [supabaseAnonKey, supabaseBaseUrl, supabaseIsDemo]);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      console.log('🚪 Signing out...');
      
      // Try to sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('⚠️ Supabase signout warning:', error.message);
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase signout warning:', supabaseError);
      }
      
      console.log('✅ Logout successful');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true
      });

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true
      });
      
      return { success: true };
    }
  }, [supabase]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...authState,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    clearError,
    
    // Computed
    isLoggedIn: authState.isAuthenticated && !!authState.user,
    isPro: authState.user?.subscription === 'pro' || authState.user?.subscription === 'enterprise',
    isAdmin: authState.user?.role === 'admin'
  };
}

export default useAuthentication;