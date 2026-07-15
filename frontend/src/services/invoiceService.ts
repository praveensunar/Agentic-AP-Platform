import api from './api';
import type { ApiResponse, PaginatedResponse, Invoice } from '../types';

export const invoiceService = {
  upload: (formData: FormData) =>
    api.post<ApiResponse<Invoice>>('/invoices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAll: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Invoice>>('/invoices', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  update: (id: string, data: Partial<Invoice>) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/invoices/${id}`),
};
