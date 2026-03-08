
import { messagingFacade } from "../../../../shared/infrastructure/messaging";
import { usersService } from "../../../users/users-container";
import { INotificationGateway, IUserGateway } from "../../domain";

export class NotificationGatewayAdapter implements INotificationGateway {
    async notifyOwnersNewToolRequest(technicianName: string, toolName: string): Promise<void> {
        try {
            const owners = await usersService.findAll("owner");

            for (const owner of owners) {
                await messagingFacade.sendNotification({
                    userId: owner.id,
                    title: "Permintaan Alat Baru",
                    content: `Teknisi ${technicianName} meminta alat baru: ${toolName}`,
                    type: "service_tool_request",
                    channel: "internal"
                });
            }
        } catch (error) {
            console.error("Failed to send tool request notifications", error);
        }
    }
}

export class UserGatewayAdapter implements IUserGateway {
    async getOwners(_dbOrTx?: any): Promise<Array<{ id: string; name: string }>> {
        const owners = await usersService.findAll("owner");
        return owners.map((o: any) => ({ id: o.id, name: o.name }));
    }
}
