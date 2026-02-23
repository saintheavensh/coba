export type NotificationType =
    | "low_stock"
    | "service_update"
    | "new_assignment"
    | "sale_complete"
    | "purchase_complete"
    | "po_action_required"
    | "po_discrepancy"
    | "spend_alert";

export interface Notification {
    id: string; // UUID in schema
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    isRead: boolean;
    createdAt: Date;
}
