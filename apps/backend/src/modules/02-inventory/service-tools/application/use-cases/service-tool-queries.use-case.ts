import { DBContext } from "../../../../../shared/types/db-context";
import { IServiceToolRepository, ServiceTool, ServiceToolRequest } from "../../domain";

export class GetServiceToolsUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(params: { userId?: string } = {}, dbOrTx?: DBContext): Promise<ServiceTool[]> {
        if (params.userId) {
            return await this.repository.findByUserId(params.userId, dbOrTx);
        }
        return await this.repository.findAll(dbOrTx);
    }
}

export class GetServiceToolByIdUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<ServiceTool | null> {
        return await this.repository.findById(id, dbOrTx);
    }
}

export class GetToolRequestsUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(params: { userId?: string } = {}, dbOrTx?: DBContext): Promise<ServiceToolRequest[]> {
        if (params.userId) {
            return await this.repository.findRequestsByUserId(params.userId, dbOrTx);
        }
        return await this.repository.findAllRequests(dbOrTx);
    }
}
