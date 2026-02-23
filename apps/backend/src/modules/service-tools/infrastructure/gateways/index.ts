import { DBContext } from "../../../../shared/types/db-context";
import { NotificationsService } from "../../../notifications/services/notifications.service";
import { usersService } from "../../../users/users-container";
import { INotificationGateway, IUserGateway } from "../../domain";

export class NotificationGatewayAdapter implements INotificationGateway {
    private readonly notificationService = new NotificationsService();

    async notifyOwnersNewToolRequest(technicianName: string, toolName: string): Promise<void> {
        try {
            const owners = await usersService.findAll("owner");

            for (const owner of owners) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: "Permintaan Alat Baru",
                    message: `Teknisi ${technicianName} meminta alat baru: ${toolName}`,
                    type: "service_tool_request",
                });
            }
        } catch (error) {
            console.error("Failed to send tool request notifications", error);
        }
    }
}

export class UserGatewayAdapter implements IUserGateway {
    async getOwners(dbOrTx?: DBContext): Promise<Array<{ id: string; name: string }>> {
        const owners = await usersService.findAll("owner");
        return owners.map((o: any) => ({ id: o.id, name: o.name }));
    }
}
