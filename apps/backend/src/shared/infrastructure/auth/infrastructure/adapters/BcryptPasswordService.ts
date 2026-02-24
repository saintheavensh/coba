import type { IPasswordService } from "../../domain";

export class BcryptPasswordService implements IPasswordService {
    async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await Bun.password.verify(plainPassword, hashedPassword);
    }
}
