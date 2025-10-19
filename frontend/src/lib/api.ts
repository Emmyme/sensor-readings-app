import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Sensor {
  id: number;
  name: string;
  model: string;
  description?: string;
  readings_count: number;
  last_reading_timestamp?: string;
}

export interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  page?: number;
  page_size?: number;
}

// Auth API calls
export const authAPI = {
  register: async (data: { email: string; username: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/token/', data);
    return response.data;
  },
};

// Sensors API calls
export const sensorsAPI = {
  list: async (
    page = 1, 
    pageSize = 10, 
    search?: string, 
    model?: string, 
    sortBy?: string
  ): Promise<PaginatedResponse<Sensor>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (search) params.append('q', search);
    if (model && model !== 'all') params.append('model', model);
    if (sortBy) params.append('sort_by', sortBy);
    
    const response = await api.get(`/sensors/?${params}`);
    return response.data;
  },
  
  get: async (id: number): Promise<Sensor> => {
    const response = await api.get(`/sensors/${id}/`);
    return response.data;
  },
  
  create: async (data: { name: string; model: string; description?: string }): Promise<Sensor> => {
    const response = await api.post('/sensors/', data);
    return response.data;
  },
  
  update: async (id: number, data: { name?: string; model?: string; description?: string }): Promise<Sensor> => {
    const response = await api.put(`/sensors/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sensors/${id}/`);
  },
};

// Readings API calls
export const readingsAPI = {
  list: async (
    sensorId: number, 
    page = 1, 
    pageSize = 50,
    timestampFrom?: string,
    timestampTo?: string
  ): Promise<PaginatedResponse<Reading>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (timestampFrom) params.append('timestamp_from', timestampFrom);
    if (timestampTo) params.append('timestamp_to', timestampTo);
    
    const response = await api.get(`/sensors/${sensorId}/readings/?${params}`);
    return response.data;
  },
  
  create: async (sensorId: number, data: { temperature: number; humidity: number; timestamp: string }): Promise<Reading> => {
    const response = await api.post(`/sensors/${sensorId}/readings/`, data);
    return response.data;
  },
};