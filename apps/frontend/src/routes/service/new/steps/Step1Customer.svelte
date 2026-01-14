<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { User, Phone, MapPin } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";

    let { form }: { form: ServiceFormStore } = $props();
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <User class="h-5 w-5 text-primary" />
            Informasi Pelanggan
        </h3>
        <p class="text-sm text-muted-foreground">
            Lengkapi data diri pelanggan untuk keperluan administrasi dan komunikasi.
        </p>
    </div>

    <div class="grid gap-4 p-4 border rounded-xl bg-card/50 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="name" class="flex items-center gap-2">
                    Nama Lengkap <span class="text-red-500">*</span>
                </Label>
                <div class="relative">
                    <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="name"
                        bind:value={form.customerName}
                        placeholder="Contoh: Budi Santoso"
                        class="pl-9"
                    />
                </div>
            </div>
            
            <div class="space-y-2">
                <Label for="phone" class="flex items-center gap-2">
                    No. Telepon / WA 
                    {#if !form.isWalkin}<span class="text-red-500">*</span>{/if}
                </Label>
                <div class="relative">
                    <Phone class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="phone"
                        type="tel"
                        bind:value={form.customerPhone}
                        placeholder="0812-3456-7890"
                        class="pl-9"
                    />
                </div>
                {#if form.isWalkin}
                    <p class="text-xs text-muted-foreground">
                        Opsional untuk walk-in customer (ditunggu)
                    </p>
                {/if}
            </div>
        </div>

        <div class="space-y-2">
            <Label for="address" class="flex items-center gap-2">
                Alamat {#if form.isWalkin}<span class="text-muted-foreground font-normal">(Opsional)</span>{/if}
            </Label>
            <div class="relative">
                <MapPin class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                    id="address"
                    bind:value={form.customerAddress}
                    placeholder="Jl. Merdeka No. 45, Jakarta"
                    rows={2}
                    disabled={form.isWalkin}
                    class="pl-9 min-h-[80px]"
                />
            </div>
        </div>
    </div>
</div>
