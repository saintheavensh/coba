
import { ProductsService } from "$lib/features/inventory/products/products.service";
import { CategoriesService } from "$lib/features/inventory/categories/categories.service";
import { SalesService } from "$lib/features/sales/components/sales.service";
import { CustomersService } from "$lib/features/sales/components/customers/customers.service";
import { PaymentService, type PaymentMethod } from "$lib/features/finance/shared/payment.service";
import { SettingsService, type TaxSettings } from "$lib/features/settings/settings.service";
import { formatCurrency } from "$lib/shared/lib/utils";
import { toast } from "svelte-sonner";
import { authStore } from "$lib/shared/lib/auth-store.svelte";
import { CashRegisterService } from "$lib/features/accounting/services/cash-register.service";

// Types
export type CartItem = {
    uniqueId: string; // productId + variant
    productId: string;
    name: string;
    variant: string;
    price: number;
    qty: number;
    maxQty: number; // Total available stock across batches
    code?: string;
};

export type PaymentItem = {
    methodId: string;
    variantId?: string;
    amount: number;
    reference?: string;
};

export class SalesController {
    // State
    products = $state<any[]>([]);
    categories = $state<any[]>([]);
    customers = $state<any[]>([]);
    cart = $state<CartItem[]>([]);
    taxSettings = $state<TaxSettings>({
        enabled: false,
        rate: 0,
        label: "Tax",
        inclusive: false
    });
    discountAmount = $state(0);
    approvalId = $state("");
    showApprovalModal = $state(false);
    pendingApprovalData = $state<any>(null);

    // UI State
    searchTerm = $state("");
    selectedCategory = $state("all");
    paymentOpen = $state(false);
    loading = $state(false);

    // Payment State
    selectedCustomerId = $state("");
    customerOpen = $state(false);
    customerNameManual = $state("Walk-in Consumen");
    notes = $state("");
    availableMethods = $state<PaymentMethod[]>([]);
    payments = $state<PaymentItem[]>([]);

    constructor() { }

    async init() {
        await Promise.all([
            this.fetchProducts(),
            this.fetchCategories(),
            this.fetchCustomers(),
            this.fetchPaymentMethods(),
            this.fetchSettings()
        ]);
        this.resetPaymentForm();
    }

    async fetchProducts() {
        try {
            this.products = await ProductsService.getAll();
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error("Gagal memuat produk");
        }
    }

    async fetchCategories() {
        try {
            this.categories = await CategoriesService.getAll();
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    async fetchCustomers() {
        try {
            this.customers = await CustomersService.getAll();
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    }

    async fetchPaymentMethods() {
        try {
            this.availableMethods = await PaymentService.getEnabledMethods();
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        }
    }

    async fetchSettings() {
        try {
            this.taxSettings = await SettingsService.getTaxSettings();
        } catch (error) {
            console.error("Failed to fetch tax settings", error);
        }
    }

    // Derived Logic
    get processedProducts() {
        return this.products.map((p: any) => {
            const variantMap = new Map();

            // Sort batches by creation (FIFO) to determine Display Price
            const sortedBatches = (p.batches || []).sort(
                (a: any, b: any) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );

            for (const b of sortedBatches) {
                if (b.currentStock <= 0) continue;

                const vName =
                    b.variant && b.variant !== "Standard" ? b.variant : "";
                if (!variantMap.has(vName)) {
                    variantMap.set(vName, {
                        name: vName,
                        stock: 0,
                        price: b.sellPrice, // FIFO Price (First available batch price)
                    });
                }
                const v = variantMap.get(vName);
                v.stock += b.currentStock;
            }

            return {
                ...p,
                variants: Array.from(variantMap.values()),
            };
        });
    }

    get filteredProducts() {
        return this.processedProducts.filter((p: any) => {
            const term = this.searchTerm.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(term) ||
                (p.code && p.code.toLowerCase().includes(term));

            const matchesCategory =
                this.selectedCategory === "all" || p.categoryId === this.selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }

    get customerOptions() {
        return this.customers.map((c: any) => ({
            value: c.id,
            label: `${c.name} (${c.phone})`,
        }));
    }

    get subtotal() {
        return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    get taxAmount() {
        if (!this.taxSettings.enabled) return 0;
        const subtotalAfterDiscount = Math.max(0, this.subtotal - this.discountAmount);
        const rate = this.taxSettings.rate / 100;
        if (this.taxSettings.inclusive) {
            return subtotalAfterDiscount - (subtotalAfterDiscount / (1 + rate));
        } else {
            return subtotalAfterDiscount * rate;
        }
    }

    get totalWithTax() {
        const subtotalAfterDiscount = Math.max(0, this.subtotal - this.discountAmount);
        if (this.taxSettings.inclusive) {
            return subtotalAfterDiscount;
        }
        return subtotalAfterDiscount + this.taxAmount;
    }

    get transactionFees() {
        return this.payments.reduce((sum, p) => {
            const method = this.getSelectedMethod(p.methodId);
            if (!method?.feeConfig?.enabled || !p.amount) return sum;

            const { type, value } = method.feeConfig;
            if (type === "percent") {
                return sum + (p.amount * (value / 100)); // Fee based on payment amount
            } else {
                return sum + value; // Fixed fee
            }
        }, 0);
    }

    get finalTotal() {
        return this.totalWithTax + this.transactionFees;
    }

    // Replaces totalAmount for display
    get totalAmount() {
        return this.totalWithTax; // For compatibility, but UI should prefer finalTotal for payment
    }

    get totalPaid() {
        return this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    get change() {
        // If paid more than final total (including fees)
        return Math.max(0, this.totalPaid - this.finalTotal);
    }

    get remaining() {
        // Remaining to be paid
        return Math.max(0, this.finalTotal - this.totalPaid);
    }

    // Actions
    getSelectedMethod(methodId: string) {
        return this.availableMethods.find((m) => m.id === methodId);
    }

    addToCart(product: any, variant: any) {
        if (variant.stock <= 0) {
            toast.error("Stok habis!");
            return;
        }

        const uniqueId = `${product.id}-${variant.name}`;
        const existingIdx = this.cart.findIndex((c) => c.uniqueId === uniqueId);

        if (existingIdx >= 0) {
            if (this.cart[existingIdx].qty + 1 > variant.stock) {
                toast.error("Stok tidak mencukupi");
                return;
            }
            this.cart[existingIdx].qty += 1;
        } else {
            this.cart = [
                ...this.cart,
                {
                    uniqueId,
                    productId: product.id,
                    name: product.name,
                    variant: variant.name,
                    price: variant.price,
                    qty: 1,
                    maxQty: variant.stock,
                    code: product.code,
                },
            ];
        }
    }

    removeFromCart(index: number) {
        this.cart = this.cart.filter((_, i) => i !== index);
    }

    updateQty(index: number, delta: number) {
        const item = this.cart[index];
        const newQty = item.qty + delta;

        if (newQty <= 0) {
            this.removeFromCart(index);
        } else if (newQty > item.maxQty) {
            toast.error("Maksimal stok: " + item.maxQty);
        } else {
            this.cart[index].qty = newQty;
        }
    }

    resetPaymentForm() {
        this.selectedCustomerId = "";
        this.customerNameManual = "Walk-in Consumen";
        this.notes = "";
        this.discountAmount = 0;
        this.approvalId = "";
        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];

        // Ensure we have at least one payment method if available
        if (defaultMethod) {
            this.payments = [{ methodId: defaultMethod.id, amount: 0 }];
        } else if (this.availableMethods.length > 0) {
            this.payments = [{ methodId: this.availableMethods[0].id, amount: 0 }];
        }
    }

    async openCheckout() {
        // Check Register Status first
        try {
            const status = await CashRegisterService.getStatus();
            if (!status.isOpen) {
                toast.error("Register Closed. Please open a session in Kasir Dashboard first.");
                return;
            }
        } catch (e) {
            console.error("Failed to check register status", e);
            toast.error("System Offline: Cannot verify register status");
            return;
        }

        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];

        // Initialize payment with TOTAL including Tax (fees are dynamic based on method, so we start with totalWithTax)
        this.payments = [{ methodId: defaultMethod?.id || "", amount: this.totalWithTax }];
        this.paymentOpen = true;
    }

    addPaymentRow() {
        const defaultMethod =
            this.availableMethods.find((m) => m.type === "cash") ||
            this.availableMethods[0];
        this.payments = [
            ...this.payments,
            { methodId: defaultMethod?.id || "", amount: 0 },
        ];
    }

    removePaymentRow(index: number) {
        if (this.payments.length > 1) {
            this.payments = this.payments.filter((_, i) => i !== index);
        }
    }

    handleMethodChange(index: number, newMethodId: string) {
        const method = this.getSelectedMethod(newMethodId);

        // Strict Rule: If 1st Payment is Cash -> It must be single payment.
        if (index === 0 && method?.type === "cash") {
            this.payments = [{ methodId: newMethodId, amount: this.payments[0].amount }];
            return;
        }

        // Update method
        this.payments[index].methodId = newMethodId;
        this.payments[index].variantId = undefined; // Reset variant
    }

    handleVariantChange(index: number, newVariantId: string) {
        this.payments[index].variantId = newVariantId;
    }

    async processCheckout() {
        if (this.cart.length === 0) return;

        // Validation
        if (this.remaining > 0) {
            // Check if any payment is tempo (Debt)
            const hasTempo = this.payments.some((p) => {
                const m = this.getSelectedMethod(p.methodId);
                return (
                    m?.type === "custom" &&
                    (m.name.toLowerCase().includes("tempo") ||
                        m.id === "PM-TEMPO")
                );
            });

            if (!hasTempo) {
                toast.error(`Pembayaran kurang ${formatCurrency(this.remaining)}`);
                return;
            }
        }

        // Validate Banks
        for (const p of this.payments) {
            const method = this.getSelectedMethod(p.methodId);
            if (method?.type === "transfer" && !p.variantId) {
                toast.error("Mohon pilih Bank untuk metode Transfer");
                return;
            }
        }

        const selectedCustomer = this.customers.find(
            (c: any) => c.id === this.selectedCustomerId,
        );
        const name = selectedCustomer
            ? selectedCustomer.name
            : this.customerNameManual || "Walk-in Consumen";

        const payload = {
            memberId: this.selectedCustomerId || undefined,
            customerName: name,
            payments: this.payments.map((p) => {
                const method = this.getSelectedMethod(p.methodId);
                const variant = method?.variants?.find(
                    (v) => v.id === p.variantId,
                );
                return {
                    methodId: p.methodId,
                    method: method?.name || "Unknown",
                    variantId: p.variantId,
                    variantName: variant?.name,
                    amount: p.amount,
                    reference: p.reference,
                };
            }),
            userId: authStore.user?.id || "USR-ADMIN", // Use real user ID
            notes: this.notes,
            discountAmount: this.discountAmount,
            approvalId: this.approvalId || undefined,
            items: this.cart.map((c) => ({
                productId: c.productId,
                variant: c.variant,
                qty: c.qty,
                price: c.price,
            })),
            // New Fields for Tax & Fees
            subtotal: this.subtotal,
            tax: this.taxAmount,
            taxRate: this.taxSettings.enabled ? this.taxSettings.rate : 0,
            taxInclusive: this.taxSettings.inclusive,
            serviceFee: this.transactionFees,
        };

        try {
            this.loading = true;
            const data = await SalesService.create(payload);

            // Success handling
            await this.fetchProducts(); // Refresh products (stock)
            if (this.selectedCustomerId) await this.fetchCustomers(); // Refresh customers (debt)

            toast.success("Transaksi Berhasil! ID: " + data.id);
            if (data.change > 0) {
                toast.info(`Kembalian: ${formatCurrency(data.change)}`, {
                    duration: 10000,
                });
            }
            this.cart = [];
            this.paymentOpen = false;
            this.resetPaymentForm();
        } catch (e: any) {
            const extra = e.response?.data?.extra;
            if (extra?.type === 'APPROVAL_REQUIRED') {
                this.pendingApprovalData = extra;
                this.showApprovalModal = true;
                toast.warning("Discount level requires manager approval");
            } else {
                toast.error("Gagal: " + (e.response?.data?.message || e.message));
            }
        } finally {
            this.loading = false;
        }
    }
}
