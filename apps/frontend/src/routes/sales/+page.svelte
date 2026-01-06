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
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { InventoryService } from "$lib/services/inventory.service";
    import { SalesService } from "$lib/services/sales.service";
    import { toast } from "svelte-sonner";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";

    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";

    // Types
    type CartItem = {
        uniqueId: string; // for key
        productId: string;
        batchId: string;
        name: string;
        variant: string;
        price: number;
        qty: number;
        maxQty: number;
    };

    // Query Client
    const client = useQueryClient();

    // Query State
    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: InventoryService.getProducts,
    }));

    // Mutation
    const checkoutMutation = createMutation(() => ({
        mutationFn: SalesService.create,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["products"] });
            toast.success("Transaksi Berhasil!");
            cart = [];
            paymentOpen = false;
        },
        onError: (e: any) => {
            toast.error("Gagal: " + (e.response?.data?.message || e.message));
        },
    }));

    // Reactive Data
    $: products = productsQuery.data || [];
    $: loading = checkoutMutation.isPending; // Use mutation state for loading spinner

    // Local State
    let searchTerm = "";
    let cart: CartItem[] = [];
    let paymentOpen = false;

    // Payment State
    let paymentMethod: "cash" | "transfer" | "qris" = "cash";
    let customerName = "Guest";
    let notes = "";

    function addToCart(product: any, batch: any) {
        if (batch.currentStock <= 0) {
            toast.error("Stok habis!");
            return;
        }

        const existingIdx = cart.findIndex((c) => c.batchId === batch.id);

        if (existingIdx >= 0) {
            if (cart[existingIdx].qty + 1 > batch.currentStock) {
                toast.error("Stok tidak mencukupi");
                return;
            }
            cart[existingIdx].qty += 1;
        } else {
            cart = [
                ...cart,
                {
                    uniqueId: batch.id, // simple match
                    productId: product.id,
                    batchId: batch.id,
                    name: product.name,
                    variant: batch.variant || "Standard",
                    price: batch.sellPrice,
                    qty: 1,
                    maxQty: batch.currentStock,
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

    function processCheckout() {
        if (cart.length === 0) return;

        const payload = {
            // memberId: ... (future)
            customerName: customerName,
            paymentMethod: paymentMethod,
            notes: notes,
            items: cart.map((c) => ({
                productId: c.productId,
                batchId: c.batchId,
                qty: c.qty,
            })),
        };

        checkoutMutation.mutate(payload);
    }

    $: filteredProducts = products.filter((p: any) => {
        const term = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(term) ||
            (p.code && p.code.toLowerCase().includes(term))
        );
    });

    $: totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
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
                        {#if product.stock === 0}
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
                                {#each product.batches || [] as batch}
                                    {#if batch.currentStock > 0}
                                        <button
                                            class="w-full text-left text-xs flex justify-between items-center p-2 rounded border hover:bg-accent group active:scale-95 transition-transform"
                                            onclick={() =>
                                                addToCart(product, batch)}
                                        >
                                            <div class="flex flex-col">
                                                <span
                                                    class="font-medium group-hover:text-primary"
                                                    >{batch.variant ||
                                                        "Standard"}</span
                                                >
                                                <span
                                                    class="text-[10px] text-muted-foreground"
                                                    >Stok: {batch.currentStock}</span
                                                >
                                            </div>
                                            <div class="font-bold">
                                                Rp {batch.sellPrice.toLocaleString()}
                                            </div>
                                        </button>
                                    {/if}
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
                                @ Rp {item.price.toLocaleString()}
                            </div>
                        </div>

                        <div class="flex flex-col items-end gap-2">
                            <div class="font-bold text-sm">
                                Rp {(item.price * item.qty).toLocaleString()}
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
                    <span>Rp {totalAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div class="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rp {totalAmount.toLocaleString()}</span>
                </div>
            </div>

            <Button
                size="lg"
                class="w-full"
                disabled={cart.length === 0}
                onclick={() => (paymentOpen = true)}
            >
                Bayar Sekarang
            </Button>
        </div>
    </div>

    <!-- Payment Dialog -->
    <Dialog bind:open={paymentOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription
                    >Selesaikan pembayaran transaksi ini.</DialogDescription
                >
            </DialogHeader>

            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Total</Label>
                    <div class="col-span-3 text-2xl font-bold font-mono">
                        Rp {totalAmount.toLocaleString()}
                    </div>
                </div>

                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Customer</Label>
                    <Input
                        class="col-span-3"
                        placeholder="Nama Pelanggan (Optional)"
                        bind:value={customerName}
                    />
                </div>

                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Metode</Label>
                    <div class="col-span-3 flex gap-2">
                        <Button
                            variant={paymentMethod === "cash"
                                ? "default"
                                : "outline"}
                            onclick={() => (paymentMethod = "cash")}
                            class="flex-1"
                        >
                            Tunai
                        </Button>
                        <Button
                            variant={paymentMethod === "transfer"
                                ? "default"
                                : "outline"}
                            onclick={() => (paymentMethod = "transfer")}
                            class="flex-1"
                        >
                            Transfer
                        </Button>
                        <Button
                            variant={paymentMethod === "qris"
                                ? "default"
                                : "outline"}
                            onclick={() => (paymentMethod = "qris")}
                            class="flex-1"
                        >
                            QRIS
                        </Button>
                    </div>
                </div>

                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Catatan</Label>
                    <Input
                        class="col-span-3"
                        placeholder="Catatan tambahan (Opsional)"
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
                <Button onclick={processCheckout} disabled={loading}>
                    {#if loading}Processing...{:else}Konfirmasi Bayar{/if}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
