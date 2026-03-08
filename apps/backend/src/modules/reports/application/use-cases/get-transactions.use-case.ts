import { DBContext } from "../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, TransactionReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { sales } from "../../../../db/schema";
import { SaleReportDTO } from "../../../../shared/dtos/repositories/reports";

export class GetTransactionsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(filters: ReportFilters = {}, dbOrTx?: DBContext): Promise<TransactionReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(sales.createdAt, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        const salesData = await this.repository.getTransactions(conditions, dbOrTx);

        return salesData.map((sale: SaleReportDTO) => {
            let hpp = 0;
            let itemCount = 0;

            for (const item of (sale.items || [])) {
                itemCount += item.qty;
                const buyPrice = item.batch?.buyPrice || 0;
                hpp += buyPrice * item.qty;
            }

            return {
                id: sale.id,
                date: sale.createdAt!,
                nota: sale.id,
                customerName: sale.customerName,
                items: itemCount,
                total: sale.totalAmount,
                hpp,
                profit: sale.totalAmount - hpp
            };
        });
    }
}
