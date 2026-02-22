/**
 * Port for cash register state. Use cases check this before allowing product mutations.
 */
export interface IRegisterGate {
    isRegisterOpen(dbOrTx?: unknown): Promise<boolean>;
}
