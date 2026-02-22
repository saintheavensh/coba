export type PurchaseStatus = "DRAFT" | "RECEIVED" | "COMPLETED" | "CANCELLED";

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}

export interface IPurchaseEvent {
    name: string;
    payload: any;
    timestamp: Date;
}

export interface PurchaseItemProps {
    id?: string;
    productId: string;
    variantId?: string;
    qtyOrdered: number;
    qtyReceived: number;
    buyPrice: number;
    sellPrice: number;
    batchId?: string;
}

export class PurchaseItem {
    private props: PurchaseItemProps;

    constructor(props: PurchaseItemProps) {
        this.validate(props);
        this.props = props;
    }

    private validate(props: PurchaseItemProps) {
        if (props.qtyReceived > props.qtyOrdered) {
            throw new DomainError(`Cannot receive more than ordered for product ${props.productId}. Ordered: ${props.qtyOrdered}, Received: ${props.qtyReceived}`);
        }
        if (props.qtyOrdered <= 0) {
            throw new DomainError(`Ordered quantity must be greater than 0 for product ${props.productId}`);
        }
    }

    get productId() { return this.props.productId; }
    get variantId() { return this.props.variantId; }
    get qtyOrdered() { return this.props.qtyOrdered; }
    get qtyReceived() { return this.props.qtyReceived; }
    get buyPrice() { return this.props.buyPrice; }
    get sellPrice() { return this.props.sellPrice; }
    get batchId() { return this.props.batchId; }

    updateReceivedQty(qty: number) {
        const newQty = this.props.qtyReceived + qty;
        if (newQty > this.props.qtyOrdered) {
            throw new DomainError(`Over-receive detected. Total received (${newQty}) exceeds ordered (${this.props.qtyOrdered})`);
        }
        this.props.qtyReceived = newQty;
    }

    toSnapshot() {
        return { ...this.props };
    }
}

export interface PurchaseOrderProps {
    id: string;
    supplierId: string;
    userId?: string;
    totalAmount: number;
    status: PurchaseStatus;
    items: PurchaseItem[];
    date?: Date;
    referenceNumber?: string;
    notes?: string;
    receivedAt?: Date;
    verifiedAt?: Date;
}

export class PurchaseOrder {
    private props: PurchaseOrderProps;
    private _events: IPurchaseEvent[] = [];

    constructor(props: PurchaseOrderProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get status() { return this.props.status; }
    get items() { return this.props.items; }
    get supplierId() { return this.props.supplierId; }
    get totalAmount() { return this.props.totalAmount; }

    receiveItems(receivedItems: { productId: string, variantId?: string, qty: number }[]) {
        if (this.props.status !== "DRAFT" && this.props.status !== "RECEIVED") {
            throw new DomainError(`Cannot receive items in status ${this.props.status}`);
        }

        for (const received of receivedItems) {
            const item = this.props.items.find(i => i.productId === received.productId && i.variantId === received.variantId);
            if (!item) {
                throw new DomainError(`Product ${received.productId} not found in this purchase order`);
            }
            item.updateReceivedQty(received.qty);
        }

        this.props.status = "RECEIVED";
        this.props.receivedAt = new Date();
    }

    complete() {
        // Guard: Transition rules
        if (this.props.status !== "RECEIVED") {
            throw new DomainError(`Cannot complete purchase from status ${this.props.status}. Must be RECEIVED first.`);
        }

        // Guard: Completion logic (fully received)
        const allReceived = this.props.items.every(item => item.qtyReceived === item.qtyOrdered);
        if (!allReceived) {
            throw new DomainError("Cannot complete purchase: Not all items are fully received.");
        }

        this.props.status = "COMPLETED";
        this.props.verifiedAt = new Date();

        this.addEvent("PurchaseCompleted", {
            purchaseId: this.id,
            totalAmount: this.totalAmount,
            items: this.props.items.map(i => i.toSnapshot()),
            timestamp: this.props.verifiedAt
        });
    }

    cancel() {
        if (this.props.status === "COMPLETED") {
            throw new DomainError("Cannot cancel a completed purchase order.");
        }
        this.props.status = "CANCELLED";
        this.addEvent("PurchaseCancelled", {
            purchaseId: this.id,
            timestamp: new Date()
        });
    }

    private addEvent(name: string, payload: any) {
        this._events.push({
            name,
            payload,
            timestamp: new Date()
        });
    }

    get events() {
        return [...this._events];
    }

    clearEvents() {
        this._events = [];
    }

    toSnapshot() {
        return {
            ...this.props,
            items: this.props.items.map(i => i.toSnapshot())
        };
    }
}
