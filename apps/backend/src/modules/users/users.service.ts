// Users Service
import { UsersRepository } from "./users.repository";

export class UsersService {
    private repo: UsersRepository;

    constructor() {
        this.repo = new UsersRepository();
    }

    async findAll(role?: string) {
        return await this.repo.findAll(role);
    }
}
