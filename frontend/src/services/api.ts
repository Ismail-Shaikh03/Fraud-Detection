import axios from 'axios';
import type { TransactionRequest, FraudEvaluationResponse, Alert, PaginatedResponse } from '../types';

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
};

export const alertApi = {
  getAlerts: async (status?: Alert['status']): Promise<Alert[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Alert[]>('/alerts', { params });
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
