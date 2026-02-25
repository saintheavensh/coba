import { api } from "$lib/shared/core/api";

export class AccountingService {
    static async getDashboard() {
        const response = await api.get("/accounting/dashboard");
        return response.data.data;
    }
}
