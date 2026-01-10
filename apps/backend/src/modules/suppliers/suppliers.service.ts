import { SuppliersRepository } from "./suppliers.repository";
import { generateId, ID_PREFIX } from "../../lib/utils";

export class SuppliersService {
    private repo: SuppliersRepository;

    constructor() {
        this.repo = new SuppliersRepository();
    }

    async getAll() {
        return await this.repo.findAll();
    }

    async create(data: { name: string; contact?: string; phone?: string; address?: string; image?: string }) {
        const id = generateId(ID_PREFIX.SUPPLIER);
        return await this.repo.create({
            id,
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image
        });
    }

    async update(id: string, data: { name?: string; contact?: string; phone?: string; address?: string; image?: string }) {
        return await this.repo.update(id, {
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image
        });
    }

    async delete(id: string) {
        return await this.repo.delete(id);
    }
}

