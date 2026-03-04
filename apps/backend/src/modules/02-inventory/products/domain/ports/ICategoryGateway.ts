import { DBContext } from "../../../../../shared/types/db-context";

export interface ICategoryGateway {
    categoryExists(categoryId: string, dbOrTx?: DBContext): Promise<boolean>;
}
