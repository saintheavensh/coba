import { DBContext } from "../../../../../shared/types/db-context";
import { Customer, CustomerSale } from "../entities/customer.entity";

export interface ICustomerRepository {
    findAll(query?: string, dbOrTx?: DBContext): Promise<Customer[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Customer | null>;
    findByPhone(phone: string, dbOrTx?: DBContext): Promise<Customer | null>;
    create(data: any, dbOrTx?: DBContext): Promise<Customer>;
    update(id: string, data: any, dbOrTx?: DBContext): Promise<Customer>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
    findSales(memberId: string, dbOrTx?: DBContext): Promise<CustomerSale[]>;
    findUnpaidSales(memberId: string, dbOrTx?: DBContext): Promise<CustomerSale[]>;
}
