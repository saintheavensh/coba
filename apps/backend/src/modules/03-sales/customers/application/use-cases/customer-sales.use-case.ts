import { DBContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, CustomerSale } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class DeleteCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<void> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        await this.repository.delete(id, dbOrTx);
    }
}

export class GetCustomerSalesUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<CustomerSale[]> {
        return await this.repository.findSales(id, dbOrTx);
    }
}

export class GetCustomerUnpaidSalesUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<CustomerSale[]> {
        return await this.repository.findUnpaidSales(id, dbOrTx);
    }
}
