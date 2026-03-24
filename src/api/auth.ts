import api from '@/api/interceptor';
import type { RegisterFormValues, LoginFormValues, ResetPasswordForm } from '@/schemas/auth';
import type { User } from '@/types/user';

interface AvatarUploadResponse {
  message: string;
  avatarUrl: string | null;
  user: User;
}

interface PaperworkUploadResponse {
  message: string;
  user: User;
}

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contractor?: {
    companyName?: string;
    bio?: string;
    experienceYears?: number;
    specialties?: string[];
    serviceArea?: { type: "Polygon"; coordinates: number[][][] } | null;
  };
}

interface UpdateProfileResponse {
  message: string;
  user: User;
}

interface RefreshTokenResponse {
  message: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export const authService = {
  register: async (data: RegisterFormValues) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginFormValues) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data as RefreshTokenResponse;
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
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  removeAvatar: async (): Promise<AvatarUploadResponse> => {
    const response = await api.delete('/auth/avatar');
    return response.data;
  },

  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<UpdateProfileResponse> => {
    const response = await api.patch('/auth/update-profile', payload);
    return response.data as UpdateProfileResponse;
  },

  uploadPaperwork: async (
    licenses?: File[],
    insurances?: File[],
  ): Promise<PaperworkUploadResponse> => {
    const formData = new FormData();

    if (licenses && licenses.length > 0) {
      for (const file of licenses) {
        formData.append('licenses', file);
      }
    }

    if (insurances && insurances.length > 0) {
      for (const file of insurances) {
        formData.append('insurances', file);
      }
    }

    const response = await api.patch('/auth/paperwork', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data as PaperworkUploadResponse;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  getContractors: async () => {
    const response = await api.get('/auth/contractors');
    return response.data.contractors as User[];
  },

  // resendVerificationEmail: async () => {
  //   const response = await api.post('/auth/resend-verification-email');
  //   return response.data;
  // }
  
};