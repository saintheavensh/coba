import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";
import { DBContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, Customer, CreateCustomerData, UpdateCustomerData } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(data: CreateCustomerData, dbOrTx?: DBContext): Promise<Customer> {
        const existing = await this.repository.findByPhone(data.phone, dbOrTx);
        if (existing) {
            throw new HTTPException(400, { message: "Phone number already registered" });
        }

        const id = generateId(ID_PREFIX.CUSTOMER);
        return await this.repository.create({
            ...data,
            id,
            points: 0,
            debt: 0
        }, dbOrTx);
    }
}

export class UpdateCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(id: string, data: UpdateCustomerData, dbOrTx?: DBContext): Promise<Customer> {
        const existing = await this.repository.findById(id, dbOrTx);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }

        if (data.phone && data.phone !== existing.phone) {
            const phoneCheck = await this.repository.findByPhone(data.phone, dbOrTx);
            if (phoneCheck) {
                throw new HTTPException(400, { message: "Phone number already registered" });
            }
        }

        return await this.repository.update(id, data, dbOrTx);
    }
}
