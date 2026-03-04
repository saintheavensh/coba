import { DBContext } from "../../../../shared/types/db-context";
import { StockMovementEntity } from "./stock-movement.entity";

export interface IStockMovementRepository {
    insert(movement: Omit<StockMovementEntity, "id" | "createdAt">, dbOrTx?: DBContext): Promise<StockMovementEntity>;
    getAggregatedStock(productId: string, dbOrTx?: DBContext): Promise<number>;
}
