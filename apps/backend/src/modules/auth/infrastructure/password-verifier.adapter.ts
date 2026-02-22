import type { IPasswordVerifier } from "../domain";

export class BunPasswordVerifierAdapter implements IPasswordVerifier {
    async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await Bun.password.verify(plainPassword, hashedPassword);
    }
}
