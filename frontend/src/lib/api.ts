import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import i18n from "@/lib/i18n";
import { getApiUrl } from "./config";
import type { ApiResponse, ApiError } from "@/types/api";

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      toast.error(i18n.t("errors.NETWORK_ERROR"));
      return Promise.reject(error);
    }

    const errorCode = error.response.data?.error?.code;

    if (errorCode === "SESSION_EXPIRED") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(error);
    }

    if (errorCode === "UNAUTHORIZED") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(error);
    }

    if (errorCode === "TOKEN_EXPIRED" && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${getApiUrl()}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export type { ApiResponse, ApiError };
