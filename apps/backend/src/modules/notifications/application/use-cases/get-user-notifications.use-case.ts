import { DBContext } from "../../../../shared/types/db-context";
import { INotificationRepository, Notification } from "../../domain";

export class GetUserNotificationsUseCase {
    constructor(private readonly repository: INotificationRepository) { }

    async execute(userId: string, dbOrTx?: DBContext): Promise<Notification[]> {
        return await this.repository.findByUserId(userId, dbOrTx);
    }
}
