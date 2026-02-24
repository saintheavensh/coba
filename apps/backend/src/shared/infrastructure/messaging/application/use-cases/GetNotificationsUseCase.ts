import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { INotificationRepository, Notification } from "../../domain";
import { Result } from "../../../../core/Result";

export interface GetNotificationsInput {
    userId: string;
}

@injectable()
export class GetNotificationsUseCase {
    constructor(
        @inject(TYPES.INotificationRepository) private notificationRepository: INotificationRepository
    ) { }

    async execute(input: GetNotificationsInput): Promise<Result<Notification[]>> {
        return await this.notificationRepository.findByUserId(input.userId);
    }
}
