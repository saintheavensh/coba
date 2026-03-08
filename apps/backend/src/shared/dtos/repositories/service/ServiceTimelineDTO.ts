export interface ServiceTimelineRowDTO {
    id: string;
    action: string;
    description: string | null;
    entityId: string;
    entityType: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: Date;
    userName: string | null;
}
