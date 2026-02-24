import { inject, injectable } from "inversify";
import { Result } from "../../../core/Result";
import { DashboardStatsDTO, TimeRangeDTO } from "../dtos/dashboard.dto";
import { TYPES } from "../../../../types";

@injectable()
export class DashboardAggregator {
    constructor(
        // Sales Facade
        @inject(TYPES.SalesFacade) private salesFacade: any,
        // Inventory Facade
        @inject(TYPES.InventoryFacade) private inventoryFacade: any,
        // Products Facade
        @inject(TYPES.ProductsFacade) private productsFacade: any,
        // Customers Facade
        @inject(TYPES.CustomersFacade) private customersFacade: any,
        // StoreDevices Facade
        @inject(TYPES.StoreDeviceFacade) private deviceFacade: any
    ) { }

    async getDashboardStats(timeRange?: TimeRangeDTO): Promise<Result<DashboardStatsDTO>> {
        try {
            // Parallel calls to all modules for performance
            const [
                todaySalesResult,
                weeklySalesResult,
                inventoryResult,
                productsResult,
                customersResult,
                devicesResult
            ] = await Promise.all([
                this.salesFacade.getTodaySales(),
                this.salesFacade.getWeeklySales(),
                this.inventoryFacade.getLowStock(),
                this.productsFacade.getTotalCount(),
                this.customersFacade.getNewCustomersToday(),
                this.deviceFacade.getStatus ? this.deviceFacade.getStatus("all") : Promise.resolve(Result.ok({ online: 0, offline: 0, total: 0 })) // Fallback for now
            ]);

            // Check for failures
            if (todaySalesResult.isFailure) {
                return Result.fail(`Failed to get sales data: ${todaySalesResult.errorValue()}`);
            }

            // Aggregate all data
            const stats: DashboardStatsDTO = {
                todaySales: {
                    count: todaySalesResult.getValue().count,
                    revenue: todaySalesResult.getValue().revenue,
                    target: 10000000, // This could come from settings module
                    percentage: 75 // Calculate based on target
                },
                weeklySales: weeklySalesResult.isSuccess ? weeklySalesResult.getValue() : { days: [], values: [] },
                lowStockItems: inventoryResult.isSuccess ? inventoryResult.getValue() : [],
                outOfStockItems: 0, // Calculate from inventory
                totalProducts: productsResult.isSuccess ? productsResult.getValue() : 0,
                todayRevenue: todaySalesResult.getValue().revenue,
                weeklyRevenue: 0, // Calculate
                monthlyRevenue: 0, // Calculate
                newCustomersToday: customersResult.isSuccess ? customersResult.getValue() : 0,
                activeCustomers: 0, // From customers module
                pendingOrders: 0, // From sales module
                openTickets: 0, // From support module if exists
                deviceStatus: devicesResult.isSuccess ? devicesResult.getValue() : { online: 0, offline: 0, total: 0 }
            };

            return Result.ok(stats);
        } catch (error: any) {
            return Result.fail(`Dashboard aggregation failed: ${error.message}`);
        }
    }

    async getSalesChart(timeRange: TimeRangeDTO): Promise<Result<any>> {
        // Get sales data grouped by hour/day/month
        return this.salesFacade.getSalesChart(timeRange);
    }

    async getInventoryAlerts(): Promise<Result<any>> {
        // Get inventory alerts (low stock, expiring, etc.)
        return this.inventoryFacade.getAlerts ? this.inventoryFacade.getAlerts() : this.inventoryFacade.getLowStock();
    }
}
