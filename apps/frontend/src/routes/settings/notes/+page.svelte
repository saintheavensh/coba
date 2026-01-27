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
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import { Loader2, Save, Receipt, Printer } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        SettingsService,
        type ReceiptSettings,
        type StoreInfo,
        PRINTER_TYPES,
        PAPER_SIZES,
    } from "$lib/services/settings.service";
    import { settingsStore } from "$lib/stores/settings-store.svelte";

    let settings = $state<ReceiptSettings>({
        showLogo: true,
        headerText: "",
        footerText: "",
        termsConditions: "",
        showCustomerPhone: true,
        showCustomerAddress: false,
        showImei: false,
        showSparepartDetails: false,
        showTechnicianName: true,
        showWarrantyInfo: true,
        showBarcode: false,
        printerType: "thermal",
        paperSize: "58mm",
        printCopies: 1,
    });

    let storeInfo = $state<StoreInfo>({
        name: "Store Name",
        address: "Store Address",
        phone: "000-000",
        logo: "",
        email: "",
        socialMedia: "",
    });

    let loading = $state(true);
    let saving = $state(false);

    let availablePaperSizes = $derived(
        PAPER_SIZES[settings.printerType as keyof typeof PAPER_SIZES] ||
            PAPER_SIZES.thermal,
    );

    // Track previous printer type to detect changes
    let previousPrinterType = $state<"thermal" | "inkjet" | "dotmatrix">(
        "thermal",
    );

    $effect(() => {
        if (settings.printerType !== previousPrinterType) {
            previousPrinterType = settings.printerType;
            const sizes =
                PAPER_SIZES[settings.printerType as keyof typeof PAPER_SIZES] ||
                PAPER_SIZES.thermal;
            if (sizes.length > 0) {
                settings.paperSize = sizes[0].id; // Reset to first available size
            }
        }
    });

    onMount(async () => {
        try {
            const [receiptData, storeData] = await Promise.all([
                SettingsService.getReceiptSettings(),
                SettingsService.getStoreInfo(),
            ]);
            if (receiptData) settings = receiptData;
            if (storeData) storeInfo = storeData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan");
        } finally {
            loading = false;
        }
    });

    async function save() {
        saving = true;
        try {
            await SettingsService.setReceiptSettings(settings);
            // Update global store
            await settingsStore.refresh();
            toast.success("Pengaturan nota berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto py-6">
    <div>
        <h3 class="text-2xl font-bold tracking-tight">
            Pengaturan Nota & Struk
        </h3>
        <p class="text-muted-foreground">
            Kustomisasi tampilan nota penjualan dan service sesuai kebutuhan
            toko Anda.
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Header & Footer</CardTitle>
            <CardDescription>
                Informasi yang ditampilkan di bagian atas dan bawah nota.
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
            <!-- Header Settings -->
            <div class="space-y-4">
                <h4 class="font-medium flex items-center gap-2">
                    <Receipt class="h-4 w-4" /> Header Nota
                </h4>
                <div class="grid gap-4 md:grid-cols-2">
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div>
                            <Label>Tampilkan Logo</Label>
                            <p class="text-xs text-muted-foreground">
                                Logo toko di bagian atas
                            </p>
                        </div>
                        <Switch bind:checked={settings.showLogo} />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label>Teks Header Tambahan</Label>
                    <Textarea
                        bind:value={settings.headerText}
                        placeholder="Teks tambahan di bawah nama toko"
                        rows={2}
                    />
                </div>
            </div>

            <Separator />

            <!-- Footer Settings -->
            <div class="space-y-4">
                <h4 class="font-medium">Footer Nota</h4>
                <div class="space-y-2">
                    <Label>Catatan Footer</Label>
                    <Textarea
                        bind:value={settings.footerText}
                        placeholder="Terima kasih atas kepercayaan Anda"
                        rows={2}
                    />
                </div>
                <div class="space-y-2">
                    <Label>Syarat & Ketentuan</Label>
                    <Textarea
                        bind:value={settings.termsConditions}
                        placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                        rows={2}
                    />
                </div>
            </div>

            <Separator />

            <!-- Display Options -->
            <div class="space-y-4">
                <h4 class="font-medium">Opsi Tampilan</h4>
                <div class="grid gap-3 md:grid-cols-2">
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <Label>Tampilkan No. HP Customer</Label>
                        <Switch bind:checked={settings.showCustomerPhone} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <Label>Tampilkan Alamat Customer</Label>
                        <Switch bind:checked={settings.showCustomerAddress} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <Label>Tampilkan IMEI</Label>
                        <Switch bind:checked={settings.showImei} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div>
                            <Label>Tampilkan Detail Sparepart</Label>
                            <p class="text-xs text-muted-foreground">
                                OFF = Hanya total
                            </p>
                        </div>
                        <Switch bind:checked={settings.showSparepartDetails} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <Label>Tampilkan Nama Teknisi</Label>
                        <Switch bind:checked={settings.showTechnicianName} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <Label>Tampilkan Info Garansi</Label>
                        <Switch bind:checked={settings.showWarrantyInfo} />
                    </div>
                    <div
                        class="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div>
                            <Label>Tampilkan QR Barcode</Label>
                            <p class="text-xs text-muted-foreground">
                                Untuk scanning cepat
                            </p>
                        </div>
                        <Switch bind:checked={settings.showBarcode} />
                    </div>
                </div>
            </div>

            <Separator />

            <!-- Printer Settings -->
            <div class="space-y-4">
                <h4 class="font-medium flex items-center gap-2">
                    <Printer class="h-4 w-4" /> Pengaturan Printer
                </h4>
                <div class="grid gap-4 md:grid-cols-3">
                    <div class="space-y-2">
                        <Label>Jenis Printer</Label>
                        <Select type="single" bind:value={settings.printerType}>
                            <SelectTrigger>
                                {PRINTER_TYPES.find(
                                    (p) => p.id === settings.printerType,
                                )?.label || "Pilih"}
                            </SelectTrigger>
                            <SelectContent>
                                {#each PRINTER_TYPES as pt}
                                    <SelectItem value={pt.id}
                                        >{pt.label}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Ukuran Kertas</Label>
                        <Select type="single" bind:value={settings.paperSize}>
                            <SelectTrigger>
                                {availablePaperSizes.find(
                                    (p) => p.id === settings.paperSize,
                                )?.label ||
                                    settings.paperSize ||
                                    "Pilih"}
                            </SelectTrigger>
                            <SelectContent>
                                {#each availablePaperSizes as ps}
                                    <SelectItem value={ps.id}
                                        >{ps.label}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label>Jumlah Cetak Default</Label>
                        <Input
                            type="number"
                            bind:value={settings.printCopies}
                            min={1}
                            max={5}
                        />
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter class="flex justify-between">
            <p class="text-sm text-muted-foreground">
                Perubahan akan diterapkan pada cetakan berikutnya.
            </p>
            <Button onclick={save} disabled={saving || loading}>
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

    <!-- Preview Section omitted for brevity/performance or can be added if requested specifically, 
         but it's good to have. I will add a reduced version. -->

    <Card>
        <CardHeader>
            <CardTitle>Preview Live</CardTitle>
            <CardDescription
                >Simulasi tampilan berdasarkan pengaturan diatas (Ukuran
                Thermal).</CardDescription
            >
        </CardHeader>
        <CardContent>
            <div
                class="flex justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed overflow-x-auto"
            >
                <div
                    class="bg-white shadow-lg font-mono text-xs leading-tight transition-all duration-300 flex-shrink-0"
                    style="width: {settings.paperSize === '80mm'
                        ? '290px'
                        : settings.paperSize === '58mm'
                          ? '210px'
                          : '360px'}; padding: 12px 10px; min-height: 300px;"
                >
                    <!-- Header Preview -->
                    {#if settings.showLogo}
                        <div
                            class="text-center mb-2 border-b border-dashed border-gray-400 pb-2"
                        >
                            <div
                                class="w-10 h-10 mx-auto mb-1 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-500"
                            >
                                LOGO
                            </div>
                        </div>
                    {/if}
                    <div class="text-center mb-2">
                        <div class="font-bold text-sm uppercase">
                            {storeInfo.name}
                        </div>
                        <div class="text-[10px] text-gray-600">
                            {storeInfo.address}
                        </div>
                        <div class="text-[10px] text-gray-600">
                            {storeInfo.phone}
                        </div>
                        {#if settings.headerText}
                            <div
                                class="text-[10px] text-gray-500 mt-1 whitespace-pre-wrap"
                            >
                                {settings.headerText}
                            </div>
                        {/if}
                    </div>

                    <div
                        class="border-t border-dashed border-gray-400 my-2"
                    ></div>

                    <!-- Dummy Transaction -->
                    <div class="text-[10px] space-y-1">
                        <div class="flex justify-between">
                            <span>No:</span><span class="font-bold"
                                >SRV-2024-001</span
                            >
                        </div>
                        <div class="flex justify-between">
                            <span>Tgl:</span><span>27/01/2026 14:30</span>
                        </div>

                        {#if settings.showCustomerPhone}
                            <div class="flex justify-between">
                                <span>Cust:</span><span>0812-3456-7890</span>
                            </div>
                        {/if}

                        {#if settings.showCustomerAddress}
                            <div class="text-[9px] text-gray-500 mt-0.5 ml-2">
                                Jl. Raya Contoh No. 123, Jakarta
                            </div>
                        {/if}

                        {#if settings.showTechnicianName}
                            <div class="flex justify-between">
                                <span>Teknisi:</span><span>Budi Santoso</span>
                            </div>
                        {/if}

                        {#if settings.showImei}
                            <div class="flex justify-between mt-1">
                                <span>IMEI:</span><span>358921045671234</span>
                            </div>
                        {/if}
                    </div>

                    <div
                        class="border-t border-dashed border-gray-400 my-2"
                    ></div>

                    <!-- Items -->
                    <div class="text-[10px] space-y-2">
                        <div>
                            <div class="font-bold">Ganti LCD iPhone 11</div>
                            {#if settings.showSparepartDetails}
                                <div
                                    class="flex justify-between text-[9px] text-gray-500 pl-2"
                                >
                                    <span>1x LCD Original</span>
                                    <span>550.000</span>
                                </div>
                                <div
                                    class="flex justify-between text-[9px] text-gray-500 pl-2"
                                >
                                    <span>Jasa Pasang</span>
                                    <span>100.000</span>
                                </div>
                            {:else}
                                <div class="text-[9px] text-gray-500">
                                    Service + Part
                                </div>
                            {/if}
                            <div class="flex justify-between font-bold mt-1">
                                <span>Total</span>
                                <span>650.000</span>
                            </div>
                        </div>
                    </div>

                    <div
                        class="border-t border-dashed border-gray-400 my-2"
                    ></div>

                    <!-- Footer -->
                    <div class="text-[10px] space-y-2">
                        {#if settings.showWarrantyInfo}
                            <div
                                class="text-center p-1 border border-dashed rounded bg-gray-50"
                            >
                                Garansi 7 Hari (S&K Berlaku)
                            </div>
                        {/if}

                        <div
                            class="text-center text-gray-500 whitespace-pre-wrap"
                        >
                            {settings.footerText ||
                                "Terima kasih atas kunjungan Anda"}
                        </div>

                        {#if settings.termsConditions}
                            <div
                                class="text-[8px] text-gray-400 mt-2 text-justify whitespace-pre-wrap"
                            >
                                * {settings.termsConditions}
                            </div>
                        {/if}

                        {#if settings.showBarcode}
                            <div class="mt-4 flex flex-col items-center">
                                <div
                                    class="w-24 h-8 bg-gray-800 rounded-sm mb-1"
                                ></div>
                                <span class="text-[8px]">SRV-2024-001</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</div>
