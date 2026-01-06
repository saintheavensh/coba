import { SuppliersRepository } from "./suppliers.repository";

export class SuppliersService {
    private repo: SuppliersRepository;

    constructor() {
        this.repo = new SuppliersRepository();
    }

    async getAll() {
        return await this.repo.findAll();
    }

    async create(data: { name: string; contact?: string; phone?: string; address?: string; image?: string; brands?: any[] }) {
        const id = "SUP-" + Date.now().toString().slice(-6);
        return await this.repo.create({
            id,
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image,
            brands: data.brands
        });
    }

    async update(id: string, data: { name: string; contact?: string; phone?: string; address?: string; image?: string; brands?: any[] }) {
        // Validation logic can go here (e.g. check if exists)
        return await this.repo.update(id, {
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            address: data.address,
            image: data.image,
            brands: data.brands
        });
    }

    async delete(id: string) {
        // Logic check: Is supplier used in batches?
        // For now proceed
        return await this.repo.delete(id);
    }
}
