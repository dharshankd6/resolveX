import axios from 'axios';
import {
  User, Customer, CustomerDetail, Complaint, Interaction, Transaction,
  Dispute, Recommendation, DashboardOverview, AuditLog,
  SentimentAnalysisResult, ChurnPredictionResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resolvex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('resolvex_token');
        localStorage.removeItem('resolvex_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    },
    register: async (userData: any) => {
      const res = await api.post('/auth/register', userData);
      return res.data;
    },
    getMe: async () => {
      const res = await api.get<User>('/auth/me');
      return res.data;
    },
  },

  // Customers
  customers: {
    list: async (params?: { skip?: number; limit?: number; search?: string; status?: string; contract_type?: string }) => {
      const res = await api.get<{ items: Customer[]; total: number; page: number; pages: number }>('/customers/', { params });
      return res.data;
    },
    get: async (id: number) => {
      const res = await api.get<CustomerDetail>(`/customers/${id}`);
      return res.data;
    },
    create: async (data: Partial<Customer>) => {
      const res = await api.post<Customer>('/customers/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Customer>) => {
      const res = await api.put<Customer>(`/customers/${id}`, data);
      return res.data;
    },
    delete: async (id: number) => {
      const res = await api.delete(`/customers/${id}`);
      return res.data;
    },
  },

  // Complaints
  complaints: {
    list: async (params?: { skip?: number; limit?: number; search?: string; status?: string; priority?: string; category?: string; customer_id?: number }) => {
      const res = await api.get<{ items: Complaint[]; total: number; page: number; pages: number }>('/complaints/', { params });
      return res.data;
    },
    get: async (id: number) => {
      const res = await api.get<any>(`/complaints/${id}`);
      return res.data;
    },
    create: async (data: any) => {
      const res = await api.post<Complaint>('/complaints/', data);
      return res.data;
    },
    update: async (id: number, data: any) => {
      const res = await api.put<Complaint>(`/complaints/${id}`, data);
      return res.data;
    },
    updateStatus: async (id: number, new_status: string, notes?: string) => {
      const res = await api.post(`/complaints/${id}/status`, { new_status, notes });
      return res.data;
    },
  },

  // Interactions & Sentiment
  interactions: {
    list: async (params?: { customer_id?: number; sentiment?: string; skip?: number; limit?: number }) => {
      const res = await api.get<Interaction[]>('/interactions/', { params });
      return res.data;
    },
    create: async (data: { customer_id: number; channel: string; raw_text: string }) => {
      const res = await api.post<Interaction>('/interactions/', data);
      return res.data;
    },
    analyze: async (text: string) => {
      const res = await api.post<SentimentAnalysisResult>('/interactions/analyze', { text });
      return res.data;
    },
  },

  // Transactions
  transactions: {
    list: async (params?: { customer_id?: number; skip?: number; limit?: number }) => {
      const res = await api.get<Transaction[]>('/transactions/', { params });
      return res.data;
    },
    create: async (data: any) => {
      const res = await api.post<Transaction>('/transactions/', data);
      return res.data;
    },
  },

  // Disputes
  disputes: {
    list: async (params?: { status?: string; risk_priority?: string; customer_id?: number; skip?: number; limit?: number }) => {
      const res = await api.get<{ items: Dispute[]; total: number; page: number; pages: number }>('/disputes/', { params });
      return res.data;
    },
    scan: async (customer_id: number) => {
      const res = await api.post<{ message: string; detected_count: number }>(`/disputes/detect/${customer_id}`);
      return res.data;
    },
    review: async (dispute_id: number, status: string, review_notes: string) => {
      const res = await api.post(`/disputes/${dispute_id}/review`, { status, review_notes });
      return res.data;
    },
  },

  // Recommendations
  recommendations: {
    list: async (params?: { approval_status?: string; customer_id?: number; skip?: number; limit?: number }) => {
      const res = await api.get<{ items: Recommendation[]; total: number; page: number; pages: number }>('/recommendations/', { params });
      return res.data;
    },
    review: async (rec_id: number, approval_status: string, reviewer_notes?: string, modified_action?: string) => {
      const res = await api.post(`/recommendations/${rec_id}/review`, { approval_status, reviewer_notes, modified_action });
      return res.data;
    },
  },

  // Machine Learning
  ml: {
    predictSentiment: async (text: string) => {
      const res = await api.post<SentimentAnalysisResult>('/ml/sentiment', { text });
      return res.data;
    },
    predictChurn: async (payload: { customer_id?: number; tenure_months: number; monthly_spending: number; complaint_count: number; contract_type: string; payment_method: string }) => {
      const res = await api.post<ChurnPredictionResult>('/ml/churn', payload);
      return res.data;
    },
    getStatus: async () => {
      const res = await api.get<any>('/ml/status');
      return res.data;
    },
  },

  // Dashboard & Analytics
  analytics: {
    getOverview: async () => {
      const res = await api.get<DashboardOverview>('/analytics/overview');
      return res.data;
    },
    getReports: async () => {
      const res = await api.get<any>('/analytics/reports');
      return res.data;
    },
  },

  // Audit Logs
  audit: {
    list: async (params?: { action?: string; entity_type?: string; skip?: number; limit?: number }) => {
      const res = await api.get<{ items: AuditLog[]; total: number; page: number; pages: number }>('/audit/', { params });
      return res.data;
    },
  },

  // Users
  users: {
    list: async () => {
      const res = await api.get<User[]>('/users/');
      return res.data;
    },
    create: async (data: any) => {
      const res = await api.post<User>('/users/', data);
      return res.data;
    },
    update: async (id: number, data: any) => {
      const res = await api.put<User>(`/users/${id}`, data);
      return res.data;
    },
  },

  // Health
  health: {
    check: async () => {
      const res = await api.get<any>('/health/');
      return res.data;
    },
  },
};
