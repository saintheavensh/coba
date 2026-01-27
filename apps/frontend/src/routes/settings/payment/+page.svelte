<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { Switch } from "$lib/components/ui/switch";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Plus,
        Trash2,
        CreditCard,
        MinusCircle,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        PaymentMethodsService,
        PAYMENT_ICONS,
        PAYMENT_TYPES,
        type PaymentMethod,
    } from "$lib/services/settings.service";

    let paymentMethods = $state<PaymentMethod[]>([]);
    let loading = $state(true);
    let showAddMethod = $state(false);
    let saving = $state(false);

    let newMethod = $state({
        name: "",
        icon: "💳",
        type: "custom" as const,
    });

    let newVariantByMethod = $state<
        Record<
            string,
            { name: string; accountNumber: string; accountHolder: string }
        >
    >({});

    async function loadPaymentMethods() {
        loading = true;
        try {
            paymentMethods = await PaymentMethodsService.getAll();
        } catch (e) {
            toast.error("Gagal memuat metode pembayaran");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadPaymentMethods();
    });

    async function addPaymentMethod() {
        if (!newMethod.name) return;
        saving = true;
        try {
            await PaymentMethodsService.create({
                name: newMethod.name,
                type: newMethod.type,
                icon: newMethod.icon,
            });
            await loadPaymentMethods();
            newMethod = { name: "", icon: "💳", type: "custom" };
            showAddMethod = false;
            toast.success("Metode pembayaran berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah metode pembayaran");
        } finally {
            saving = false;
        }
    }

    async function togglePaymentMethod(id: string, enabled: boolean) {
        // Optimistic update
        const idx = paymentMethods.findIndex((p) => p.id === id);
        if (idx !== -1) paymentMethods[idx].enabled = enabled;

        try {
            await PaymentMethodsService.update(id, { enabled });
        } catch (e) {
            toast.error("Gagal mengubah status metode");
            if (idx !== -1) paymentMethods[idx].enabled = !enabled; // Revert
        }
    }

    async function removePaymentMethod(id: string) {
        if (!confirm("Nonaktifkan pembayaran ini?")) return;
        try {
            await PaymentMethodsService.disable(id);
            await loadPaymentMethods();
            toast.success("Metode pembayaran dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan metode");
        }
    }

    function getNewVariant(methodId: string) {
        if (!newVariantByMethod[methodId]) {
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
        }
        return newVariantByMethod[methodId];
    }

    async function addVariant(methodId: string) {
        const variant = newVariantByMethod[methodId];
        if (!variant?.name) return;

        try {
            await PaymentMethodsService.addVariant(methodId, {
                name: variant.name,
                accountNumber: variant.accountNumber || undefined,
                accountHolder: variant.accountHolder || undefined,
            });
            await loadPaymentMethods();
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
            toast.success("Varian berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah varian: " + String(e));
        }
    }

    async function removeVariant(methodId: string, variantId: string) {
        if (!confirm("Hapus varian ini?")) return;
        try {
            await PaymentMethodsService.disableVariant(methodId, variantId);
            await loadPaymentMethods();
            toast.success("Varian dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan varian");
        }
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto py-6">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold tracking-tight">Metode Pembayaran</h3>
            <p class="text-muted-foreground">
                Kelola metode pembayaran yang diterima (Cash, Transfer,
                E-Wallet).
            </p>
        </div>
        <Button onclick={() => (showAddMethod = true)}>
            <Plus class="h-4 w-4 mr-2" /> Tambah Manual
        </Button>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    {:else if paymentMethods.length === 0}
        <div class="text-center py-12 border-2 border-dashed rounded-lg">
            <CreditCard class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-medium">Belum ada metode pembayaran</h3>
            <p class="text-muted-foreground mb-4">
                Tambahkan metode pembayaran pertama Anda.
            </p>
            <Button onclick={() => (showAddMethod = true)}
                >Tambah Sekarang</Button
            >
        </div>
    {:else}
        <div class="grid gap-6">
            {#each paymentMethods as method (method.id)}
                <Card class={!method.enabled ? "opacity-60 bg-muted/30" : ""}>
                    <CardContent class="p-6">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-4">
                                <div class="text-4xl">{method.icon}</div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4 class="font-bold text-lg">
                                            {method.name}
                                        </h4>
                                        <Badge
                                            variant="outline"
                                            class="text-xs uppercase"
                                            >{method.type}</Badge
                                        >
                                    </div>
                                    {#if !method.enabled}
                                        <Badge
                                            variant="destructive"
                                            class="mt-1">Nonaktif</Badge
                                        >
                                    {/if}
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Label
                                    class="text-xs font-normal text-muted-foreground mr-2"
                                    >Status Aktif</Label
                                >
                                <Switch
                                    checked={method.enabled}
                                    onCheckedChange={(c) =>
                                        togglePaymentMethod(method.id, c)}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-muted-foreground hover:text-destructive ml-2"
                                    onclick={() =>
                                        removePaymentMethod(method.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {#if method.type !== "cash" && method.enabled}
                            <Separator class="my-4" />
                            <div class="pl-14 space-y-4">
                                <h5
                                    class="text-sm font-medium text-muted-foreground"
                                >
                                    Daftar Akun / Varian:
                                </h5>

                                <div class="grid gap-3">
                                    {#if method.variants && method.variants.length > 0}
                                        {#each method.variants.filter((v) => v.enabled) as variant}
                                            <div
                                                class="flex items-center justify-between p-3 bg-muted/40 rounded-md border text-sm group hover:bg-muted/60 transition-colors"
                                            >
                                                <div
                                                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                                                >
                                                    <span class="font-bold"
                                                        >{variant.name}</span
                                                    >
                                                    {#if variant.accountNumber}
                                                        <span
                                                            class="font-mono bg-background px-2 py-0.5 rounded text-xs border"
                                                            >{variant.accountNumber}</span
                                                        >
                                                    {/if}
                                                    {#if variant.accountHolder}
                                                        <span
                                                            class="text-muted-foreground text-xs"
                                                            >a.n {variant.accountHolder}</span
                                                        >
                                                    {/if}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onclick={() =>
                                                        removeVariant(
                                                            method.id,
                                                            variant.id,
                                                        )}
                                                >
                                                    <MinusCircle
                                                        class="h-4 w-4"
                                                    />
                                                </Button>
                                            </div>
                                        {/each}
                                    {:else}
                                        <p
                                            class="text-sm text-muted-foreground italic"
                                        >
                                            Belum ada akun terdaftar untuk {method.name}.
                                        </p>
                                    {/if}

                                    <!-- Add Variant Form -->
                                    <div
                                        class="flex flex-col md:flex-row gap-2 items-start md:items-center mt-2 p-3 bg-muted/10 rounded-md border border-dashed"
                                    >
                                        <div
                                            class="grid grid-cols-1 md:grid-cols-3 gap-2 w-full"
                                        >
                                            <Input
                                                placeholder="Nama (Misal: BCA Utama)"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.name || ""}
                                                oninput={(e) => {
                                                    const val =
                                                        e.currentTarget.value;
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].name = val;
                                                }}
                                            />
                                            <Input
                                                placeholder="No. Rekening (Opsional)"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.accountNumber || ""}
                                                oninput={(e) => {
                                                    const val =
                                                        e.currentTarget.value;
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].accountNumber = val;
                                                }}
                                            />
                                            <Input
                                                placeholder="Atas Nama (Opsional)"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.accountHolder || ""}
                                                oninput={(e) => {
                                                    const val =
                                                        e.currentTarget.value;
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].accountHolder = val;
                                                }}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onclick={() =>
                                                addVariant(method.id)}
                                        >
                                            <Plus class="h-4 w-4 mr-2" /> Tambah
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            {/each}
        </div>
    {/if}

    <!-- Add Method Dialog -->
    <Dialog bind:open={showAddMethod}>
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Tambah Metode Pembayaran Baru</DialogTitle>
                <DialogDescription>
                    Pilih tipe dan ikon untuk metode pembayaran ini.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label>Nama Metode</Label>
                    <Input
                        bind:value={newMethod.name}
                        placeholder="Contoh: SeaBank, ShopeePay"
                    />
                </div>
                <div class="space-y-2">
                    <Label>Kategori</Label>
                    <Select type="single" bind:value={newMethod.type}>
                        <SelectTrigger>
                            {PAYMENT_TYPES.find((t) => t.id === newMethod.type)
                                ?.label || "Pilih Tipe"}
                        </SelectTrigger>
                        <SelectContent>
                            {#each PAYMENT_TYPES as type}
                                <SelectItem value={type.id}
                                    >{type.label}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Pilih Ikon</Label>
                    <div
                        class="flex flex-wrap gap-2 p-4 border rounded-md bg-muted/20 justify-center"
                    >
                        {#each PAYMENT_ICONS as icon}
                            <button
                                type="button"
                                class="text-2xl p-3 rounded-lg hover:bg-background hover:shadow-sm border transition-all {newMethod.icon ===
                                icon.icon
                                    ? 'bg-background border-primary shadow-md scale-110'
                                    : 'border-transparent'}"
                                onclick={() => (newMethod.icon = icon.icon)}
                                title={icon.label}
                            >
                                {icon.icon}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (showAddMethod = false)}>Batal</Button
                >
                <Button
                    onclick={addPaymentMethod}
                    disabled={saving || !newMethod.name}>Simpan</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
