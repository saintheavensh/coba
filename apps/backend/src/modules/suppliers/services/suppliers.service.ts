import { SuppliersModel } from "../models/suppliers.model";
import { generateId, ID_PREFIX } from "../../../lib/utils";
import { z } from "zod";

export class SuppliersService {
    private model: SuppliersModel;

    constructor() {
        this.model = new SuppliersModel();
    }

    async getAll() {
        return await this.model.findAll();
    }

    async create(data: { name: string; contact?: string; phone?: string; address?: string; image?: string }) {
        const id = generateId(ID_PREFIX.SUPPLIER);
        return await this.model.create({
            id,
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image
        });
    }

    async update(id: string, data: { name?: string; contact?: string; phone?: string; address?: string; image?: string }) {
        return await this.model.update(id, {
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image
        });
    }

    async delete(id: string) {
        return await this.model.delete(id);
    }
}

