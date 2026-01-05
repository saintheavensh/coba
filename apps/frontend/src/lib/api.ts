import { toast } from "svelte-sonner";

const API_URL = "http://localhost:4000";

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: any;
    token?: string;
};

export async function api(endpoint: string, options: RequestOptions = {}) {
    const { method = "GET", headers = {}, body, token } = options;

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (token) {
        // @ts-ignore
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
        const response = await fetch(url, config);

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }

        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error: any) {
        console.error("API Error:", error);
        toast.error(error.message || "Gagal menghubungi server");
        throw error;
    }
}
