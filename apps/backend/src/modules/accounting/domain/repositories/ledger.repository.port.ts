import { DBContext } from "../../../../shared/types/db-context";
import { Account, JournalEntry, JournalLine } from "../entities/ledger.entity";
import { AccountTypeDTO } from "../../../../shared/dtos/repositories/accounting";

export interface IAccountRepository {
    findAll(filters: { typeId?: string }, dbOrTx?: DBContext): Promise<Account[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<Account | null>;
    findByCode(code: string, dbOrTx?: DBContext): Promise<Account | null>;
    findTypes(dbOrTx?: DBContext): Promise<AccountTypeDTO[]>;
    findTypeById(id: string, dbOrTx?: DBContext): Promise<AccountTypeDTO | null>;
    create(data: Partial<Account>, dbOrTx?: DBContext): Promise<{ id: string }>;
    update(id: string, data: Partial<Account>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
}

export interface IJournalRepository {
    findAll(filters: any, dbOrTx?: DBContext): Promise<JournalEntry[]>;
    findById(id: string, dbOrTx?: DBContext): Promise<JournalEntry | null>;
    countToday(prefix: string, dbOrTx?: DBContext): Promise<number>;
    create(data: Partial<JournalEntry>, dbOrTx?: DBContext): Promise<void>;
    createLine(data: Partial<JournalLine>, dbOrTx?: DBContext): Promise<void>;
    update(id: string, data: Partial<JournalEntry>, dbOrTx?: DBContext): Promise<void>;
    delete(id: string, dbOrTx?: DBContext): Promise<void>;
    deleteByReference(type: string, id: string, dbOrTx?: DBContext): Promise<void>;
}
