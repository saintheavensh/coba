<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        SettingsService,
        type StoreInfo,
    } from "$lib/services/settings.service";
    import { settingsStore } from "$lib/stores/settings-store.svelte";
    import { toast } from "svelte-sonner";
    import { Loader2, Save, Trash2, Store } from "lucide-svelte";
    import { onMount } from "svelte";
    import { useQueryClient } from "@tanstack/svelte-query";

    const queryClient = useQueryClient();

    let storeInfo = $state<StoreInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
        logo: "",
        socialMedia: "",
    });

    let saving = $state(false);
    let loading = $state(true);

    onMount(async () => {
        try {
            const data = await SettingsService.getStoreInfo();
            storeInfo = {
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || "",
                logo: data.logo || "",
                socialMedia: data.socialMedia || "",
            };
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat informasi toko");
        } finally {
            loading = false;
        }
    });

    async function saveStoreInfo() {
        saving = true;
        try {
            await SettingsService.setStoreInfo(storeInfo);
            toast.success("Informasi toko berhasil disimpan");

            // Refresh global store to update sidebar immediately
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan informasi toko");
        } finally {
            saving = false;
        }
    }

    function handleLogoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                storeInfo.logo = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }
</script>

<div class="space-y-6 max-w-3xl mx-auto py-8">
    <div>
        <h3 class="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store class="h-6 w-6" /> Informasi Toko
        </h3>
        <p class="text-muted-foreground">
            Informasi ini akan ditampilkan pada sidebar aplikasi, nota, dan
            laporan.
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Profil Toko</CardTitle>
            <CardDescription>
                Lengkapi identitas toko Anda di sini.
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
            {#if loading}
                <div class="flex justify-center py-8">
                    <Loader2
                        class="h-8 w-8 animate-spin text-muted-foreground"
                    />
                </div>
            {:else}
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="storeName">Nama Toko *</Label>
                        <Input
                            id="storeName"
                            bind:value={storeInfo.name}
                            placeholder="Contoh: Saint Heavens Cell"
                        />
                        <p class="text-xs text-muted-foreground">
                            Nama ini akan muncul di sidebar aplikasi.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <Label for="storePhone">Nomor Telepon / WA *</Label>
                        <Input
                            id="storePhone"
                            bind:value={storeInfo.phone}
                            type="tel"
                            placeholder="0812-xxxx-xxxx"
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="storeAddress">Alamat Lengkap</Label>
                    <Textarea
                        id="storeAddress"
                        bind:value={storeInfo.address}
                        rows={3}
                        placeholder="Jl. Contoh No. 123, Kecamatan, Kota"
                    />
                </div>
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="storeEmail">Email (Opsional)</Label>
                        <Input
                            id="storeEmail"
                            bind:value={storeInfo.email}
                            type="email"
                            placeholder="toko@email.com"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="storeSocial">Social Media (Opsional)</Label>
                        <Input
                            id="storeSocial"
                            bind:value={storeInfo.socialMedia}
                            placeholder="@instagram_toko"
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="storeLogo">Logo Toko</Label>
                    <div class="flex items-start gap-6">
                        <div class="space-y-3">
                            {#if storeInfo.logo}
                                <div
                                    class="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center"
                                >
                                    <img
                                        src={storeInfo.logo}
                                        alt="Store Logo"
                                        class="w-full h-full object-contain p-2"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        class="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                        onclick={() => (storeInfo.logo = "")}
                                    >
                                        <Trash2 class="h-3 w-3" />
                                    </Button>
                                </div>
                            {:else}
                                <div
                                    class="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/10 text-muted-foreground"
                                >
                                    <Store class="h-8 w-8 opacity-20" />
                                </div>
                            {/if}
                        </div>
                        <div class="space-y-2 flex-1">
                            <Input
                                id="storeLogo"
                                type="file"
                                accept="image/*"
                                onchange={handleLogoUpload}
                            />
                            <p class="text-xs text-muted-foreground">
                                Upload logo toko (PNG/JPG). Logo ini akan
                                menggantikan icon default di sidebar dan muncul
                                di nota.
                            </p>
                        </div>
                    </div>
                </div>
            {/if}
        </CardContent>
        <CardFooter class="flex justify-end">
            <Button
                onclick={saveStoreInfo}
                disabled={saving || loading}
                size="lg"
            >
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </CardFooter>
    </Card>
</div>
