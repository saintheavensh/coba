/**
 * Port for cash register state. Use cases check this before allowing inventory mutations (e.g. for Kasir role).
 */
export interface IRegisterGate {
    isRegisterOpen(dbOrTx?: unknown): Promise<boolean>;
}
