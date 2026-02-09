<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { MessageCircle, Save, Loader2 } from "lucide-svelte";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();
</script>

<Card>
    <CardHeader>
        <CardTitle>Integrasi WhatsApp</CardTitle>
        <CardDescription>
            Kirim notifikasi otomatis ke customer via WhatsApp.
        </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
        <div class="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <Label>Aktifkan WhatsApp Gateway</Label>
                <p class="text-xs text-muted-foreground">
                    Perlu koneksi ke WA Gateway server
                </p>
            </div>
            <Switch bind:checked={controller.whatsappSettings.enabled} />
        </div>

        {#if controller.whatsappSettings.enabled}
            <div class="space-y-2">
                <Label>Nomor WhatsApp Pengirim</Label>
                <Input
                    bind:value={controller.whatsappSettings.phoneNumber}
                    placeholder="6281234567890"
                />
            </div>

            <div class="space-y-4 pt-4 border-t">
                <h4 class="font-medium flex items-center gap-2">
                    <MessageCircle class="h-4 w-4" /> Template Pesan
                </h4>

                <div class="space-y-3">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label>Service Baru Diterima</Label>
                            <Switch
                                bind:checked={
                                    controller.whatsappSettings
                                        .autoSendOnNewService
                                }
                            />
                        </div>
                        <Textarea
                            bind:value={
                                controller.whatsappSettings.newServiceTemplate
                            }
                            rows={3}
                            placeholder="Halo {customer}, service {device} Anda telah kami terima dengan no {ticket}. Terima kasih."
                        />
                        <p class="text-[10px] text-muted-foreground">
                            Variabel: {"{customer}"}, {"{device}"}, {"{ticket}"},
                            {"{keluhan}"}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label>Update Status Service</Label>
                            <Switch
                                bind:checked={
                                    controller.whatsappSettings
                                        .autoSendOnStatusChange
                                }
                            />
                        </div>
                        <Textarea
                            bind:value={
                                controller.whatsappSettings.statusUpdateTemplate
                            }
                            rows={3}
                            placeholder="Halo {customer}, status service {device} Anda saat ini: {status}."
                        />
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label>Service Selesai (Siap Ambil)</Label>
                            <Switch
                                bind:checked={
                                    controller.whatsappSettings
                                        .autoSendOnComplete
                                }
                            />
                        </div>
                        <Textarea
                            bind:value={
                                controller.whatsappSettings
                                    .readyForPickupTemplate
                            }
                            rows={3}
                            placeholder="Halo {customer}, service {device} Anda sudah SELESAI dan bisa diambil. Total: {total}."
                        />
                    </div>
                </div>
            </div>
        {/if}
    </CardContent>
    <CardFooter>
        <Button
            onclick={() => controller.saveWhatsAppSettings()}
            disabled={controller.saving}
        >
            {#if controller.saving}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {:else}
                <Save class="mr-2 h-4 w-4" />
            {/if}
            Simpan Pengaturan
        </Button>
    </CardFooter>
</Card>
