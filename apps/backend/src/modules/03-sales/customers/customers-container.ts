import { db } from "../../../shared/infrastructure/database/client";
import { CustomerRepositoryAdapter } from "./infrastructure";
import {
    GetCustomersUseCase,
    GetCustomerByIdUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    GetCustomerSalesUseCase,
    GetCustomerUnpaidSalesUseCase,
    ProcessCustomerPaymentUseCase
} from "./application";

// Infrastructure adapters
const repository = new CustomerRepositoryAdapter();

// Use cases
const getCustomersUC = new GetCustomersUseCase(repository);
const getCustomerByIdUC = new GetCustomerByIdUseCase(repository);
const createCustomerUC = new CreateCustomerUseCase(repository);
const updateCustomerUC = new UpdateCustomerUseCase(repository);
const deleteCustomerUC = new DeleteCustomerUseCase(repository);
const getCustomerSalesUC = new GetCustomerSalesUseCase(repository);
const getCustomerUnpaidSalesUC = new GetCustomerUnpaidSalesUseCase(repository);
const processCustomerPaymentUC = new ProcessCustomerPaymentUseCase(repository, db as any);

/**
 * CustomersService — facade for external and presentation layers.
 */
export class CustomersService {
    async getAll(query?: string, dbOrTx?: any) {
        return await getCustomersUC.execute(query, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        return await getCustomerByIdUC.execute(id, dbOrTx);
    }

    async create(data: any, dbOrTx?: any) {
        return await createCustomerUC.execute(data, dbOrTx);
    }

    async update(id: string, data: any, dbOrTx?: any) {
        return await updateCustomerUC.execute(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: any) {
        return await deleteCustomerUC.execute(id, dbOrTx);
    }

    async getSales(id: string, dbOrTx?: any) {
        return await getCustomerSalesUC.execute(id, dbOrTx);
    }

    async getUnpaidSales(id: string, dbOrTx?: any) {
        return await getCustomerUnpaidSalesUC.execute(id, dbOrTx);
    }

    async processPayment(dto: any) {
        return await processCustomerPaymentUC.execute(dto);
    }
}

/** Singleton service instance */
export const customersService = new CustomersService();
