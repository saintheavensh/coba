import { DBContext } from "../../../../shared/types/db-context";
import { INotificationRepository } from "../../domain";

export class MarkNotificationAsReadUseCase {
    constructor(private readonly repository: INotificationRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        const notification = await this.repository.findById(id, dbOrTx);
        if (!notification) {
            throw new Error(`Notification with ID ${id} not found`);
        }

        await this.repository.markAsRead(id, dbOrTx);
    }
}
