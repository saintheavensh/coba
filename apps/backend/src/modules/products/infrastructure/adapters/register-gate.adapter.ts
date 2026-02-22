/**
 * Adapter for cash register state. Implements IRegisterGate from products domain.
 */
import type { IRegisterGate } from "../../domain/register-gate.port";
import { CashRegisterService } from "../../../accounting/services/cash-register.service";

export class RegisterGateAdapter implements IRegisterGate {
    async isRegisterOpen(dbOrTx?: unknown): Promise<boolean> {
        return CashRegisterService.isRegisterOpen(dbOrTx);
    }
}
