import {
    ServiceToolRepositoryAdapter,
    NotificationGatewayAdapter
} from "./infrastructure";
import {
    GetServiceToolsUseCase,
    GetServiceToolByIdUseCase,
    CreateServiceToolUseCase,
    UpdateServiceToolUseCase,
    UpdateToolConditionUseCase,
    DeleteServiceToolUseCase,
    CreateToolRequestUseCase,
    GetToolRequestsUseCase,
    UpdateToolRequestStatusUseCase
} from "./application";

// Adapters
const repository = new ServiceToolRepositoryAdapter();
const notificationGateway = new NotificationGatewayAdapter();

// Use Cases
const getServiceToolsUC = new GetServiceToolsUseCase(repository);
const getServiceToolByIdUC = new GetServiceToolByIdUseCase(repository);
const createServiceToolUC = new CreateServiceToolUseCase(repository);
const updateServiceToolUC = new UpdateServiceToolUseCase(repository);
const updateToolConditionUC = new UpdateToolConditionUseCase(repository);
const deleteServiceToolUC = new DeleteServiceToolUseCase(repository);

const createToolRequestUC = new CreateToolRequestUseCase(repository, notificationGateway);
const getToolRequestsUC = new GetToolRequestsUseCase(repository);
const updateToolRequestStatusUC = new UpdateToolRequestStatusUseCase(repository);

/**
 * ServiceToolsApplicationService — Facade for external and presentation layers.
 */
export class ServiceToolsApplicationService {
    async getAll() {
        return await getServiceToolsUC.execute();
    }

    async getByUserId(userId: string) {
        return await getServiceToolsUC.execute({ userId });
    }

    async getById(id: string) {
        return await getServiceToolByIdUC.execute(id);
    }

    async create(data: any) {
        return await createServiceToolUC.execute(data);
    }

    async update(id: string, data: any) {
        return await updateServiceToolUC.execute(id, data);
    }

    async updateCondition(id: string, condition: any) {
        return await updateToolConditionUC.execute(id, condition);
    }

    async delete(id: string) {
        return await deleteServiceToolUC.execute(id);
    }

    // Requests
    async createRequest(userId: string, userName: string, data: any) {
        return await createToolRequestUC.execute(userId, userName, data);
    }

    async getMyRequests(userId: string) {
        return await getToolRequestsUC.execute({ userId });
    }

    async getAllRequests() {
        return await getToolRequestsUC.execute();
    }

    async updateRequestStatus(id: string, status: "approved" | "rejected") {
        return await updateToolRequestStatusUC.execute(id, status);
    }
}

/** Singleton instance */
export const serviceToolsApplicationService = new ServiceToolsApplicationService();
