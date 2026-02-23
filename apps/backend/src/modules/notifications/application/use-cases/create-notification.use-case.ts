import { DBContext } from "../../../../shared/types/db-context";
import { INotificationRepository, Notification } from "../../domain";

export class CreateNotificationUseCase {
    constructor(private readonly repository: INotificationRepository) { }

    async execute(data: Partial<Notification>, dbOrTx?: DBContext): Promise<void> {
        await this.repository.create({
            ...data,
            isRead: false,
            createdAt: data.createdAt || new Date(),
        }, dbOrTx);
    }
}
