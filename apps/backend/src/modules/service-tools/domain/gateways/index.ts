import { DBContext } from "../../../../shared/types/db-context";

export interface INotificationGateway {
    notifyOwnersNewToolRequest(technicianName: string, toolName: string): Promise<void>;
}

export interface IUserGateway {
    getOwners(dbOrTx?: DBContext): Promise<Array<{ id: string; name: string }>>;
}
