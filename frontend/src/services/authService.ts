import api from './api';
import type { ApiResponse, AuthResponse } from '../types';

export const authService = {
  login: (credentials: Record<string, string>) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
    
  verifyMe: () =>
    api.get<ApiResponse<{ user: any }>>('/auth/me'),
};
