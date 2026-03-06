import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/api/auth";
import type { LoginFormValues, RegisterFormValues, ResetPasswordForm } from "@/schemas/auth";
import type { User } from "@/types/user";
import type { UserResponse } from "@/types/api";

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (data: LoginFormValues) => Promise<UserResponse>;
  signup: (data: RegisterFormValues) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  // resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordForm) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data: LoginFormValues) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            token: response.token,
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
            token: response.token,
            role: response.user.role,
            isAuthenticated: true,
            isLoading: false,
          });
          set({ isLoading: false });
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

      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false });
        localStorage.removeItem("auth-storage"); // clear localStorage
      },

      setUser: (user: User) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
);
