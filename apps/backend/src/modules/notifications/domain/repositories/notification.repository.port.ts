import { DBContext } from "../../../../shared/types/db-context";
import { Notification } from "../entities/notification.entity";

export interface INotificationRepository {
    findByUserId(userId: string, dbOrTx?: DBContext): Promise<Notification[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Notification | null>;
    markAsRead(id: string, dbOrTx?: DBContext): Promise<void>;
    create(data: Partial<Notification>, dbOrTx?: DBContext): Promise<void>;
}
