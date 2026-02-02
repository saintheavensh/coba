import { UsersModel } from "../models/users.model";

export class UsersService {
    private model: UsersModel;

    constructor() {
        this.model = new UsersModel();
    }

    async findAll(role?: string, dbOrTx?: any) {
        return await this.model.findAll(role, dbOrTx);
    }

    async getById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }

    async create(data: any, dbOrTx?: any) {
        return await this.model.create(data, dbOrTx);
    }

    async update(id: string, data: any, dbOrTx?: any) {
        return await this.model.update(id, data, dbOrTx);
    }

    async delete(id: string, dbOrTx?: any) {
        return await this.model.delete(id, dbOrTx);
    }
}
