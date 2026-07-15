import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((setState) => {
  // Read initial auth state from localStorage to persist user session across reloads
  const savedToken = localStorage.getItem('auth_token');
  const savedUserRaw = localStorage.getItem('auth_user');
  let savedUser: User | null = null;
  
  if (savedUserRaw) {
    try {
      savedUser = JSON.parse(savedUserRaw);
    } catch {
      localStorage.removeItem('auth_user');
    }
  }

  return {
    user: savedUser,
    token: savedToken,
    isAuthenticated: !!savedToken && !!savedUser,

    login: (token, user) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setState({
        token,
        user,
        isAuthenticated: true,
      });
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setState({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    },
  };
});
