/**
 * Port for password verification. Use cases depend on this, not on Bun.password.
 */

export interface IPasswordVerifier {
    verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
