/**
 * Adapter for cash register state. Implements IRegisterGate from products domain.
 */
import type { IRegisterGate } from "../../domain/register-gate.port";
import { accountingService } from "../../../accounting/accounting-container";

export class RegisterGateAdapter implements IRegisterGate {
    async isRegisterOpen(dbOrTx?: unknown): Promise<boolean> {
        return await accountingService.isRegisterOpen(dbOrTx as any);
    }
}
