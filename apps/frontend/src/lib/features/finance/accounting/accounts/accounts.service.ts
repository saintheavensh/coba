import { api } from "$lib/shared/core/api";

export class AccountsService {
    static async getAll() {
        const response = await api.get("/accounting/accounts");
        return response.data;
    }

    static async getTree() {
        const response = await api.get("/accounting/accounts/tree");
        return response.data;
    }

    static async getTypes() {
        const response = await api.get("/accounting/accounts/types");
        return response.data;
    }

    static async create(data: any) {
        const response = await api.post("/accounting/accounts", data);
        return response.data;
    }

    static async transfer(data: any) {
        const response = await api.post("/accounting/accounts/transfer", data);
        return response.data;
    }
}
