import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          newToken,
          newRefreshToken
        );

        // Update localStorage with new refresh token
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 400) {
      const message = (error.response.data as { message?: string })?.message;
      if (message) {
        toast.error(message);
      }
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    if (error.response?.status === 500) {
      toast.error('An unexpected error occurred. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;