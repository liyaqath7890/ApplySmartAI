import axiosInstance from '../axios';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'candidate' | 'recruiter';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  token: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'candidate' | 'recruiter' | 'admin';
    isEmailVerified: boolean;
    candidateProfile?: any;
    recruiterProfile?: any;
  };
}

const authService = {
  // Register a new user
  async register(data: RegisterData) {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login user
  async login(data: LoginData) {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Logout user
  async logout() {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  // Get current user
  async getMe() {
    const response = await axiosInstance.get<AuthResponse>('/auth/me');
    return response.data;
  },

  // Refresh token
  async refreshToken(data: RefreshTokenData) {
    const response = await axiosInstance.post<AuthResponse>('/auth/refresh', data);
    return response.data;
  },

  // Update password
  async updatePassword(data: UpdatePasswordData) {
    const response = await axiosInstance.put('/auth/password', data);
    return response.data;
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordData) {
    const response = await axiosInstance.post('/auth/forgot-password', data);
    return response.data;
  },

  // Reset password
  async resetPassword(data: ResetPasswordData) {
    const response = await axiosInstance.put(
      `/auth/reset-password/${data.token}`,
      { password: data.password }
    );
    return response.data;
  },

  // Verify email
  async verifyEmail(token: string) {
    const response = await axiosInstance.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Setup 2FA
  async setup2FA() {
    const response = await axiosInstance.post('/auth/2fa/setup');
    return response.data;
  },

  // Enable 2FA
  async enable2FA(token: string) {
    const response = await axiosInstance.post('/auth/2fa/enable', { token });
    return response.data;
  },

  // Disable 2FA
  async disable2FA(token: string) {
    const response = await axiosInstance.post('/auth/2fa/disable', { token });
    return response.data;
  },
};

export default authService;