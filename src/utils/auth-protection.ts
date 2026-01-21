/**
 * @fileoverview Authentication Protection Utilities
 * @chunk auth
 * @category security
 * @version 1.0.0
 * @author FlashFusion Team
 * 
 * Utilities for managing authentication state and route protection
 */

import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Authentication user details derived from Supabase session claims
export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  roles: string[];
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  rawUser: Session['user'];
}

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: Session | null;
  error?: string;
}

// Route protection levels
export type RouteProtectionLevel = 'public' | 'protected' | 'admin';

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/features',
  '/demo',
  '/auth',
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/privacy',
  '/terms',
  '/testimonials',
  '/faq'
];

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/creator',
  '/tools',
  '/projects',
  '/deployments',
  '/analytics',
  '/collaboration',
  '/templates',
  '/integrations',
  '/settings',
  '/profile',
  '/education'
];

// Admin routes that require admin privileges
export const ADMIN_ROUTES = [
  '/admin',
  '/system',
  '/monitoring',
  '/user-management'
];

/**
 * Check if user is authenticated based on stored tokens
 */
export async function checkAuthenticationStatus(): Promise<AuthState> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase session retrieval failed:', error);
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: error.message
      };
    }

    const session = data?.session ?? null;

    if (!session) {
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null
      };
    }

    return createAuthStateFromSession(session);
  } catch (error) {
    console.error('Authentication check failed:', error);
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      error: 'Authentication check failed'
    };
  }
}

export async function getSecureSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Supabase session retrieval failed:', error);
    return null;
  }

  return data?.session ?? null;
}

export async function getSecureAccessToken(): Promise<string | null> {
  const session = await getSecureSession();
  return session?.access_token ?? null;
}

/**
 * Clear all authentication data from storage
 */
export async function clearAuthData(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign out failed:', error);
    }
  } catch (error) {
    console.error('Failed to clear authentication data:', error);
  }
}

export async function storeAuthData(session: Session | null): Promise<AuthState> {
  if (!session) {
    await clearAuthData();
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null
    };
  }

  return createAuthStateFromSession(session);
}

/**
 * Determine route protection level based on current path
 */
export function getRouteProtectionLevel(path?: string): RouteProtectionLevel {
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Check admin routes
  if (ADMIN_ROUTES.some(route => currentPath.startsWith(route))) {
    return 'admin';
  }
  
  // Check protected routes
  if (PROTECTED_ROUTES.some(route => currentPath.startsWith(route))) {
    return 'protected';
  }
  
  // Check if explicitly requesting app access
  const showApp = searchParams.has('app');
  if (showApp && !PUBLIC_ROUTES.some(route => currentPath === route || currentPath.startsWith(route + '/'))) {
    return 'protected';
  }
  
  // Default to public
  return 'public';
}

/**
 * Check if user has permission to access a route
 */
export function hasRoutePermission(authState: AuthState, routeLevel: RouteProtectionLevel): boolean {
  switch (routeLevel) {
    case 'public':
      return true;

    case 'protected':
      return authState.isAuthenticated;

    case 'admin':
      return authState.isAuthenticated && authState.user?.roles.includes('admin');

    default:
      return false;
  }
}

/**
 * Get redirect URL for authentication
 */
export function getAuthRedirectUrl(intendedPath?: string): string {
  const redirectPath = intendedPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/dashboard');
  return `/auth?mode=signin&redirect=${encodeURIComponent(redirectPath)}`;
}

/**
 * Store authentication data securely
 */
/**
 * Handle authentication state changes
 */
export function handleAuthStateChange(
  newAuthState: AuthState,
  onStateChange?: (state: AuthState) => void
): void {
  if (onStateChange) {
    onStateChange(newAuthState);
  }
  
  // Trigger custom events for other parts of the app
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff-auth-state-change', {
      detail: newAuthState
    }));
  }
}

/**
 * Get user role from authentication state
 */
export function getUserRole(authState: AuthState): string {
  if (!authState.isAuthenticated || !authState.user) {
    return 'guest';
  }

  return authState.user.role || 'user';
}

/**
 * Check if user has specific permission
 */
export function hasPermission(authState: AuthState, permission: string): boolean {
  if (!authState.isAuthenticated || !authState.user) {
    return false;
  }

  const roles = authState.user.roles.length > 0 ? authState.user.roles : ['user'];

  const rolePermissions: Record<string, string[]> = {
    admin: ['*'],
    enterprise: ['create', 'edit', 'delete', 'export', 'collaborate', 'integrate', 'advanced'],
    pro: ['create', 'edit', 'export', 'collaborate'],
    free: ['create', 'edit', 'basic'],
    user: ['create', 'edit', 'basic']
  };

  return roles.some(role => {
    const permissions = rolePermissions[role] || rolePermissions.user;
    return permissions.includes('*') || permissions.includes(permission);
  });
}

/**
 * Create auth state object from a Supabase session
 */
export function createAuthStateFromSession(session: Session): AuthState {
  const roles = extractRolesFromSession(session);

  const appMetadata = session.user.app_metadata ?? {};
  const userMetadata = session.user.user_metadata ?? {};

  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email ?? null,
    role: roles[0] ?? 'user',
    roles,
    appMetadata,
    userMetadata,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
    rawUser: session.user
  };

  return {
    isAuthenticated: true,
    isLoading: false,
    user,
    session
  };
}

function extractRolesFromSession(session: Session): string[] {
  const appMetadata = session.user.app_metadata ?? {};
  const userMetadata = session.user.user_metadata ?? {};

  const claimsRole = (appMetadata as Record<string, any>)?.claims?.role;
  const directRole = (appMetadata as Record<string, any>)?.role ?? userMetadata?.role;
  const rolesClaim = (appMetadata as Record<string, any>)?.roles ?? userMetadata?.roles;

  const collectedRoles: Array<string | undefined | string[]> = [
    claimsRole,
    directRole,
    rolesClaim
  ];

  const flattened = collectedRoles.flatMap(entry => {
    if (!entry) {
      return [];
    }

    if (Array.isArray(entry)) {
      return entry.map(role => String(role).toLowerCase());
    }

    return [String(entry).toLowerCase()];
  });

  if (flattened.length === 0) {
    return ['user'];
  }

  return Array.from(new Set(flattened));
}

export default {
  checkAuthenticationStatus,
  storeAuthData,
  clearAuthData,
  getSecureSession,
  getSecureAccessToken,
  getRouteProtectionLevel,
  hasRoutePermission,
  getAuthRedirectUrl,
  createAuthStateFromSession,
  handleAuthStateChange,
  getUserRole,
  hasPermission
};