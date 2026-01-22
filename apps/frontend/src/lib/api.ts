import axios, { type AxiosError, type AxiosResponse } from "axios";
import { browser } from "$app/environment";
import type { ApiResponse } from "@repo/shared";

// Use relative /api by default so HTTPS frontend can safely proxy to HTTP backend without mixed-content issues.
// In production, override with VITE_API_BASE_URL if you expose the API separately.
export const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "/api";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true // Cookies are sent automatically
});

// Response Interceptor
api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        // If the backend returns HTTP 200 but explicitly says success: false (logical error)
        if (response.data && response.data.success === false) {
            return Promise.reject(new AppError(
                response.data.message || "Operation failed",
                response.data.errors,
                response.data.error_code
            ));
        }
        return response;
    },
    (error: AxiosError<ApiResponse>) => {
        if (browser && error.response?.status === 401) {
            // Check if we are already on login page to avoid loops
            if (window.location.pathname !== "/login") {
                localStorage.removeItem("user");
                // Redirect to login
                window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            }
        }

        // Extract error message from backend response if available
        const message = error.response?.data?.message || error.message || "Network Error";
        const details = error.response?.data?.errors || [];
        const code = error.response?.data?.error_code || String(error.response?.status || 500);

        return Promise.reject(new AppError(message, details, code));
    }
);

export class AppError extends Error {
    constructor(
        public override message: string,
        public details: any[] = [],
        public code: string = "UNKNOWN"
    ) {
        super(message);
        this.name = "AppError";
    }
}
