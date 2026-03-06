import api from '@/api/interceptor';
import type { RegisterFormValues, LoginFormValues, ResetPasswordForm } from '@/schemas/auth';

export const authService = {
  register: async (data: RegisterFormValues) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginFormValues) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },
  
  sendPasswordResetEmail: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordForm) => {
    const response = await api.post('/auth/reset-password', payload)
    return response.data;
  }

  // resendVerificationEmail: async () => {
  //   const response = await api.post('/auth/resend-verification-email');
  //   return response.data;
  // }
  
};