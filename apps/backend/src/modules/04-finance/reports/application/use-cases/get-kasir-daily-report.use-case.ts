import { DBContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters } from "../../domain";
import { gte, lte, and } from "drizzle-orm";
import { sales } from "../../../../../shared/infrastructure/database/schema";

export class GetKasirDailyReportUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(filters: ReportFilters = {}, dbOrTx?: DBContext) {
        let conditions = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.startDate) {
            conditions.push(gte(sales.createdAt, new Date(filters.startDate)));
        } else {
            conditions.push(gte(sales.createdAt, today));
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(sales.createdAt, end));
        }

        const salesData = await this.repository.getSalesData(conditions, dbOrTx);
        const paymentsData = await this.repository.getSalesPayments(conditions, dbOrTx);

        const summary = {
            totalSales: 0,
            totalDiscount: 0,
            transactionCount: salesData.length,
            paymentBreakdown: {} as Record<string, number>,
            netRevenue: 0
        };

        for (const sale of salesData) {
            summary.totalSales += sale.totalAmount;
            summary.totalDiscount += sale.discountAmount || 0;
        }

        for (const p of paymentsData) {
            const method = p.method || 'Unknown';
            summary.paymentBreakdown[method] = (summary.paymentBreakdown[method] || 0) + p.amount;
        }

        summary.netRevenue = summary.totalSales - summary.totalDiscount;

        return summary;
    }
}
