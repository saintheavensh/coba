<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { User, Phone, MapPin } from "lucide-svelte";
    import type { ServiceFormStore } from "../form.svelte";
    import { Badge } from "$lib/components/ui/badge";

    let { form }: { form: ServiceFormStore } = $props();
</script>

<div class="grid gap-6 animate-in slide-in-from-right-4 duration-500">
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <User class="h-5 w-5 text-primary" />
            Informasi Pelanggan
        </h3>
        <p class="text-sm text-muted-foreground">
            Lengkapi data diri pelanggan untuk keperluan administrasi dan
            komunikasi.
        </p>
    </div>

    <div
        class="grid gap-6 p-6 sm:p-8 border border-muted/60 rounded-3xl bg-card/50 shadow-sm relative overflow-hidden group"
    >
        <!-- Glow Effect -->
        <div
            class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity opacity-0 group-hover:opacity-100"
        ></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
                <Label
                    for="name"
                    class="flex items-center gap-2 text-sm font-semibold text-foreground/80"
                >
                    Nama Lengkap <span class="text-red-500">*</span>
                </Label>
                <div class="relative group/input">
                    <div
                        class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
                    >
                        <User
                            class="h-4 w-4 text-muted-foreground transition-colors group-focus-within/input:text-primary"
                        />
                    </div>
                    <Input
                        id="name"
                        bind:value={form.customerName}
                        placeholder="Contoh: Budi Santoso"
                        class="pl-10 h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus:bg-background transition-all focus:ring-4 focus:ring-primary/10"
                    />
                </div>
            </div>

            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <Label
                        for="phone"
                        class="flex items-center gap-2 text-sm font-semibold text-foreground/80"
                    >
                        No. Telepon / WA
                        {#if !form.isWalkin}<span class="text-red-500">*</span
                            >{/if}
                    </Label>
                    {#if form.isWalkin}
                        <Badge
                            variant="secondary"
                            class="text-[10px] h-5 px-2 font-normal text-muted-foreground"
                            >Opsional (Walk-in)</Badge
                        >
                    {/if}
                </div>
                <div class="relative group/input">
                    <div
                        class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
                    >
                        <Phone
                            class="h-4 w-4 text-muted-foreground transition-colors group-focus-within/input:text-primary"
                        />
                    </div>
                    <Input
                        id="phone"
                        type="tel"
                        bind:value={form.customerPhone}
                        placeholder="0812-3456-7890"
                        class="pl-10 h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus:bg-background transition-all focus:ring-4 focus:ring-primary/10"
                    />
                </div>
            </div>
        </div>

        <div class="space-y-3 pt-2">
            <Label
                for="address"
                class="flex items-center gap-2 text-sm font-semibold text-foreground/80"
            >
                Alamat {#if form.isWalkin}<span
                        class="text-muted-foreground font-normal text-xs"
                        >(Opsional)</span
                    >{/if}
            </Label>
            <div class="relative group/input">
                <div
                    class="absolute top-3.5 left-3 flex items-start pointer-events-none"
                >
                    <MapPin
                        class="h-4 w-4 text-muted-foreground transition-colors group-focus-within/input:text-primary"
                    />
                </div>
                <Textarea
                    id="address"
                    bind:value={form.customerAddress}
                    placeholder="Jl. Merdeka No. 45, Jakarta..."
                    rows={3}
                    disabled={form.isWalkin}
                    class="pl-10 min-h-[100px] rounded-2xl bg-background/50 border-muted-foreground/20 focus:bg-background transition-all focus:ring-4 focus:ring-primary/10 resize-none"
                />
            </div>
        </div>
    </div>
</div>
