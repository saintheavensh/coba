<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import {
        Search,
        ShoppingCart,
        Trash2,
        Plus,
        Minus,
        CreditCard,
        X,
        Package,
        Filter,
        Check,
        ChevronsUpDown,
        User,
        Wallet,
        Banknote,
        Receipt,
        ShoppingBag,
        ScanBarcode,
        ChevronLeft,
        History,
        Percent,
        MoreHorizontal,
        CircleDollarSign,
    } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import * as Tabs from "$lib/components/ui/tabs";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import {
        Sheet,
        SheetContent,
        SheetHeader,
        SheetTitle,
        SheetTrigger,
    } from "$lib/components/ui/sheet";

    import { InventoryService } from "$lib/services/inventory.service";
    import { SalesService } from "$lib/services/sales.service";
    import { CustomersService } from "$lib/services/customers.service";
    import {
        PaymentService,
        type PaymentMethod,
    } from "$lib/services/payment.service";
    import { toast } from "svelte-sonner";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import { cn } from "$lib/utils";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { formatCurrency } from "$lib/utils";

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
        code?: string;
    };

    type PaymentItem = {
        methodId: string;
        variantId?: string;
        amount: number;
        reference?: string;
    };

    // Query Client
    const client = useQueryClient();

    // Query State
    const productsQuery = createQuery(() => ({
        queryKey: ["products"],
        queryFn: () => InventoryService.getProducts(),
    }));

    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
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
    let categories = $derived(categoriesQuery.data || []);
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

    // Local State
    let searchTerm = $state("");
    let selectedCategory = $state("all");

    let filteredProducts = $derived(
        processedProducts.filter((p: any) => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(term) ||
                (p.code && p.code.toLowerCase().includes(term));

            const matchesCategory =
                selectedCategory === "all" || p.categoryId === selectedCategory;

            return matchesSearch && matchesCategory;
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
    let customerOpen = $state(false);
    let customerNameManual = $state("Walk-in Consumen"); // Default
    let notes = $state("");

    let availableMethods = $state<PaymentMethod[]>([]);
    let payments = $state<PaymentItem[]>([]);

    onMount(async () => {
        try {
            availableMethods = await PaymentService.getEnabledMethods();
        } catch (e) {
            console.error("Failed to fetch payment methods", e);
            toast.error("Gagal memuat metode pembayaran");
        }
    });

    function getSelectedMethod(methodId: string) {
        return availableMethods.find((m) => m.id === methodId);
    }

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
                    code: product.code,
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
        const defaultMethod =
            availableMethods.find((m) => m.type === "cash") ||
            availableMethods[0];
        payments = [{ methodId: defaultMethod?.id || "", amount: 0 }];
    }

    function openCheckout() {
        const defaultMethod =
            availableMethods.find((m) => m.type === "cash") ||
            availableMethods[0];
        payments = [{ methodId: defaultMethod?.id || "", amount: totalAmount }]; // Default full cash
        paymentOpen = true;
    }

    function addPaymentRow() {
        const defaultMethod =
            availableMethods.find((m) => m.type === "cash") ||
            availableMethods[0];
        payments = [
            ...payments,
            { methodId: defaultMethod?.id || "", amount: 0 },
        ];
    }

    function removePaymentRow(index: number) {
        if (payments.length > 1) {
            payments = payments.filter((_, i) => i !== index);
        }
    }

    function handleMethodChange(index: number, newMethodId: string) {
        const method = getSelectedMethod(newMethodId);

        // Strict Rule: If 1st Payment is Cash -> It must be single payment.
        if (index === 0 && method?.type === "cash") {
            payments = [{ methodId: newMethodId, amount: payments[0].amount }];
            return;
        }

        // Update method
        payments[index].methodId = newMethodId;
        payments[index].variantId = undefined; // Reset variant
    }

    function handleVariantChange(index: number, newVariantId: string) {
        payments[index].variantId = newVariantId;
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
            // Check if any payment is tempo (Debt)
            // Need to check mapped methods
            const hasTempo = payments.some((p) => {
                const m = getSelectedMethod(p.methodId);
                return (
                    m?.type === "custom" &&
                    (m.name.toLowerCase().includes("tempo") ||
                        m.id === "PM-TEMPO")
                );
            });

            if (!hasTempo) {
                toast.error(`Pembayaran kurang ${formatCurrency(remaining)}`);
                return;
            }
        }

        // Validate Banks
        for (const p of payments) {
            const method = getSelectedMethod(p.methodId);
            if (method?.type === "transfer" && !p.variantId) {
                toast.error("Mohon pilih Bank untuk metode Transfer");
                return;
            }
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
            payments: payments.map((p) => {
                const method = getSelectedMethod(p.methodId);
                const variant = method?.variants.find(
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

<div class="h-screen flex bg-background overflow-hidden font-sans">
    <!-- Left: Product Catalog -->
    <div class="flex-1 flex flex-col min-w-0 bg-muted/5 relative">
        <!-- Decoration Background -->
        <div
            class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"
        ></div>

        <!-- Header -->
        <div
            class="px-6 py-4 flex flex-col gap-4 border-b bg-background/80 backdrop-blur-xl z-20"
        >
            <div class="flex items-center justify-between">
                <div>
                    <h1
                        class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                        Point of Sales
                    </h1>
                    <p class="text-muted-foreground text-sm">
                        Kelola transaksi penjualan dengan mudah
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        href="/sales/history"
                        class="gap-2 hidden md:flex"
                    >
                        <History class="h-4 w-4" />
                        Riwayat Transaksi
                    </Button>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex gap-3">
                <div class="relative flex-1 max-w-md">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        type="search"
                        placeholder="Cari produk (Nama atau SKU)..."
                        class="pl-9 bg-secondary/10 border-muted-foreground/20 focus:bg-background transition-all"
                        bind:value={searchTerm}
                    />
                </div>
                <Select type="single" bind:value={selectedCategory}>
                    <SelectTrigger
                        class="w-[180px] bg-secondary/10 border-muted-foreground/20"
                    >
                        <div class="flex items-center gap-2 overflow-hidden">
                            <Filter class="w-3.5 h-3.5 flex-shrink-0" />
                            <span class="truncate">
                                {categories.find(
                                    (c) => c.id === selectedCategory,
                                )?.name || "Semua Kategori"}
                            </span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {#each categories as cat}
                            <SelectItem value={cat.id}>{cat.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 scroll-smooth">
            {#if filteredProducts.length === 0}
                <div
                    class="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300"
                >
                    <div
                        class="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-4"
                    >
                        <Search class="h-10 w-10 opacity-20" />
                    </div>
                    <h3 class="font-medium text-lg text-foreground/80">
                        Tidak ada produk ditemukan
                    </h3>
                    <p class="text-sm">
                        Coba kata kunci lain atau ubah filter kategori
                    </p>
                </div>
            {:else}
                <div
                    class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20"
                >
                    {#each filteredProducts as product}
                        <div
                            class="group relative flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30"
                        >
                            <!-- Image Thumbnail -->
                            <div
                                class="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden"
                            >
                                {#if product.image}
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                {:else}
                                    <Package
                                        class="h-10 w-10 text-muted-foreground/20"
                                    />
                                {/if}

                                <!-- Code Badge -->
                                {#if product.code}
                                    <div class="absolute top-2 left-2">
                                        <Badge
                                            variant="secondary"
                                            class="bg-background/80 backdrop-blur text-[10px] font-mono shadow-sm px-1.5 h-5 border-0"
                                        >
                                            {product.code}
                                        </Badge>
                                    </div>
                                {/if}
                            </div>

                            <div class="p-3 flex flex-col flex-1 gap-1.5">
                                <h3
                                    class="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-blue-600 transition-colors"
                                >
                                    {product.name}
                                </h3>

                                <div class="mt-auto pt-2 space-y-2">
                                    {#if !product.variants || product.variants.length === 0}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled
                                            class="w-full h-8 text-xs bg-red-50 text-red-600 dark:bg-red-900/20"
                                        >
                                            Stok Habis
                                        </Button>
                                    {:else}
                                        <div class="space-y-1.5">
                                            {#each product.variants.slice(0, 2) as v}
                                                <button
                                                    class="w-full flex items-center justify-between p-2 rounded-lg border border-transparent bg-secondary/30 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 transition-all group/btn text-left"
                                                    onclick={() =>
                                                        addToCart(product, v)}
                                                >
                                                    <div
                                                        class="flex flex-col min-w-0"
                                                    >
                                                        <span
                                                            class="text-xs font-medium truncate"
                                                            >{v.name}</span
                                                        >
                                                        <span
                                                            class="text-[10px] text-muted-foreground"
                                                            >Stok: {v.stock}</span
                                                        >
                                                    </div>
                                                    <div
                                                        class="flex flex-col items-end pl-2"
                                                    >
                                                        <span
                                                            class="text-xs font-bold text-blue-700 dark:text-blue-400"
                                                            >{formatCurrency(
                                                                v.price,
                                                            )}</span
                                                        >
                                                        <Plus
                                                            class="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-blue-500"
                                                        />
                                                    </div>
                                                </button>
                                            {/each}

                                            {#if product.variants.length > 2}
                                                <Popover.Root>
                                                    <Popover.Trigger
                                                        class="w-full"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            class="w-full h-7 text-[10px] text-muted-foreground"
                                                        >
                                                            +{product.variants
                                                                .length - 2} Varian
                                                            Lainnya
                                                        </Button>
                                                    </Popover.Trigger>
                                                    <Popover.Content
                                                        class="w-56 p-2"
                                                    >
                                                        <div class="space-y-1">
                                                            <p
                                                                class="text-xs font-semibold px-2 mb-2 text-muted-foreground"
                                                            >
                                                                Pilih Varian {product.name}
                                                            </p>
                                                            {#each product.variants.slice(2) as v}
                                                                <button
                                                                    class="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent text-left text-xs"
                                                                    onclick={() =>
                                                                        addToCart(
                                                                            product,
                                                                            v,
                                                                        )}
                                                                >
                                                                    <span
                                                                        >{v.name}
                                                                        ({v.stock})</span
                                                                    >
                                                                    <span
                                                                        class="font-bold"
                                                                        >{formatCurrency(
                                                                            v.price,
                                                                        )}</span
                                                                    >
                                                                </button>
                                                            {/each}
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Root>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <!-- Right: Cart & Checkout (Desktop) -->
    <div
        class="hidden lg:flex w-[400px] flex-col border-l bg-background/95 backdrop-blur shadow-2xl z-30 relative"
    >
        {@render cartContent()}
    </div>

    <!-- Mobile Cart Trigger -->
    <div class="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
            <SheetTrigger
                class="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-all flex items-center justify-center relative"
            >
                <ShoppingBag class="h-6 w-6" />
                {#if cart.length > 0}
                    <span
                        class="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm"
                    >
                        {cart.length}
                    </span>
                {/if}
            </SheetTrigger>
            <SheetContent
                side="right"
                class="w-full sm:w-[450px] p-0 flex flex-col h-full border-l shadow-2xl"
            >
                {@render cartContent()}
            </SheetContent>
        </Sheet>
    </div>

    <!-- Payment Dialog -->
    <Dialog bind:open={paymentOpen}>
        <DialogContent
            class="max-w-[800px] p-0 gap-0 overflow-hidden shadow-2xl sm:rounded-2xl border-0"
        >
            <div
                class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden"
            >
                <div
                    class="absolute inset-0 bg-white/10 pattern-dots opacity-20"
                ></div>
                <h2
                    class="text-2xl font-bold relative z-10 flex items-center justify-center gap-2"
                >
                    <CreditCard class="h-6 w-6" />
                    Checkout & Pembayaran
                </h2>
                <p class="text-blue-100 relative z-10 mt-1">
                    Selesaikan pembayaran untuk {cart.length} item
                </p>
            </div>

            <div
                class="flex-1 overflow-y-auto max-h-[70vh] p-6 bg-zinc-50/50 dark:bg-zinc-900/50"
            >
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Bill & Customer Info -->
                    <div class="space-y-6">
                        <div
                            class="bg-card rounded-xl border shadow-sm p-4 text-center"
                        >
                            <p
                                class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                            >
                                Total Tagihan
                            </p>
                            <div
                                class="text-4xl font-bold text-foreground mt-1 tracking-tight"
                            >
                                {formatCurrency(totalAmount)}
                            </div>
                        </div>

                        <div class="space-y-4">
                            <h3
                                class="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2"
                            >
                                <User class="h-4 w-4" /> Informasi Pelanggan
                            </h3>

                            <div class="space-y-3">
                                <div class="space-y-1.5">
                                    <Label class="text-xs"
                                        >Pilih Pelanggan</Label
                                    >
                                    <Popover.Root bind:open={customerOpen}>
                                        <Popover.Trigger
                                            class={cn(
                                                buttonVariants({
                                                    variant: "outline",
                                                }),
                                                "w-full justify-between bg-card",
                                            )}
                                            role="combobox"
                                            aria-expanded={customerOpen}
                                        >
                                            {#if selectedCustomerId}
                                                <span
                                                    class="font-medium text-foreground"
                                                    >{customerOptions.find(
                                                        (c) =>
                                                            c.value ===
                                                            selectedCustomerId,
                                                    )?.label}</span
                                                >
                                            {:else}
                                                <span
                                                    class="text-muted-foreground"
                                                    >Pilih / Cari Pelanggan...</span
                                                >
                                            {/if}
                                            <ChevronsUpDown
                                                class="ml-2 h-4 w-4 opacity-50"
                                            />
                                        </Popover.Trigger>
                                        <Popover.Content
                                            class="w-[300px] p-0"
                                            align="start"
                                        >
                                            <Command.Root>
                                                <Command.Input
                                                    placeholder="Cari nama..."
                                                />
                                                <Command.Empty
                                                    >Pelanggan tidak ditemukan.</Command.Empty
                                                >
                                                <Command.Group
                                                    class="max-h-[200px] overflow-y-auto"
                                                >
                                                    {#each customerOptions as customer}
                                                        <Command.Item
                                                            value={customer.label}
                                                            onSelect={() => {
                                                                selectedCustomerId =
                                                                    customer.value;
                                                                customerOpen = false;
                                                            }}
                                                        >
                                                            <Check
                                                                class={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCustomerId ===
                                                                        customer.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            {customer.label}
                                                        </Command.Item>
                                                    {/each}
                                                </Command.Group>
                                            </Command.Root>
                                        </Popover.Content>
                                    </Popover.Root>
                                </div>

                                {#if !selectedCustomerId}
                                    <div
                                        class="flex items-center gap-3 pl-3 border-l-2 border-blue-200 dark:border-blue-800"
                                    >
                                        <div class="flex-1 space-y-1.5">
                                            <Label
                                                class="text-xs text-muted-foreground"
                                                >Nama Manual (Walk-in)</Label
                                            >
                                            <Input
                                                placeholder="Nama Pelanggan / Guest"
                                                bind:value={customerNameManual}
                                                class="h-9 bg-card"
                                            />
                                        </div>
                                    </div>
                                {/if}

                                <div class="space-y-1.5 pt-2">
                                    <Label class="text-xs"
                                        >Catatan (Opsional)</Label
                                    >
                                    <Input
                                        placeholder="Invoice ref, keterangan..."
                                        bind:value={notes}
                                        class="h-9 bg-card"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="space-y-5">
                        <div
                            class="flex items-center justify-between border-b pb-2"
                        >
                            <h3
                                class="text-sm font-semibold flex items-center gap-2 text-muted-foreground"
                            >
                                <Wallet class="h-4 w-4" /> Metode Pembayaran
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onclick={addPaymentRow}
                                disabled={payments.length >= 2 ||
                                    (payments[0] &&
                                        getSelectedMethod(payments[0].methodId)
                                            ?.type === "cash") ||
                                    availableMethods.length === 0}
                            >
                                <Plus class="h-3 w-3 mr-1" /> Split Payment
                            </Button>
                        </div>

                        <div class="space-y-3">
                            {#if availableMethods.length === 0}
                                <div
                                    class="text-center p-6 bg-muted/30 rounded-lg text-sm text-muted-foreground"
                                >
                                    <div class="animate-pulse">
                                        Memuat metode pembayaran...
                                    </div>
                                </div>
                            {:else}
                                {#each payments as payment, i}
                                    {@const selectedMethod = getSelectedMethod(
                                        payment.methodId,
                                    )}
                                    <div
                                        class="p-3 border rounded-xl bg-card shadow-sm space-y-3 animate-in slide-in-from-right duration-300"
                                    >
                                        <div
                                            class="flex justify-between items-center text-xs text-muted-foreground"
                                        >
                                            <span
                                                class="font-bold uppercase tracking-wider"
                                                >Pembayaran #{i + 1}</span
                                            >
                                            {#if payments.length > 1}
                                                <button
                                                    class="text-red-500 hover:text-red-600 transition-colors"
                                                    onclick={() =>
                                                        removePaymentRow(i)}
                                                >
                                                    <X class="h-3.5 w-3.5" />
                                                </button>
                                            {/if}
                                        </div>

                                        <div class="grid gap-3">
                                            <Select
                                                type="single"
                                                value={payment.methodId}
                                                onValueChange={(val) =>
                                                    handleMethodChange(i, val)}
                                            >
                                                <SelectTrigger
                                                    class="bg-secondary/10 border-muted"
                                                >
                                                    <div
                                                        class="flex items-center gap-2"
                                                    >
                                                        {#if selectedMethod?.icon}
                                                            <span
                                                                class="text-lg"
                                                                >{selectedMethod.icon}</span
                                                            >
                                                        {/if}
                                                        <span class="truncate"
                                                            >{selectedMethod?.name ||
                                                                "Pilih Metode"}</span
                                                        >
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {#each availableMethods as method}
                                                        {#if (method.type !== "custom" && method.id !== "PM-TEMPO") || selectedCustomerId}
                                                            <SelectItem
                                                                value={method.id}
                                                                class="cursor-pointer"
                                                            >
                                                                <span
                                                                    class="mr-2"
                                                                    >{method.icon}</span
                                                                >
                                                                {method.name}
                                                            </SelectItem>
                                                        {/if}
                                                    {/each}
                                                </SelectContent>
                                            </Select>

                                            {#if selectedMethod?.variants && selectedMethod.variants.length > 0}
                                                <Select
                                                    type="single"
                                                    value={payment.variantId}
                                                    onValueChange={(val) =>
                                                        handleVariantChange(
                                                            i,
                                                            val,
                                                        )}
                                                >
                                                    <SelectTrigger
                                                        class="bg-secondary/10 border-muted border-dashed"
                                                    >
                                                        <span
                                                            >{selectedMethod.variants.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    payment.variantId,
                                                            )?.name ||
                                                                "Pilih Bank / Akun"}</span
                                                        >
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {#each selectedMethod.variants as variant}
                                                            <SelectItem
                                                                value={variant.id}
                                                            >
                                                                {variant.name}
                                                                {variant.accountNumber
                                                                    ? `(${variant.accountNumber})`
                                                                    : ""}
                                                            </SelectItem>
                                                        {/each}
                                                    </SelectContent>
                                                </Select>
                                            {/if}

                                            <div class="relative">
                                                <div
                                                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground font-semibold"
                                                >
                                                    Rp
                                                </div>
                                                <CurrencyInput
                                                    class="pl-10 text-right font-mono font-bold text-lg h-11 bg-secondary/10 border-muted focus:border-blue-500 transition-colors"
                                                    bind:value={payment.amount}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>

                        <!-- Summary Calculation -->
                        <div
                            class="bg-muted/40 p-4 rounded-xl space-y-2 text-sm border"
                        >
                            <div
                                class="flex justify-between text-muted-foreground"
                            >
                                <span>Total Dibayar</span>
                                <span class="font-medium text-foreground"
                                    >{formatCurrency(totalPaid)}</span
                                >
                            </div>
                            <Separator class="bg-border/50" />
                            {#if remaining > 0}
                                <div
                                    class="flex justify-between items-center text-red-600 font-bold text-lg"
                                >
                                    <span>Kurang</span>
                                    <span>{formatCurrency(remaining)}</span>
                                </div>
                            {:else}
                                <div
                                    class="flex justify-between items-center text-green-600 font-bold text-lg"
                                >
                                    <span>Kembalian</span>
                                    <span>{formatCurrency(change)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter class="p-4 border-t bg-background">
                <Button
                    variant="outline"
                    onclick={() => (paymentOpen = false)}
                    disabled={loading}
                    class="w-full sm:w-auto"
                >
                    Batal
                </Button>
                <Button
                    onclick={processCheckout}
                    disabled={loading || remaining > 0}
                    class="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                >
                    {#if loading}
                        <div
                            class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                        ></div>
                        Memproses...
                    {:else}
                        Konfirmasi Pembayaran
                    {/if}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>

{#snippet cartContent()}
    <div class="flex flex-col h-full">
        <!-- Cart Header -->
        <div
            class="p-5 border-b bg-background/95 backdrop-blur z-10 flex-shrink-0 flex items-center justify-between"
        >
            <div>
                <h2
                    class="font-bold text-lg flex items-center gap-2 text-foreground"
                >
                    <ShoppingBag class="h-5 w-5 text-blue-600" /> Current Order
                </h2>
                <p class="text-xs text-muted-foreground mt-0.5">
                    {cart.length} items added
                </p>
            </div>

            {#if cart.length > 0}
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onclick={() => (cart = [])}
                    title="Hapus Semua"
                >
                    <Trash2 class="h-4 w-4" />
                </Button>
            {/if}
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {#if cart.length === 0}
                <div
                    class="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-60"
                >
                    <div
                        class="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4"
                    >
                        <ShoppingBag class="h-8 w-8 opacity-40" />
                    </div>
                    <p class="font-medium">Keranjang Kosong</p>
                    <p class="text-xs mt-1">
                        Pilih produk dari katalog untuk memulai pesanan.
                    </p>
                </div>
            {:else}
                {#each cart as item, i (item.uniqueId)}
                    <div
                        class="group bg-background p-3 rounded-xl border shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 flex flex-col gap-2 relative animate-in slide-in-from-right-2 duration-300"
                    >
                        <div class="flex justify-between items-start gap-3">
                            <div class="min-w-0">
                                <h4
                                    class="font-semibold text-sm leading-tight text-foreground"
                                >
                                    {item.name}
                                </h4>
                                <div class="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="secondary"
                                        class="h-4 px-1 text-[10px] font-normal bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        >{item.variant}</Badge
                                    >
                                    {#if item.code}
                                        <span
                                            class="text-[10px] text-muted-foreground font-mono"
                                            >{item.code}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            <div class="font-bold text-sm text-right">
                                {formatCurrency(item.price * item.qty)}
                            </div>
                        </div>

                        <div
                            class="flex items-center justify-between pt-1 border-t border-dashed mt-1"
                        >
                            <div class="text-[10px] text-muted-foreground">
                                @ {formatCurrency(item.price)}
                            </div>
                            <div
                                class="flex items-center bg-secondary/30 rounded-lg p-0.5"
                            >
                                <button
                                    class="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background text-foreground transition-colors active:scale-95 disabled:opacity-50"
                                    onclick={() => updateQty(i, -1)}
                                >
                                    <Minus class="h-3 w-3" />
                                </button>
                                <span
                                    class="w-8 text-center text-xs font-semibold tabular-nums"
                                    >{item.qty}</span
                                >
                                <button
                                    class="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background text-foreground transition-colors active:scale-95 disabled:opacity-50"
                                    onclick={() => updateQty(i, 1)}
                                    disabled={item.qty >= item.maxQty}
                                >
                                    <Plus class="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <!-- Cart Footer -->
        <div
            class="p-5 bg-background border-t shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] z-20 space-y-4"
        >
            <div class="space-y-2">
                <div class="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div class="flex justify-between items-end">
                    <span class="font-bold text-base">Total Tagihan</span>
                    <span class="font-bold text-xl text-blue-600"
                        >{formatCurrency(totalAmount)}</span
                    >
                </div>
            </div>

            <Button
                size="lg"
                class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                disabled={cart.length === 0}
                onclick={openCheckout}
            >
                <CreditCard class="mr-2 h-4 w-4" />
                Bayar Sekarang
            </Button>
        </div>
    </div>
{/snippet}
