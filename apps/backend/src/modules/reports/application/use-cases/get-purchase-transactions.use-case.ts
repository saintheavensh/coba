import { DBContext } from "../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, PurchaseReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { purchases } from "../../../../db/schema";

export class GetPurchaseTransactionsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(filters: ReportFilters = {}, dbOrTx?: DBContext): Promise<PurchaseReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(purchases.date, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(purchases.date, end));
        }

        const purchasesData = await this.repository.getPurchases(conditions, dbOrTx);

        return purchasesData.map((purchase: any) => {
            let itemCount = 0;
            for (const item of (purchase.items || [])) {
                itemCount += item.qtyReceived;
            }

            return {
                id: purchase.id,
                date: purchase.date!,
                supplierId: purchase.supplierId,
                supplierName: purchase.supplier?.name || null,
                items: itemCount,
                totalAmount: purchase.totalAmount,
                notes: purchase.notes || null
            };
        });
    }
}
