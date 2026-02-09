<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Trash2, Save, Loader2 } from "lucide-svelte";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();
</script>

<Card>
    <CardHeader>
        <CardTitle>Profil Toko</CardTitle>
        <CardDescription>
            Informasi ini akan ditampilkan pada nota dan laporan.
        </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
                <Label for="storeName">Nama Toko</Label>
                <Input
                    id="storeName"
                    bind:value={controller.storeInfo.name}
                    placeholder="Nama toko Anda"
                />
            </div>
            <div class="space-y-2">
                <Label for="storePhone">Nomor Telepon / WA</Label>
                <Input
                    id="storePhone"
                    bind:value={controller.storeInfo.phone}
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                />
            </div>
        </div>
        <div class="space-y-2">
            <Label for="storeAddress">Alamat Lengkap</Label>
            <Textarea
                id="storeAddress"
                bind:value={controller.storeInfo.address}
                rows={2}
                placeholder="Jl. Contoh No. 123, Kota"
            />
        </div>
        <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
                <Label for="storeEmail">Email (Opsional)</Label>
                <Input
                    id="storeEmail"
                    bind:value={controller.storeInfo.email}
                    type="email"
                    placeholder="toko@email.com"
                />
            </div>
            <div class="space-y-2">
                <Label for="storeSocial">Social Media (Opsional)</Label>
                <Input
                    id="storeSocial"
                    bind:value={controller.storeInfo.socialMedia}
                    placeholder="@instagram_toko"
                />
            </div>
        </div>
        <div class="space-y-2">
            <Label for="storeLogo">Logo Toko</Label>
            <div class="flex items-center gap-4">
                {#if controller.storeInfo.logo}
                    <div
                        class="relative w-20 h-20 border rounded overflow-hidden"
                    >
                        <img
                            src={controller.storeInfo.logo}
                            alt="Store Logo"
                            class="w-full h-full object-contain"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            class="absolute top-0 right-0 h-5 w-5 rounded-full"
                            onclick={() => (controller.storeInfo.logo = "")}
                        >
                            <Trash2 class="h-3 w-3" />
                        </Button>
                    </div>
                {/if}
                <Input
                    id="storeLogo"
                    type="file"
                    accept="image/*"
                    onchange={(e) => controller.handleLogoUpload(e)}
                />
            </div>
        </div>
    </CardContent>
    <CardFooter>
        <Button
            onclick={() => controller.saveStoreInfo()}
            disabled={controller.saving}
        >
            {#if controller.saving}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {:else}
                <Save class="mr-2 h-4 w-4" />
            {/if}
            Simpan Perubahan
        </Button>
    </CardFooter>
</Card>
