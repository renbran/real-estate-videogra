import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { User, UserRole, AgentTier } from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// Re-export User type from types.ts for convenience
export type { User };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  tier?: AgentTier;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Token Management
class TokenManager {
  private static readonly TOKEN_KEY = 'osus_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'osus_refresh_token';
  private static readonly USER_KEY = 'osus_current_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = TokenManager.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }
        
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`[API] Response from ${response.config.url}:`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Refresh the token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { token } = response.data.data;
            TokenManager.setToken(token);

            // Notify all subscribers
            this.refreshSubscribers.forEach((callback) => callback(token));
            this.refreshSubscribers = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            TokenManager.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as ApiResponse;
      console.error(`[API] Error ${error.response.status}:`, data.error || data.message);
      
      return Promise.reject({
        status: error.response.status,
        message: data.error || data.message || 'An error occurred',
        details: data.details,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('[API] No response received:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
        details: error.message,
      });
    } else {
      // Error setting up request
      console.error('[API] Request setup error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message || 'Failed to make request',
      });
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data.data as T;
    } catch (error: any) {
      if (retries > 0 && (error.status === 0 || error.status >= 500)) {
        console.log(`[API] Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken, user } = response.data.data;
      TokenManager.setToken(token);
      TokenManager.setRefreshToken(refreshToken);
      TokenManager.setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Login failed');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken, user } = response.data.data;
      TokenManager.setToken(token);
      TokenManager.setRefreshToken(refreshToken);
      TokenManager.setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.retryRequest(() => 
      this.client.get<ApiResponse<User>>('/auth/me')
    );
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Generic CRUD Methods
  async get<T>(url: string, params?: any): Promise<T> {
    return this.retryRequest(() => this.client.get<ApiResponse<T>>(url, { params }));
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.retryRequest(() => this.client.post<ApiResponse<T>>(url, data));
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.retryRequest(() => this.client.put<ApiResponse<T>>(url, data));
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.retryRequest(() => this.client.patch<ApiResponse<T>>(url, data));
  }

  async delete<T>(url: string): Promise<T> {
    return this.retryRequest(() => this.client.delete<ApiResponse<T>>(url));
  }

  // File Upload
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data;
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export token manager for external use
export { TokenManager };

// Export default
export default api;
