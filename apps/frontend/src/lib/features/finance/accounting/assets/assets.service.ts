import { api } from "$lib/shared/core/api";

export class AssetsService {
    static async getAll() {
        const response = await api.get("/accounting/assets");
        return response.data;
    }

    static async create(data: any) {
        const response = await api.post("/accounting/assets", data);
        return response.data;
    }

    static async update(id: string, data: any) {
        const response = await api.patch(`/accounting/assets/${id}`, data);
        return response.data;
    }

    static async processDepreciation(period: string) {
        const response = await api.post(
            "/accounting/assets/depreciation/process-all",
            { period }
        );
        return response.data;
    }
}
