import { api } from "../api";
import type { Service, ServiceStatus, ServiceCustomer, ServiceDevice, ApiResponse } from "@repo/shared";

/** Input for creating a service ticket */
export interface CreateServiceInput {
    customer: ServiceCustomer;
    device: ServiceDevice;
    complaint: string;
    technicianId?: string | null;
    status?: ServiceStatus;
    diagnosis?: {
        initial?: string;
        possibleCauses?: string;
        estimatedCost?: string;
        downPayment?: string;
    };
}

/** Input for updating service status */
interface UpdateStatusInput {
    status: ServiceStatus;
    notes?: string;
    actualCost?: number;
    userId: string;
}

export const ServiceService = {
    getAll: async (params?: Record<string, string>): Promise<Service[]> => {
        const query = new URLSearchParams(params).toString();
        const res = await api.get<ApiResponse<Service[]>>(`/service?${query}`);
        return res.data?.data ?? [];
    },
    create: async (data: CreateServiceInput): Promise<Service> => {
        const res = await api.post<ApiResponse<Service>>("/service", data);
        return res.data.data!;
    },
    getById: async (id: number | string): Promise<Service> => {
        const res = await api.get<ApiResponse<Service>>(`/service/${id}`);
        return res.data.data!;
    },
    updateStatus: async (id: number | string, data: UpdateStatusInput): Promise<Service> => {
        const res = await api.put<ApiResponse<Service>>(`/service/${id}/status`, data);
        return res.data.data!;
    },
    print: async (id: number | string): Promise<void> => {
        await api.post(`/service/${id}/print`);
    }
};
