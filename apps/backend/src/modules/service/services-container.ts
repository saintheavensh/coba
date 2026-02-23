import { db } from "../../db";
import {
    ServiceRepositoryAdapter,
    AccountingGatewayAdapter,
    InventoryGatewayAdapter,
    NotificationGatewayAdapter,
    SettingsGatewayAdapter,
    UserGatewayAdapter
} from "./infrastructure";
import {
    GetServicesUseCase,
    GetServiceCountsUseCase,
    GetServiceByIdUseCase,
    GetTechnicianDashboardStatsUseCase,
    CreateServiceUseCase,
    UpdateServiceStatusUseCase,
    AssignTechnicianUseCase,
    UpdateServiceDetailsUseCase,
    PatchServiceUseCase,
    DeleteServiceUseCase
} from "./application";

// Adapters
const repository = new ServiceRepositoryAdapter();
const accountingGateway = new AccountingGatewayAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const notificationGateway = new NotificationGatewayAdapter();
const settingsGateway = new SettingsGatewayAdapter();
const userGateway = new UserGatewayAdapter();

// Use Cases
const getServicesUC = new GetServicesUseCase(repository);
const getServiceCountsUC = new GetServiceCountsUseCase(repository);
const getServiceByIdUC = new GetServiceByIdUseCase(repository);
const getTechnicianDashboardStatsUC = new GetTechnicianDashboardStatsUseCase(repository);
const createServiceUC = new CreateServiceUseCase(repository, accountingGateway, notificationGateway, db as any);
const updateServiceStatusUC = new UpdateServiceStatusUseCase(repository, accountingGateway, inventoryGateway, notificationGateway, db as any);
const assignTechnicianUC = new AssignTechnicianUseCase(repository, userGateway, notificationGateway, db as any);
const updateServiceDetailsUC = new UpdateServiceDetailsUseCase(repository, db as any);
const patchServiceUC = new PatchServiceUseCase(repository, settingsGateway);
const deleteServiceUC = new DeleteServiceUseCase(repository);

/**
 * ServiceApplicationService — Facade for external and presentation layers.
 */
export class ServiceApplicationService {
    async getAll(params: { status?: string; technicianId?: string }) {
        return await getServicesUC.execute(params);
    }

    async getCounts() {
        return await getServiceCountsUC.execute();
    }

    async getById(id: string) {
        return await getServiceByIdUC.execute(id);
    }

    async getTechnicianDashboardStats(userId: string) {
        return await getTechnicianDashboardStatsUC.execute(userId);
    }

    async createService(data: any, userId: string) {
        return await createServiceUC.execute(data, userId);
    }

    async updateStatus(id: string, data: any) {
        return await updateServiceStatusUC.execute(id, data);
    }

    async assignTechnician(id: string, technicianId: string, userId: string) {
        return await assignTechnicianUC.execute(id, technicianId, userId);
    }

    async updateDetails(id: string, data: any, userId: string) {
        return await updateServiceDetailsUC.execute(id, data, userId);
    }

    async patchService(id: string, data: any) {
        return await patchServiceUC.execute(id, data);
    }

    async delete(id: string) {
        return await deleteServiceUC.execute(id);
    }
}

/** Singleton instance */
export const serviceApplicationService = new ServiceApplicationService();
