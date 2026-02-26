import { DBContext } from "../../../../shared/types/db-context";
import {
    ISaleRepository,
    IInventoryGateway,
    IAccountingGateway,
    IMemberGateway,
    ISettingsGateway,
    IApprovalGateway,
    CreateSaleInput,
    PaymentMethodType,
    PaymentStatus
} from "../../domain";
import { HTTPException } from "hono/http-exception";
import { multiplyMoney, sumMoney, computeNetAmount } from "../../../../shared/utils/money";

export class CreateSaleUseCase {
    constructor(
        private readonly repository: ISaleRepository,
        private readonly inventoryGateway: IInventoryGateway,
        private readonly accountingGateway: IAccountingGateway,
        private readonly memberGateway: IMemberGateway,
        private readonly settingsGateway: ISettingsGateway,
        private readonly approvalGateway: IApprovalGateway,
        private readonly db: { transaction: (fn: (tx: DBContext) => Promise<any>) => Promise<any> }
    ) { }

    async execute(data: CreateSaleInput): Promise<{ message: string; id: string; change: number }> {
        const saleId = "SAL-" + Date.now().toString();
        const subtotal = data.items.reduce((sum, item) => sum + multiplyMoney(item.price, item.qty), 0);
        const discountAmount = data.discountAmount || 0;
        const finalAmount = computeNetAmount(subtotal, 0, discountAmount);

        // 0. Approval Check (Discounts)
        if (discountAmount > 0) {
            const discountPercent = (discountAmount / subtotal) * 100;
            const needsApproval = await this.approvalGateway.needsApproval('DISCOUNT', discountPercent, { isPercent: true });

            if (needsApproval) {
                if (!data.approvalId) {
                    throw new HTTPException(400, {
                        message: "Approval required for this discount level.",
                        // @ts-ignore
                        extra: { type: 'APPROVAL_REQUIRED', approvalType: 'DISCOUNT', amount: discountPercent }
                    });
                }
                const isApproved = await this.approvalGateway.isApproved(data.approvalId, 'sale');
                if (!isApproved) {
                    throw new HTTPException(400, { message: "Invalid or unapproved approval ID." });
                }
            }
        }

        // 1. Validate Payments
        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid < finalAmount) {
            throw new HTTPException(400, { message: `Insufficient payment. Total: ${finalAmount}, Paid: ${totalPaid}` });
        }

        // Determine Payment Status & Method String
        let paymentMethodStr: PaymentMethodType = "mixed";
        if (data.payments.length === 1) {
            const m = data.payments[0].method.toLowerCase();
            if (m.includes("cash") || m.includes("tunai")) paymentMethodStr = "cash";
            else if (m.includes("transfer")) paymentMethodStr = "transfer";
            else if (m.includes("qris")) paymentMethodStr = "qris";
            else paymentMethodStr = "mixed";
        }

        const nonTempoAmount = data.payments
            .filter(p => !p.method.toLowerCase().includes("tempo") && p.methodId !== "PM-TEMPO")
            .reduce((sum, p) => sum + p.amount, 0);

        let paymentStatus: PaymentStatus = "paid";
        if (nonTempoAmount >= finalAmount) {
            paymentStatus = "paid";
        } else if (nonTempoAmount > 0) {
            paymentStatus = "partial";
        } else {
            paymentStatus = "unpaid";
        }

        const runInTransaction = async (tx: DBContext) => {
            // 0. Pre-check: Ensure Register is Open
            const isRegisterOpen = await this.accountingGateway.isRegisterOpen(tx);
            if (!isRegisterOpen) {
                throw new HTTPException(400, { message: "Cash Register is closed. Please open a session first." });
            }

            // Handle Tempo (Debt)
            const tempoPayment = data.payments.find((p: any) => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"));
            if (tempoPayment) {
                if (!data.memberId) {
                    throw new HTTPException(400, { message: "Customer memberId is required for Tempo payments." });
                }
                const member = await this.memberGateway.findById(data.memberId, tx);
                if (!member) {
                    throw new HTTPException(404, { message: "Customer not found." });
                }

                // Credit Limit Check
                const currentDebt = member.debt || 0;
                const creditLimit = member.creditLimit || 0;
                if (creditLimit > 0 && (currentDebt + tempoPayment.amount > creditLimit)) {
                    throw new HTTPException(400, { message: `Credit limit exceeded. Limit: ${creditLimit}, Current Debt: ${currentDebt}, New: ${tempoPayment.amount}` });
                }

                // Increase Debt
                await this.memberGateway.updateDebt(data.memberId, tempoPayment.amount, tx);
            }

            // 1. Create Sale Header
            await this.repository.create({
                id: saleId,
                memberId: data.memberId,
                customerName: data.customerName,
                paymentMethod: paymentMethodStr,
                paymentStatus: paymentStatus,
                userId: data.userId,
                totalAmount: subtotal,
                discountAmount: data.discountAmount || 0,
                notes: data.notes
            }, tx);

            // 2. Insert Payments
            for (const p of data.payments) {
                await this.repository.createPayment({
                    saleId: saleId,
                    method: p.method,
                    methodId: p.methodId,
                    variantName: p.variantName,
                    variantId: p.variantId,
                    amount: p.amount,
                    reference: p.reference
                }, tx);
            }

            // 3. Deduct stock via Inventory
            const { allocations, cogsAmount } = await this.inventoryGateway.deductStockFIFO({
                saleId,
                items: data.items.map((i) => ({
                    productId: i.productId,
                    variant: i.variant || "",
                    quantity: i.qty,
                    unitPrice: i.price
                }))
            }, tx);

            // 4. Record Allocations as Sale Items
            const priceByItem = new Map<string, number>();
            for (const i of data.items) {
                priceByItem.set(`${i.productId}|${i.variant}`, i.price);
            }
            for (const a of allocations) {
                const unitPrice = priceByItem.get(`${a.productId}|${a.variantName}`) ?? 0;
                await this.repository.createItem({
                    saleId,
                    productId: a.productId,
                    batchId: a.batchId,
                    variant: a.variantName || "",
                    qty: a.quantity,
                    price: unitPrice
                }, tx);
            }

            // 5. Accounting logic
            let debitAccountId = "1-1000";
            if (paymentStatus === "paid") {
                const methodConfig = await this.settingsGateway.getPaymentMethods(tx);
                const payment = data.payments[0];
                const methodDef = methodConfig?.methods.find((m: any) => m.id === payment.methodId || m.name === payment.method);

                if (methodDef) {
                    const variantDef = methodDef.variants?.find((v: any) => v.id === payment.variantId || v.name === payment.variantName);
                    if (variantDef?.accountId) {
                        debitAccountId = variantDef.accountId;
                    } else if (methodDef.accountId) {
                        debitAccountId = methodDef.accountId;
                    } else {
                        if (methodDef.type === "cash") debitAccountId = "1-1001";
                        else if (["transfer", "qris", "ewallet"].includes(methodDef.type)) debitAccountId = "1-1000";
                    }
                }
            } else {
                debitAccountId = "1-2000"; // Piutang
            }

            const journalLines: any[] = [];
            journalLines.push({
                accountId: debitAccountId,
                debit: finalAmount,
                credit: 0,
                description: paymentStatus === 'paid' ? `Penerimaan ${paymentMethodStr}` : `Piutang Penjualan`
            });
            journalLines.push({
                accountId: "4-1000",
                debit: 0,
                credit: finalAmount,
                description: `Pendapatan ${saleId}`
            });

            if (cogsAmount > 0) {
                journalLines.push({
                    accountId: "5-1001",
                    debit: cogsAmount,
                    credit: 0,
                    description: `HPP ${saleId}`
                });
                journalLines.push({
                    accountId: "1-3000",
                    debit: 0,
                    credit: cogsAmount,
                    description: `Pengurangan persediaan ${saleId}`
                });
            }

            await this.accountingGateway.createJournal({
                description: `Penjualan ${saleId}`,
                referenceType: "sale",
                referenceId: saleId,
                lines: journalLines,
            }, data.userId, tx);

            // 6. Record in Cash Register
            for (const p of data.payments) {
                const methodLower = p.method.toLowerCase();
                if (methodLower.includes("cash") || methodLower.includes("tunai")) {
                    await this.accountingGateway.recordCashTransaction({
                        transactionType: "sale",
                        transactionId: saleId,
                        amount: p.amount,
                        description: `Penjualan ${saleId}`
                    }, tx);
                }
            }

            return { id: saleId };
        };

        const result = await this.db.transaction(runInTransaction);

        let change = 0;
        if (!data.payments.some(p => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"))) {
            change = Math.max(0, totalPaid - finalAmount);
        }

        return { message: "Sale created", id: result.id, change: change > 0 ? change : 0 };
    }
}
