import api from './api';
import type { ApiResponse, PaginatedResponse, Vendor } from '../types';

export interface VendorFilters {
  search?: string;
  status?: string;
  country?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const vendorService = {
  create: (data: Omit<Vendor, '_id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<Vendor>>('/vendors', data),

  getAll: (params?: VendorFilters) =>
    api.get<PaginatedResponse<Vendor>>('/vendors', { params }),

  update: (id: string, data: Partial<Vendor>) =>
    api.put<ApiResponse<Vendor>>(`/vendors/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/vendors/${id}`),
};
