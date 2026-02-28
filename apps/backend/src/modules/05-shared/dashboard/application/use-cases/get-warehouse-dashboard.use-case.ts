import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";
import { DBContext } from "../../../../../shared/types/db-context";

export class GetWarehouseDashboardUseCase {
    constructor(private repository: IDashboardRepository) { }

    async execute(dbOrTx?: DBContext) {
        const stats = await this.repository.getWarehouseStats(dbOrTx);
        const lowStockProducts = await this.repository.getLowStockProducts(10, dbOrTx);
        const incomingOrders = await this.repository.getIncomingOrders(5, dbOrTx);

        return {
            stats: {
                totalProducts: stats.totalProducts,
                lowStockCount: stats.lowStock,
                pendingPurchasesCount: stats.pendingPurchases
            },
            lowStockProducts: (lowStockProducts || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                minStock: p.minStock
            })),
            incomingOrders: incomingOrders || []
        };
    }
}
