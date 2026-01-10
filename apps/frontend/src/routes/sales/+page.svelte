<script lang="ts">
    import { onMount } from "svelte";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button } from "$lib/components/ui/button";
    import {
        Search,
        ShoppingCart,
        Trash2,
        Plus,
        Minus,
        CreditCard,
        X,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { InventoryService } from "$lib/services/inventory.service";
    import { SalesService } from "$lib/services/sales.service";
    import { CustomersService } from "$lib/services/customers.service";
    import { toast } from "svelte-sonner";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import Combobox from "$lib/components/custom/combobox.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { formatCurrency } from "$lib/utils";
    import * as Select from "$lib/components/ui/select";

    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";

    // Types
    type CartItem = {
        uniqueId: string; // productId + variant
        productId: string;
        name: string;
        variant: string;
        price: number;
        qty: number;
        maxQty: number; // Total available stock across batches
    };

    type PaymentItem = {
        method: "cash" | "transfer" | "qris" | "tempo";
        amount: number;
        reference?: string;
    };

    // Query Client
    const client = useQueryClient();

    // Query State
    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: InventoryService.getProducts,
    }));

    const customersQuery = createQuery(() => ({
        queryKey: ["customers"],
        queryFn: () => CustomersService.getAll(),
    }));

    // Mutation
    const checkoutMutation = createMutation(() => ({
        mutationFn: SalesService.create,
        onSuccess: (data) => {
            client.invalidateQueries({ queryKey: ["products"] });
            client.invalidateQueries({ queryKey: ["customers"] }); // If debt updated
            toast.success("Transaksi Berhasil! ID: " + data.id);
            if (data.change > 0) {
                toast.info(`Kembalian: ${formatCurrency(data.change)}`, {
                    duration: 10000,
                });
            }
            cart = [];
            paymentOpen = false;
            resetPaymentForm();
        },
        onError: (e: any) => {
            toast.error("Gagal: " + (e.response?.data?.message || e.message));
        },
    }));

    // Reactive Data using Svelte 5 runes
    let products = $derived(productsQuery.data || []);
    let customers = $derived(customersQuery.data || []);
    let loading = $derived(checkoutMutation.isPending);

    // Derived Logic: Group Batches by Variant
    let processedProducts = $derived(
        products.map((p: any) => {
            const variantMap = new Map();

            // Sort batches by creation (FIFO) to determine Display Price
            const sortedBatches = (p.batches || []).sort(
                (a: any, b: any) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );

            for (const b of sortedBatches) {
                if (b.currentStock <= 0) continue;

                const vName = b.variant || "Standard";
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
        }),
    );

    // Local State - must be declared before derived that uses it
    let searchTerm = $state("");

    let filteredProducts = $derived(
        processedProducts.filter((p: any) => {
            const term = searchTerm.toLowerCase();
            return (
                p.name.toLowerCase().includes(term) ||
                (p.code && p.code.toLowerCase().includes(term))
            );
        }),
    );

    // Customer Combobox Options
    let customerOptions = $derived(
        customers.map((c: any) => ({
            value: c.id,
            label: `${c.name} (${c.phone})`,
        })),
    );

    // Local State
    let cart = $state<CartItem[]>([]);
    let paymentOpen = $state(false);

    // Payment State
    let selectedCustomerId = $state(""); // From Combobox
    let customerNameManual = $state("Walk-in Consumen"); // Default
    let notes = $state("");

    let payments = $state<PaymentItem[]>([{ method: "cash", amount: 0 }]);

    function addToCart(product: any, variant: any) {
        if (variant.stock <= 0) {
            toast.error("Stok habis!");
            return;
        }

        const uniqueId = `${product.id}-${variant.name}`;
        const existingIdx = cart.findIndex((c) => c.uniqueId === uniqueId);

        if (existingIdx >= 0) {
            if (cart[existingIdx].qty + 1 > variant.stock) {
                toast.error("Stok tidak mencukupi");
                return;
            }
            cart[existingIdx].qty += 1;
        } else {
            cart = [
                ...cart,
                {
                    uniqueId,
                    productId: product.id,
                    name: product.name,
                    variant: variant.name,
                    price: variant.price,
                    qty: 1,
                    maxQty: variant.stock,
                },
            ];
        }
    }

    function removeFromCart(index: number) {
        cart = cart.filter((_, i) => i !== index);
    }

    function updateQty(index: number, delta: number) {
        const item = cart[index];
        const newQty = item.qty + delta;

        if (newQty <= 0) {
            removeFromCart(index);
        } else if (newQty > item.maxQty) {
            toast.error("Maksimal stok: " + item.maxQty);
        } else {
            cart[index].qty = newQty;
        }
    }

    function resetPaymentForm() {
        selectedCustomerId = "";
        customerNameManual = "Walk-in Consumen";
        notes = "";
        payments = [{ method: "cash", amount: 0 }];
    }

    function openCheckout() {
        payments = [{ method: "cash", amount: totalAmount }]; // Default full cash
        paymentOpen = true;
    }

    function addPaymentRow() {
        payments = [...payments, { method: "cash", amount: 0 }];
    }

    function removePaymentRow(index: number) {
        if (payments.length > 1) {
            payments = payments.filter((_, i) => i !== index);
        }
    }

    function handleMethodChange(index: number, newMethod: string) {
        // Strict Rule: If 1st Payment is Cash -> It must be single payment.
        if (index === 0 && newMethod === "cash") {
            payments = [{ method: "cash", amount: payments[0].amount }];
            return;
        }
        // Update method normally
        payments[index].method = newMethod as any;
    }

    let totalAmount = $derived(
        cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    );
    let totalPaid = $derived(
        payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    );
    let change = $derived(totalPaid - totalAmount);
    let remaining = $derived(totalAmount - totalPaid);

    function processCheckout() {
        if (cart.length === 0) return;

        // Validation
        if (remaining > 0) {
            // Check if strict payment logic is needed. backend throws if underpaid.
            // But allow "Tempo" to cover logic?
            // If totalPaid < totalAmount, user must confirm "Partial" or "Unpaid"?
            // For now, enforce Total Paid >= Amount UNLESS implicit Tempo logic (but we track tempo explicitly)
            // So if remaining > 0, it means user hasn't allocated enough funds (even via Tempo).
            toast.error(`Pembayaran kurang ${formatCurrency(remaining)}`);
            return;
        }

        const selectedCustomer = customers.find(
            (c: any) => c.id === selectedCustomerId,
        );
        const name = selectedCustomer
            ? selectedCustomer.name
            : customerNameManual || "Walk-in Consumen";

        const payload = {
            memberId: selectedCustomerId || undefined,
            customerName: name,
            payments: payments,
            userId: "USR-ADMIN", // Should come from session
            notes: notes,
            items: cart.map((c) => ({
                productId: c.productId,
                variant: c.variant,
                qty: c.qty,
                price: c.price,
            })),
        };

        checkoutMutation.mutate(payload);
    }
</script>

<div class="flex h-[calc(100vh-100px)] gap-6">
    <!-- Left: Product Catalog -->
    <div class="flex-1 flex flex-col gap-4">
        <div class="flex gap-2">
            <div class="relative flex-1">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Cari produk (Nama / SKU)..."
                    class="pl-8"
                    bind:value={searchTerm}
                />
            </div>
        </div>

        <div
            class="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20"
        >
            {#each filteredProducts as product}
                <div
                    class="border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors flex flex-col justify-between space-y-3"
                >
                    <div>
                        <div class="flex justify-between items-start">
                            <h3
                                class="font-semibold line-clamp-2 leading-tight"
                            >
                                {product.name}
                            </h3>
                            {#if product.code}
                                <span
                                    class="text-[10px] font-mono bg-muted px-1 rounded"
                                    >{product.code}</span
                                >
                            {/if}
                        </div>
                        <p class="text-xs text-muted-foreground mt-1">
                            {product.category?.name || "Umum"}
                        </p>
                    </div>

                    <div class="space-y-2">
                        {#if !product.variants || product.variants.length === 0}
                            <div
                                class="text-center text-sm text-red-500 bg-red-50 py-1 rounded"
                            >
                                Stok Habis
                            </div>
                        {:else}
                            <div
                                class="text-xs font-medium text-muted-foreground mb-1"
                            >
                                Pilih Varian:
                            </div>
                            <div class="space-y-1">
                                {#each product.variants as variant}
                                    <button
                                        class="w-full text-left text-xs flex justify-between items-center p-2 rounded border hover:bg-accent group active:scale-95 transition-transform"
                                        onclick={() =>
                                            addToCart(product, variant)}
                                    >
                                        <div class="flex flex-col">
                                            <span
                                                class="font-medium group-hover:text-primary"
                                                >{variant.name}</span
                                            >
                                            <span
                                                class="text-[10px] text-muted-foreground"
                                                >Stok: {variant.stock}</span
                                            >
                                        </div>
                                        <div class="font-bold">
                                            {formatCurrency(variant.price)}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Right: Cart -->
    <div
        class="w-[400px] flex flex-col bg-card border rounded-lg h-full shadow-sm"
    >
        <div class="p-4 border-b flex items-center justify-between bg-muted/20">
            <h2 class="font-semibold flex items-center gap-2">
                <ShoppingCart class="h-5 w-5" /> Keranjang
            </h2>
            <Badge variant="secondary">{cart.length} Item</Badge>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
            {#if cart.length === 0}
                <div
                    class="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50"
                >
                    <ShoppingCart class="h-12 w-12" />
                    <p>Keranjang kosong</p>
                </div>
            {:else}
                {#each cart as item, i}
                    <div
                        class="flex justify-between items-start gap-3 bg-background p-3 rounded border"
                    >
                        <div class="flex-1">
                            <h4 class="font-medium text-sm line-clamp-1">
                                {item.name}
                            </h4>
                            <div class="text-xs text-muted-foreground mt-0.5">
                                {item.variant}
                            </div>
                            <div class="text-xs font-mono mt-1">
                                @ {formatCurrency(item.price)}
                            </div>
                        </div>

                        <div class="flex flex-col items-end gap-2">
                            <div class="font-bold text-sm">
                                {formatCurrency(item.price * item.qty)}
                            </div>
                            <div class="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    class="h-6 w-6"
                                    onclick={() => updateQty(i, -1)}
                                >
                                    <Minus class="h-3 w-3" />
                                </Button>
                                <span
                                    class="w-8 text-center text-sm font-medium"
                                    >{item.qty}</span
                                >
                                <Button
                                    variant="outline"
                                    size="icon"
                                    class="h-6 w-6"
                                    onclick={() => updateQty(i, 1)}
                                >
                                    <Plus class="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <div class="p-4 bg-muted/20 border-t space-y-4">
            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
                <Separator />
                <div class="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
            </div>

            <Button
                size="lg"
                class="w-full"
                disabled={cart.length === 0}
                onclick={openCheckout}
            >
                Bayar Sekarang
            </Button>
        </div>
    </div>

    <!-- Payment Dialog -->
    <Dialog bind:open={paymentOpen}>
        <DialogContent class="max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Checkout & Pembayaran</DialogTitle>
                <DialogDescription
                    >Input metode pembayaran untuk transaksi ini.</DialogDescription
                >
            </DialogHeader>

            <div class="grid gap-6 py-4">
                <!-- Top Section: Total & Customer -->
                <div class="grid grid-cols-2 gap-4">
                    <div
                        class="bg-slate-100 p-4 rounded-lg flex flex-col justify-center items-center"
                    >
                        <span class="text-sm text-muted-foreground"
                            >Total Tagihan</span
                        >
                        <span class="text-3xl font-bold font-mono text-primary"
                            >{formatCurrency(totalAmount)}</span
                        >
                    </div>
                    <div class="space-y-2">
                        <Label>Pelanggan</Label>
                        <Combobox
                            items={customerOptions}
                            bind:value={selectedCustomerId}
                            placeholder="Cari Pelanggan..."
                            allowCreate={false}
                        />
                        {#if !selectedCustomerId}
                            <Input
                                placeholder="Nama Guest (Opsional)"
                                bind:value={customerNameManual}
                                class="mt-2"
                            />
                        {/if}
                    </div>
                </div>

                <Separator />

                <!-- Payment Methods -->
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <Label class="text-base font-semibold">Pembayaran</Label
                        >
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={addPaymentRow}
                            disabled={payments.length >= 2 ||
                                payments[0].method === "cash"}
                        >
                            <Plus class="h-3 w-3 mr-1" /> Tambah Split
                        </Button>
                    </div>

                    {#each payments as payment, i}
                        <div class="flex gap-2 items-start">
                            <div class="w-[140px]">
                                <select
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={payment.method}
                                    onchange={(e) =>
                                        handleMethodChange(
                                            i,
                                            e.currentTarget.value,
                                        )}
                                >
                                    <option value="cash">Tunai</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="qris">QRIS</option>
                                    {#if selectedCustomerId}
                                        <option value="tempo"
                                            >Tempo (Kredit)</option
                                        >
                                    {/if}
                                </select>
                            </div>
                            <div class="flex-1 relative">
                                <span
                                    class="absolute left-3 top-2.5 text-muted-foreground text-sm z-10"
                                    >Rp</span
                                >
                                <CurrencyInput
                                    class="pl-9"
                                    bind:value={payment.amount}
                                    placeholder="0"
                                />
                            </div>
                            {#if payments.length > 1}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => removePaymentRow(i)}
                                >
                                    <Trash2 class="h-4 w-4 text-red-500" />
                                </Button>
                            {/if}
                        </div>
                    {/each}

                    <!-- Summary -->
                    <div class="bg-muted/30 p-3 rounded-lg space-y-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground"
                                >Total Bayar:</span
                            >
                            <span class="font-semibold"
                                >{formatCurrency(totalPaid)}</span
                            >
                        </div>
                        {#if remaining > 0}
                            <div
                                class="flex justify-between text-red-600 font-medium"
                            >
                                <span>Kurang:</span>
                                <span>{formatCurrency(remaining)}</span>
                            </div>
                        {:else}
                            <div
                                class="flex justify-between text-green-600 font-medium"
                            >
                                <span>Kembalian:</span>
                                <span>{formatCurrency(change)}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label>Catatan</Label>
                    <Input
                        placeholder="Catatan tambahan..."
                        bind:value={notes}
                    />
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (paymentOpen = false)}
                    disabled={loading}>Batal</Button
                >
                <Button
                    onclick={processCheckout}
                    disabled={loading || remaining > 0}
                >
                    {loading ? "Memproses..." : "Konfirmasi Bayar"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
