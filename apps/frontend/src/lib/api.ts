import axios from "axios";
import { browser } from "$app/environment";

export const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to add Token
api.interceptors.request.use((config: any) => {
    if (browser) {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptor for Errors (401 -> Logout)
api.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401 && browser) {
            localStorage.removeItem("token");
            // Force redirect to login if unauthorized
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
