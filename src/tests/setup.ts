/**
 * Test Environment Setup
 * 
 * Configures global test environment for Vitest
 * Target: 85%+ test coverage
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock Storage implementation with persistence for tests
class MemoryStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  key = vi.fn((index: number) => Array.from(this.store.keys())[index] ?? null);

  getItem = vi.fn((key: string) => (this.store.has(key) ? this.store.get(key)! : null));

  setItem = vi.fn((key: string, value: string) => {
    this.store.set(key, String(value));
  });

  removeItem = vi.fn((key: string) => {
    this.store.delete(key);
  });

  clear = vi.fn(() => {
    this.store.clear();
  });
}

global.localStorage = new MemoryStorage() as any;
global.sessionStorage = new MemoryStorage() as any;

// Console error/warning tracking
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn((...args) => {
    // Ignore specific expected errors
    const msg = args[0]?.toString() || '';
    if (msg.includes('Not implemented: HTMLFormElement.prototype.submit')) {
      return;
    }
    originalError(...args);
  });
  
  console.warn = vi.fn((...args) => {
    // Ignore specific expected warnings
    const msg = args[0]?.toString() || '';
    if (msg.includes('ReactDOM.render')) {
      return;
    }
    originalWarn(...args);
  });
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export {};
