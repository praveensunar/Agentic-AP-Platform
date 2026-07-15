import api from './api';
import type { ApiResponse, DashboardData, VendorDashboardData } from '../types';

export const dashboardService = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardData>>('/dashboard'),

  getVendorDashboard: () =>
    api.get<ApiResponse<VendorDashboardData>>('/vendor-dashboard'),
};
