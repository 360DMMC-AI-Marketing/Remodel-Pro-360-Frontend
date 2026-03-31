import axios from "axios";

type PersistedAuthState = {
  state?: {
    token?: string | null;
    refreshToken?: string | null;
  };
};

type RetryableRequestConfig = {
  _retry?: boolean;
  url?: string;
  headers?: Record<string, string>;
};

const AUTH_STORAGE_KEY = "auth-storage";

const getAuthStorage = (): PersistedAuthState | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAuthState;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const updateAuthTokens = (accessToken: string, refreshToken: string): void => {
  const current = getAuthStorage();
  if (!current?.state) {
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...current,
      state: {
        ...current.state,
        token: accessToken,
        refreshToken,
      },
    }),
  );
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const authStorage = getAuthStorage();
      const refreshToken = authStorage?.state?.refreshToken;

      if (!refreshToken) {
        return null;
      }

      const response = await axios.post(`${API_BASE}/api/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = response.data?.tokens?.accessToken as string | undefined;
      const newRefreshToken = response.data?.tokens?.refreshToken as string | undefined;

      if (!newAccessToken || !newRefreshToken) {
        return null;
      }

      updateAuthTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

api.interceptors.request.use(
  (config) => {
    const authStorage = getAuthStorage();
    const token = authStorage?.state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const url = originalRequest?.url ?? "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${newAccessToken}`,
          };
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.href = "/login";
        return Promise.reject(error);
      }

      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
