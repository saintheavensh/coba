import { DBContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, Customer } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetCustomersUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(query?: string, dbOrTx?: DBContext): Promise<Customer[]> {
        return await this.repository.findAll(query, dbOrTx);
    }
}

export class GetCustomerByIdUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(id: string, dbOrTx?: DBContext): Promise<Customer> {
        const customer = await this.repository.findById(id, dbOrTx);
        if (!customer) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        return customer;
    }
}
