<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Plus, Trash2, Loader2, MinusCircle } from "lucide-svelte";
    import {
        PAYMENT_ICONS,
        PAYMENT_TYPES,
    } from "$lib/features/settings/settings.service";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();
</script>

<Card>
    <CardHeader>
        <div class="flex items-center justify-between">
            <div>
                <CardTitle>Metode Pembayaran</CardTitle>
                <CardDescription>
                    Kelola metode pembayaran yang diterima.
                </CardDescription>
            </div>
            <Button
                variant="outline"
                size="sm"
                onclick={() => (controller.showAddMethod = true)}
            >
                <Plus class="mr-2 h-4 w-4" /> Tambah Metode
            </Button>
        </div>
    </CardHeader>
    <CardContent class="grid gap-4">
        {#if controller.paymentMethodsQuery.isLoading}
            <div class="flex justify-center p-4">
                <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        {:else if controller.paymentMethodsQuery.isError}
            <div class="p-4 text-center text-red-500 bg-red-50 rounded">
                Gagal memuat metode pembayaran
            </div>
        {:else if controller.paymentMethods.length === 0}
            <div
                class="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg"
            >
                Belum ada metode pembayaran. Tambahkan sekarang.
            </div>
        {:else}
            {#each controller.paymentMethods as method (method.id)}
                <div class="border rounded-lg p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl"
                            >
                                {method.icon || "💳"}
                            </div>
                            <div>
                                <div
                                    class="font-medium flex items-center gap-2"
                                >
                                    {method.name}
                                    <Badge variant="outline" class="text-[10px]"
                                        >{method.type}</Badge
                                    >
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    {method.variants?.length || 0} opsi pembayaran
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Switch
                                checked={method.enabled}
                                onCheckedChange={(checked) =>
                                    controller.togglePaymentMethod(
                                        method.id,
                                        checked,
                                    )}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onclick={() =>
                                    controller.removePaymentMethod(method.id)}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <!-- Variants Section -->
                    <div class="pl-12 pt-2 border-t mt-2">
                        <div class="space-y-2">
                            {#each method.variants || [] as variant (variant.id)}
                                <div
                                    class="flex items-center justify-between text-sm bg-muted/30 p-2 rounded"
                                >
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1"
                                    >
                                        <div class="font-medium">
                                            {variant.name}
                                        </div>
                                        {#if variant.accountNumber}
                                            <div
                                                class="text-muted-foreground flex items-center gap-1"
                                            >
                                                <span class="text-[10px]"
                                                    >No:</span
                                                >
                                                {variant.accountNumber}
                                            </div>
                                        {/if}
                                        {#if variant.accountHolder}
                                            <div
                                                class="text-muted-foreground flex items-center gap-1"
                                            >
                                                <span class="text-[10px]"
                                                    >An:</span
                                                >
                                                {variant.accountHolder}
                                            </div>
                                        {/if}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-6 w-6 text-red-500"
                                        onclick={() =>
                                            controller.removeVariant(
                                                method.id,
                                                variant.id!,
                                            )}
                                    >
                                        <MinusCircle class="h-3 w-3" />
                                    </Button>
                                </div>
                            {/each}

                            <!-- Add Variant Form -->
                            <div class="flex flex-wrap items-end gap-2 pt-2">
                                <div class="flex-1 min-w-[120px]">
                                    <Input
                                        placeholder="Nama (Mis. BCA, GoPay)"
                                        class="h-8 text-xs"
                                        bind:value={
                                            controller.getNewVariant(method.id)
                                                .name
                                        }
                                    />
                                </div>
                                <div class="flex-1 min-w-[120px]">
                                    <Input
                                        placeholder="No. Rek/HP (Opsional)"
                                        class="h-8 text-xs"
                                        bind:value={
                                            controller.getNewVariant(method.id)
                                                .accountNumber
                                        }
                                    />
                                </div>
                                <div class="flex-1 min-w-[120px]">
                                    <Input
                                        placeholder="A.n (Opsional)"
                                        class="h-8 text-xs"
                                        bind:value={
                                            controller.getNewVariant(method.id)
                                                .accountHolder
                                        }
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    class="h-8"
                                    disabled={controller.saving}
                                    onclick={() =>
                                        controller.addVariant(method.id)}
                                >
                                    {controller.saving ? "..." : "Tambah"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </CardContent>
</Card>

<!-- Add Payment Method Dialog -->
<Dialog
    bind:open={controller.showAddMethod}
    onOpenChange={(open) => {
        controller.showAddMethod = open;
    }}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
            <DialogDescription>
                Buat kategori pembayaran baru (Contoh: Transfer Bank, E-Wallet).
            </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Nama</Label>
                <Input
                    bind:value={controller.newMethod.name}
                    placeholder="Contoh: Transfer Bank"
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Tipe</Label>
                <Select type="single" bind:value={controller.newMethod.type}>
                    <SelectTrigger class="col-span-3">
                        {PAYMENT_TYPES.find(
                            (t) => t.id === controller.newMethod.type,
                        )?.label}
                    </SelectTrigger>
                    <SelectContent>
                        {#each PAYMENT_TYPES as type}
                            <SelectItem value={type.id}>{type.label}</SelectItem
                            >
                        {/each}
                    </SelectContent>
                </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Ikon</Label>
                <div class="col-span-3 flex gap-2 flex-wrap">
                    {#each PAYMENT_ICONS as icon}
                        <button
                            class="h-10 w-10 border rounded flex items-center justify-center text-xl hover:bg-muted {controller
                                .newMethod.icon === icon
                                ? 'ring-2 ring-primary border-primary'
                                : ''}"
                            onclick={() => (controller.newMethod.icon = icon)}
                        >
                            {icon}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.showAddMethod = false)}
            >
                Batal
            </Button>
            <Button
                onclick={() => controller.addPaymentMethod()}
                disabled={controller.saving}
            >
                {#if controller.saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Simpan
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
