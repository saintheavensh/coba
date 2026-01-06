import { api } from "../api";
import type { LoginRequest, LoginResponse } from "@repo/shared";

export const AuthService = {
    login: async (data: LoginRequest) => {
        const res = await api.post<LoginResponse>("/auth/login", data);
        if (res.data.token) {
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        return res.data;
    },
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
    getUser: () => {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    }
};
