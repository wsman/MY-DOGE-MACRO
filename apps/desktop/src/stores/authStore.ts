/**
 * MY-DOGE-MACRO Auth Store
 * Zustand store for authentication state management
 * Version: v2.0.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  // State
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshAccessToken: (tokens: Tokens) => void;
}

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8765';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (tokens) => set({ tokens }),

      login: (user, tokens) => set({
        user,
        tokens,
        isAuthenticated: true,
        error: null,
      }),

      logout: () => {
        // Call logout API
        const { tokens } = get();
        if (tokens?.access_token) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          }).catch(console.error);
        }
        
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      refreshAccessToken: (tokens) => set({ tokens }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// API helper functions
export const authApi = {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<{ user: User; tokens: Tokens }> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  /**
   * Register new user
   */
  async register(email: string, username: string, password: string): Promise<{ user: User; tokens: Tokens }> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  /**
   * Get GitHub OAuth login URL
   */
  async getGitHubLoginUrl(): Promise<{ login_url: string; state: string }> {
    const response = await fetch(`${API_BASE}/api/auth/oauth/github`);
    
    if (!response.ok) {
      throw new Error('Failed to get GitHub login URL');
    }

    return response.json();
  },

  /**
   * Handle GitHub OAuth callback
   */
  async handleGitHubCallback(code: string, state?: string): Promise<{ user: User; tokens: Tokens }> {
    const params = new URLSearchParams({ code });
    if (state) params.append('state', state);

    const response = await fetch(`${API_BASE}/api/auth/oauth/callback?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'GitHub authentication failed');
    }

    return response.json();
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<Tokens> {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  /**
   * Get current user info
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<{ authenticated: boolean; user?: Partial<User> }> {
    const response = await fetch(`${API_BASE}/api/auth/check`);
    return response.json();
  },
};

// Export types
export type { User, Tokens, AuthState };