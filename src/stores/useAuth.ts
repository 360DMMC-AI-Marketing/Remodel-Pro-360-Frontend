import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/api/auth";
import type { LoginFormValues, RegisterFormValues, ResetPasswordForm } from "@/schemas/auth";
import type { User } from "@/types/user";
import type { UserResponse } from "@/types/api";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (data: LoginFormValues) => Promise<UserResponse>;
  signup: (data: RegisterFormValues) => Promise<void>;
  verifyEmail: (token: string) => Promise<UserResponse>;
  // resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordForm) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updateProfile: (data: {
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
  }) => Promise<void>;
  uploadPaperwork: (licenses?: File[], insurances?: File[]) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data: LoginFormValues) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(data);
          console.log(response)
          set({
            user: response.user,
            token: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            role: response.user.role,
            isAuthenticated: true,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (data: RegisterFormValues) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          set({ user: response.user });
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.verifyEmail(token);
          set({
            user: response.user,
            token: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            role: response.user.role,
            isAuthenticated: true,
            isLoading: false,
          });
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // resendVerificationEmail: async () => {
      //   set({ isLoading: true });
      //   try {
      //     await authService.resendVerificationEmail();
      //     set({ isLoading: false });
      //   } catch (error) {
      //     set({ isLoading: false });
      //     throw error;
      //   }
      // },

      sendPasswordReset: async (email: string) => {
        set({ isLoading: true})
        try {
          await authService.sendPasswordResetEmail(email);
          set({ isLoading: false})
        } catch (error) {
          set({ isLoading: false})
          throw error
        }
      },

      resetPassword: async (data: ResetPasswordForm) => {
        set({ isLoading: true})
        try {
          await authService.resetPassword(data);
          set({ isLoading: false})
        } catch (error) {
          set({ isLoading: false})
          throw error;
        }
      },

      updateAvatar: async (file: File) => {
        set({ isLoading: true });
        try {
          const response = await authService.uploadAvatar(file);

          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  avatar: response.avatarUrl ?? undefined,
                }
              : state.user,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removeAvatar: async () => {
        set({ isLoading: true });
        try {
          await authService.removeAvatar();

          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  avatar: undefined,
                }
              : state.user,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.updateProfile(data);
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  ...response.user,
                }
              : response.user,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      uploadPaperwork: async (licenses?: File[], insurances?: File[]) => {
        set({ isLoading: true });
        try {
          const response = await authService.uploadPaperwork(
            licenses,
            insurances,
          );
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  ...response.user,
                }
              : response.user,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("auth-storage"); // clear localStorage
      },

      setUser: (user: User) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
);
