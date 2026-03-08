export interface RecentActivityDTO {
    id: string;
    user: string | null;
    action: string;
    description: string | null;
    time: Date;
    entityType: string | null;
}
