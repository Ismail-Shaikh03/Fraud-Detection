import axios from 'axios';
import type { TransactionRequest, FraudEvaluationResponse, Alert, PaginatedResponse, TimeSeriesDataPoint, UserAnalytics } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const transactionApi = {
  processTransaction: async (transaction: TransactionRequest): Promise<FraudEvaluationResponse> => {
    const response = await api.post<FraudEvaluationResponse>('/transactions', transaction);
    return response.data;
  },
  
  getTransactions: async (
    page: number = 0, 
    size: number = 15,
    riskCategory?: string
  ): Promise<PaginatedResponse<FraudEvaluationResponse>> => {
    const params: any = { page, size };
    if (riskCategory) {
      params.riskCategory = riskCategory;
    }
    const response = await api.get<PaginatedResponse<FraudEvaluationResponse>>('/transactions', {
      params
    });
    return response.data;
  },
  
  getTransactionStats: async (): Promise<{ total: number; approved: number; monitor: number; flagged: number }> => {
    const response = await api.get<{ total: number; approved: number; monitor: number; flagged: number }>('/transactions/stats');
    return response.data;
  },
  
  seedDataset: async (count: number = 1000): Promise<{ message: string; total: number; approved: number; monitor: number; flagged: number }> => {
    const response = await api.post<{ message: string; total: number; approved: number; monitor: number; flagged: number }>('/transactions/seed', null, {
      params: { count }
    });
    return response.data;
  },
  
  getTransactionById: async (transactionId: string): Promise<FraudEvaluationResponse> => {
    const response = await api.get<FraudEvaluationResponse>(`/transactions/${transactionId}`);
    return response.data;
  },
  
  searchTransactions: async (
    page: number = 0,
    size: number = 15,
    filters?: {
      transactionId?: string;
      userId?: string;
      merchantId?: string;
      startDate?: string;
      endDate?: string;
      riskCategory?: string;
    }
  ): Promise<PaginatedResponse<FraudEvaluationResponse>> => {
    const params: any = { page, size };
    if (filters) {
      if (filters.transactionId) params.transactionId = filters.transactionId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.merchantId) params.merchantId = filters.merchantId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.riskCategory) params.riskCategory = filters.riskCategory;
    }
    const response = await api.get<PaginatedResponse<FraudEvaluationResponse>>('/transactions/search', {
      params
    });
    return response.data;
  },
  
  getTimeSeriesData: async (days: number = 7): Promise<{ data: TimeSeriesDataPoint[] }> => {
    const response = await api.get<{ data: TimeSeriesDataPoint[] }>('/transactions/timeseries', {
      params: { days }
    });
    return response.data;
  },
  
  getUserTransactions: async (userId: string): Promise<UserAnalytics> => {
    const response = await api.get<UserAnalytics>(`/transactions/user/${userId}`);
    return response.data;
  },
};

export const alertApi = {
  getAlerts: async (
    page: number = 0,
    size: number = 15,
    status?: Alert['status']
  ): Promise<PaginatedResponse<Alert>> => {
    const params: any = { page, size };
    if (status) {
      params.status = status;
    }
    const response = await api.get<PaginatedResponse<Alert>>('/alerts', { params });
    return response.data;
  },

  updateAlertStatus: async (
    alertId: number,
    status: Alert['status'],
    analystNotes?: string
  ): Promise<Alert> => {
    const response = await api.put<Alert>(`/alerts/${alertId}/status`, {
      status,
      analystNotes,
    });
    return response.data;
  },
};

export const adminApi = {
  resetData: async (): Promise<{ success: boolean; message: string; deleted: { transactions: number; alerts: number; userBaselines: number } }> => {
    const response = await api.post<{ success: boolean; message: string; deleted: { transactions: number; alerts: number; userBaselines: number } }>('/admin/reset');
    return response.data;
  },
};

export default api;
