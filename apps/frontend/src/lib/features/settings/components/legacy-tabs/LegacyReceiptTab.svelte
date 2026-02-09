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
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Receipt, Printer, Save, Loader2 } from "lucide-svelte";
    import {
        PAPER_SIZES,
        PRINTER_TYPES,
    } from "$lib/features/settings/settings.service";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();

    $effect(() => {
        controller.handlePrinterTypeChange();
    });
</script>

<Card>
    <CardHeader>
        <CardTitle>Pengaturan Nota / Struk</CardTitle>
        <CardDescription>
            Kustomisasi tampilan nota penjualan dan service.
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
                    <Switch
                        bind:checked={controller.receiptSettings.showLogo}
                    />
                </div>
            </div>
            <div class="space-y-2">
                <Label>Teks Header Tambahan</Label>
                <Textarea
                    bind:value={controller.receiptSettings.headerText}
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
                    bind:value={controller.receiptSettings.footerText}
                    placeholder="Terima kasih atas kepercayaan Anda"
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label>Syarat & Ketentuan</Label>
                <Textarea
                    bind:value={controller.receiptSettings.termsConditions}
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
                    <Switch
                        bind:checked={
                            controller.receiptSettings.showCustomerPhone
                        }
                    />
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <Label>Tampilkan Alamat Customer</Label>
                    <Switch
                        bind:checked={
                            controller.receiptSettings.showCustomerAddress
                        }
                    />
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <Label>Tampilkan IMEI</Label>
                    <Switch
                        bind:checked={controller.receiptSettings.showImei}
                    />
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
                    <Switch
                        bind:checked={
                            controller.receiptSettings.showSparepartDetails
                        }
                    />
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <Label>Tampilkan Nama Teknisi</Label>
                    <Switch
                        bind:checked={
                            controller.receiptSettings.showTechnicianName
                        }
                    />
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <Label>Tampilkan Info Garansi</Label>
                    <Switch
                        bind:checked={
                            controller.receiptSettings.showWarrantyInfo
                        }
                    />
                </div>
                <div
                    class="flex items-center justify-between p-3 border rounded-lg"
                >
                    <div>
                        <Label>Tampilkan QR Code</Label>
                        <p class="text-xs text-muted-foreground">
                            QR Code nomor service
                        </p>
                    </div>
                    <Switch
                        bind:checked={controller.receiptSettings.showBarcode}
                    />
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
                    <Select
                        type="single"
                        bind:value={controller.receiptSettings.printerType}
                    >
                        <SelectTrigger>
                            {PRINTER_TYPES.find(
                                (p) =>
                                    p.id ===
                                    controller.receiptSettings.printerType,
                            )?.label || "Pilih"}
                        </SelectTrigger>
                        <SelectContent>
                            {#each PRINTER_TYPES as pt}
                                <SelectItem value={pt.id}>{pt.label}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Ukuran Kertas</Label>
                    <Select
                        type="single"
                        bind:value={controller.receiptSettings.paperSize}
                    >
                        <SelectTrigger>
                            {controller.receiptSettings.paperSize || "Pilih"}
                        </SelectTrigger>
                        <SelectContent>
                            {#each controller.availablePaperSizes as ps}
                                <SelectItem value={ps.id}>{ps.label}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Jumlah Cetak Default</Label>
                    <Input
                        type="number"
                        bind:value={controller.receiptSettings.printCopies}
                        min={1}
                        max={5}
                    />
                </div>
            </div>
        </div>

        <Separator />

        <!-- Receipt Preview -->
        <div class="space-y-4">
            <h4 class="font-medium flex items-center gap-2">
                <Receipt class="h-4 w-4" /> Preview Nota
            </h4>
            <p class="text-sm text-muted-foreground">
                Tampilan perkiraan struk berdasarkan jenis printer dan kertas
                yang dipilih.
            </p>

            <div
                class="flex justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed"
            >
                {#if controller.receiptSettings.printerType === "thermal"}
                    <!-- Thermal Printer Preview (58mm/80mm) -->
                    <div
                        class="bg-white shadow-lg transition-all duration-300 font-mono text-xs leading-tight"
                        style="width: {controller.receiptSettings.paperSize ===
                        '80mm'
                            ? '280px'
                            : '200px'}; padding: 12px 8px;"
                    >
                        <!-- Header -->
                        {#if controller.receiptSettings.showLogo}
                            <div
                                class="text-center mb-2 border-b border-dashed border-gray-400 pb-2"
                            >
                                <div
                                    class="w-8 h-8 mx-auto mb-1 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-500"
                                >
                                    LOGO
                                </div>
                            </div>
                        {/if}
                        <div class="text-center mb-2">
                            <div class="font-bold text-sm">
                                {controller.storeInfo.name || "NAMA TOKO ANDA"}
                            </div>
                            <div class="text-[10px] text-gray-600">
                                {controller.storeInfo.address ||
                                    "Jl. Contoh No. 123, Kota"}
                            </div>
                            <div class="text-[10px] text-gray-600">
                                {controller.storeInfo.phone || "0812-xxxx-xxxx"}
                            </div>
                            {#if controller.receiptSettings.headerText}
                                <div class="text-[10px] text-gray-500 mt-1">
                                    {controller.receiptSettings.headerText}
                                </div>
                            {/if}
                        </div>

                        <div
                            class="border-t border-dashed border-gray-400 my-2"
                        ></div>

                        <!-- Transaction Info -->
                        <div class="text-[10px] space-y-0.5">
                            <div class="flex justify-between">
                                <span>No:</span>
                                <span>SRV-2026-001</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tanggal:</span>
                                <span>14/01/2026 07:00</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Customer:</span>
                                <span>John Doe</span>
                            </div>
                            {#if controller.receiptSettings.showCustomerPhone}
                                <div class="flex justify-between">
                                    <span>HP:</span>
                                    <span>0812-3456-7890</span>
                                </div>
                            {/if}
                            {#if controller.receiptSettings.showCustomerAddress}
                                <div class="flex justify-between">
                                    <span>Alamat:</span>
                                    <span
                                        class="text-right max-w-[100px] truncate"
                                        >Jl. Sample</span
                                    >
                                </div>
                            {/if}
                            {#if controller.receiptSettings.showTechnicianName}
                                <div class="flex justify-between">
                                    <span>Teknisi:</span>
                                    <span>Ahmad</span>
                                </div>
                            {/if}
                        </div>

                        <div
                            class="border-t border-dashed border-gray-400 my-2"
                        ></div>

                        <!-- Items -->
                        <div class="text-[10px] space-y-1">
                            <div>
                                <div class="font-medium">
                                    iPhone 12 - Ganti LCD
                                </div>
                                {#if controller.receiptSettings.showImei}
                                    <div class="text-gray-500">
                                        IMEI: 35XXXXXX
                                    </div>
                                {/if}
                                {#if controller.receiptSettings.showSparepartDetails}
                                    <div class="flex justify-between pl-2">
                                        <span>Biaya Service</span>
                                        <span>Rp 150.000</span>
                                    </div>
                                    <div
                                        class="flex justify-between text-gray-600 pl-2"
                                    >
                                        <span>Sparepart</span>
                                        <span>Rp 850.000</span>
                                    </div>
                                {:else}
                                    <div class="flex justify-between">
                                        <span></span>
                                        <span>Rp 1.000.000</span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div
                            class="border-t border-dashed border-gray-400 my-2"
                        ></div>

                        <!-- Total -->
                        <div class="text-[10px] space-y-0.5">
                            <div class="flex justify-between font-bold">
                                <span>TOTAL</span>
                                <span>Rp 1.000.000</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Bayar</span>
                                <span>Rp 1.000.000</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Kembali</span>
                                <span>Rp 0</span>
                            </div>
                        </div>

                        {#if controller.receiptSettings.showWarrantyInfo}
                            <div
                                class="border-t border-dashed border-gray-400 my-2"
                            ></div>
                            <div class="text-[10px] text-center text-gray-600">
                                <div class="font-medium">GARANSI: 30 HARI</div>
                                <div>Berlaku s/d 14/02/2026</div>
                            </div>
                        {/if}

                        {#if controller.receiptSettings.showBarcode && controller.qrCodeDataUrl}
                            <div class="flex justify-center my-2">
                                <div class="text-center">
                                    <img
                                        src={controller.qrCodeDataUrl}
                                        alt="QR Code"
                                        class="w-16 h-16 mx-auto"
                                    />
                                    <div
                                        class="text-[9px] text-gray-600 mt-1 font-mono"
                                    >
                                        SRV-2026-001
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <div
                            class="border-t border-dashed border-gray-400 my-2"
                        ></div>

                        <!-- Footer -->
                        <div
                            class="text-center text-[9px] text-gray-500 space-y-1"
                        >
                            {#if controller.receiptSettings.footerText}
                                <div>
                                    {controller.receiptSettings.footerText}
                                </div>
                            {:else}
                                <div>Terima kasih atas kepercayaan Anda</div>
                            {/if}
                            {#if controller.receiptSettings.termsConditions}
                                <div class="text-[8px]">
                                    {controller.receiptSettings.termsConditions}
                                </div>
                            {:else}
                                <div class="text-[8px]">
                                    Barang yang sudah dibeli tidak dapat
                                    dikembalikan
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else if controller.receiptSettings.printerType === "inkjet"}
                    <!-- Inkjet Printer Preview (A4/A5/Letter) -->
                    <div
                        class="bg-white shadow-lg transition-all duration-300 text-sm"
                        style="width: {controller.receiptSettings.paperSize ===
                        'A5'
                            ? '320px'
                            : '400px'}; padding: 24px;"
                    >
                        <!-- Header -->
                        <div
                            class="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-800"
                        >
                            <div class="flex items-center gap-4">
                                {#if controller.receiptSettings.showLogo}
                                    <div
                                        class="w-14 h-14 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-400"
                                    >
                                        LOGO
                                    </div>
                                {/if}
                                <div>
                                    <div class="font-bold text-lg">
                                        {controller.storeInfo.name ||
                                            "NAMA TOKO ANDA"}
                                    </div>
                                    <div class="text-xs text-gray-600">
                                        {controller.storeInfo.address ||
                                            "Jl. Contoh No. 123, Kota"}
                                    </div>
                                    <div class="text-xs text-gray-600">
                                        {controller.storeInfo.phone ||
                                            "0812-xxxx-xxxx"}
                                        {controller.storeInfo.email
                                            ? `| ${controller.storeInfo.email}`
                                            : ""}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right text-xs">
                                <div class="font-bold text-base">
                                    NOTA SERVICE
                                </div>
                                <div class="text-gray-600">
                                    No: SRV-2026-001
                                </div>
                                <div class="text-gray-600">14 Jan 2026</div>
                            </div>
                        </div>

                        {#if controller.receiptSettings.headerText}
                            <div
                                class="text-center text-sm text-gray-600 mb-4 italic"
                            >
                                {controller.receiptSettings.headerText}
                            </div>
                        {/if}

                        <!-- Customer Info -->
                        <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium text-gray-700 mb-1">
                                    Informasi Customer
                                </div>
                                <div>John Doe</div>
                                {#if controller.receiptSettings.showCustomerPhone}
                                    <div class="text-gray-600">
                                        HP: 0812-3456-7890
                                    </div>
                                {/if}
                                {#if controller.receiptSettings.showCustomerAddress}
                                    <div class="text-gray-600">
                                        Jl. Sample No. 123
                                    </div>
                                {/if}
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium text-gray-700 mb-1">
                                    Informasi Device
                                </div>
                                <div>iPhone 12 Pro Max</div>
                                {#if controller.receiptSettings.showImei}
                                    <div class="text-gray-600">
                                        IMEI: 35XXXXXXXXXX001
                                    </div>
                                {/if}
                                <div class="text-gray-600">
                                    Keluhan: LCD Rusak
                                </div>
                            </div>
                        </div>

                        <!-- Items Table -->
                        <table class="w-full text-sm mb-4">
                            <thead>
                                <tr class="border-y border-gray-300">
                                    <th class="text-left py-2 font-medium"
                                        >Deskripsi</th
                                    >
                                    <th class="text-right py-2 font-medium"
                                        >Harga</th
                                    >
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-gray-200 bg-gray-50">
                                    <td class="py-2 font-medium" colspan="2"
                                        >iPhone 12 - Ganti LCD</td
                                    >
                                </tr>
                                {#if controller.receiptSettings.showSparepartDetails}
                                    <tr class="border-b border-gray-200">
                                        <td class="py-2 pl-4 text-gray-600"
                                            >Biaya Service</td
                                        >
                                        <td class="text-right py-2"
                                            >Rp 150.000</td
                                        >
                                    </tr>
                                    <tr class="border-b border-gray-200">
                                        <td class="py-2 pl-4 text-gray-600"
                                            >Sparepart</td
                                        >
                                        <td class="text-right py-2"
                                            >Rp 850.000</td
                                        >
                                    </tr>
                                {:else}
                                    <tr class="border-b border-gray-200">
                                        <td class="py-2 pl-4"></td>
                                        <td class="text-right py-2"
                                            >Rp 1.000.000</td
                                        >
                                    </tr>
                                {/if}
                            </tbody>
                            <tfoot>
                                <tr class="font-bold">
                                    <td class="py-2">TOTAL</td>
                                    <td class="text-right py-2">Rp 1.000.000</td
                                    >
                                </tr>
                            </tfoot>
                        </table>

                        <!-- Payment & Warranty -->
                        <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                                <div class="font-medium mb-1">Pembayaran</div>
                                <div class="text-gray-600">
                                    Transfer Bank BCA
                                </div>
                                <div class="text-gray-600">
                                    Lunas: Rp 1.000.000
                                </div>
                            </div>
                            {#if controller.receiptSettings.showWarrantyInfo}
                                <div>
                                    <div class="font-medium mb-1">Garansi</div>
                                    <div class="text-gray-600">30 Hari</div>
                                    <div class="text-gray-600">
                                        Berlaku: 14/01/2026 - 14/02/2026
                                    </div>
                                </div>
                            {/if}
                        </div>

                        {#if controller.receiptSettings.showTechnicianName}
                            <div class="text-sm text-gray-600 mb-4">
                                Ditangani oleh: <span class="font-medium"
                                    >Ahmad (Teknisi)</span
                                >
                            </div>
                        {/if}

                        {#if controller.receiptSettings.showBarcode && controller.qrCodeDataUrl}
                            <!-- QR Code -->
                            <div class="flex justify-center mb-4">
                                <div class="text-center">
                                    <div
                                        class="bg-white p-2 border inline-block"
                                    >
                                        <img
                                            src={controller.qrCodeDataUrl}
                                            alt="QR Code"
                                            class="w-16 h-16"
                                        />
                                        <div
                                            class="text-[10px] text-gray-600 mt-1 font-mono"
                                        >
                                            SRV-2026-001
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Footer -->
                        <div
                            class="border-t-2 border-gray-800 pt-3 text-center text-xs text-gray-500"
                        >
                            {#if controller.receiptSettings.footerText}
                                <div class="mb-1">
                                    {controller.receiptSettings.footerText}
                                </div>
                            {:else}
                                <div class="mb-1">
                                    Terima kasih atas kepercayaan Anda
                                </div>
                            {/if}
                            {#if controller.receiptSettings.termsConditions}
                                <div class="text-[10px]">
                                    {controller.receiptSettings.termsConditions}
                                </div>
                            {:else}
                                <div class="text-[10px]">
                                    Barang yang sudah diambil tidak dapat
                                    dikembalikan
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else if controller.receiptSettings.printerType === "dotmatrix"}
                    <!-- Dot Matrix Printer Preview -->
                    <div
                        class="bg-[#FFFEF0] shadow-lg transition-all duration-300 font-mono text-xs border-t-4 border-b-4 border-dashed border-gray-400"
                        style="width: {controller.receiptSettings.paperSize ===
                        'A4'
                            ? '400px'
                            : '360px'}; padding: 16px 20px; background-image: repeating-linear-gradient(transparent, transparent 11px, rgba(0,0,0,0.03) 11px, rgba(0,0,0,0.03) 12px);"
                    >
                        <!-- Perforation holes on sides -->
                        <div
                            class="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around items-center opacity-30"
                        >
                            {#each Array(10) as _}
                                <div
                                    class="w-2 h-2 rounded-full bg-gray-400"
                                ></div>
                            {/each}
                        </div>

                        <!-- Header -->
                        <div
                            class="text-center mb-3"
                            style="letter-spacing: 0.5px;"
                        >
                            <div class="text-base font-bold tracking-wider">
                                {(
                                    controller.storeInfo.name ||
                                    "NAMA TOKO ANDA"
                                ).toUpperCase()}
                            </div>
                            <div class="text-[11px]">
                                {controller.storeInfo.address ||
                                    "Jl. Contoh No. 123, Kota"}
                            </div>
                            <div class="text-[11px]">
                                Telp: {controller.storeInfo.phone ||
                                    "0812-xxxx-xxxx"}
                            </div>
                            {#if controller.receiptSettings.showLogo}
                                <div class="text-[10px] text-gray-500 mt-1">
                                    [LOGO]
                                </div>
                            {/if}
                            {#if controller.receiptSettings.headerText}
                                <div class="text-[10px] mt-1">
                                    {controller.receiptSettings.headerText}
                                </div>
                            {/if}
                        </div>

                        <div
                            class="border-t border-gray-400 my-2"
                            style="border-style: dashed;"
                        ></div>
                        <div class="text-center text-[11px] font-bold mb-2">
                            NOTA SERVICE
                        </div>
                        <div
                            class="border-b border-gray-400 my-2"
                            style="border-style: dashed;"
                        ></div>

                        <!-- Transaction details -->
                        <div
                            class="space-y-0.5 text-[11px]"
                            style="letter-spacing: 0.3px;"
                        >
                            <div class="flex">
                                <span class="w-24">No. Nota</span>
                                <span>: SRV-2026-001</span>
                            </div>
                            <div class="flex">
                                <span class="w-24">Tanggal</span>
                                <span>: 14/01/2026 07:00</span>
                            </div>
                            <div class="flex">
                                <span class="w-24">Customer</span>
                                <span>: John Doe</span>
                            </div>
                            {#if controller.receiptSettings.showCustomerPhone}
                                <div class="flex">
                                    <span class="w-24">No. HP</span>
                                    <span>: 0812-3456-7890</span>
                                </div>
                            {/if}
                            {#if controller.receiptSettings.showCustomerAddress}
                                <div class="flex">
                                    <span class="w-24">Alamat</span>
                                    <span>: Jl. Sample No. 123</span>
                                </div>
                            {/if}
                            <div class="flex">
                                <span class="w-24">Device</span>
                                <span>: iPhone 12 Pro Max</span>
                            </div>
                            {#if controller.receiptSettings.showImei}
                                <div class="flex">
                                    <span class="w-24">IMEI</span>
                                    <span>: 35XXXXXXXXXX001</span>
                                </div>
                            {/if}
                            <div class="flex">
                                <span class="w-24">Keluhan</span>
                                <span>: LCD Rusak/Pecah</span>
                            </div>
                            {#if controller.receiptSettings.showTechnicianName}
                                <div class="flex">
                                    <span class="w-24">Teknisi</span>
                                    <span>: Ahmad</span>
                                </div>
                            {/if}
                        </div>

                        <div
                            class="my-3"
                            style="border-top: 1px dashed #888;"
                        ></div>

                        <!-- Items -->
                        <div class="text-[11px]" style="letter-spacing: 0.3px;">
                            <div class="flex justify-between font-bold mb-1">
                                <span>DESKRIPSI</span>
                                <span>HARGA</span>
                            </div>
                            <div
                                class="border-b border-gray-400 mb-1"
                                style="border-style: dotted;"
                            ></div>
                            <div class="font-bold mb-1">
                                iPhone 12 - Ganti LCD
                            </div>
                            {#if controller.receiptSettings.showSparepartDetails}
                                <div class="flex justify-between">
                                    <span> Biaya Service</span>
                                    <span>150.000</span>
                                </div>
                                <div class="flex justify-between">
                                    <span> Sparepart</span>
                                    <span>850.000</span>
                                </div>
                            {:else}
                                <div class="flex justify-between">
                                    <span></span>
                                    <span>1.000.000</span>
                                </div>
                            {/if}
                            <div
                                class="border-t border-gray-400 mt-1 mb-1"
                                style="border-style: dotted;"
                            ></div>
                            <div class="flex justify-between font-bold">
                                <span>TOTAL</span>
                                <span>Rp 1.000.000</span>
                            </div>
                            <div class="flex justify-between">
                                <span>BAYAR</span>
                                <span>Rp 1.000.000</span>
                            </div>
                            <div class="flex justify-between">
                                <span>KEMBALI</span>
                                <span>Rp 0</span>
                            </div>
                        </div>

                        {#if controller.receiptSettings.showBarcode && controller.qrCodeDataUrl}
                            <div
                                class="my-3"
                                style="border-top: 1px dashed #888;"
                            ></div>
                            <div class="text-center my-2">
                                <div
                                    class="inline-block bg-white p-1 border border-gray-300"
                                >
                                    <img
                                        src={controller.qrCodeDataUrl}
                                        alt="QR Code"
                                        class="w-12 h-12 grayscale"
                                    />
                                    <div
                                        class="text-[9px] font-bold mt-1 tracking-widest"
                                    >
                                        SRV-2026-001
                                    </div>
                                </div>
                            </div>
                        {/if}

                        {#if controller.receiptSettings.showWarrantyInfo}
                            <div
                                class="my-3"
                                style="border-top: 1px dashed #888;"
                            ></div>
                            <div class="text-center text-[11px]">
                                <div class="font-bold">
                                    *** GARANSI 30 HARI ***
                                </div>
                                <div>Berlaku s/d: 14/02/2026</div>
                            </div>
                        {/if}

                        <div
                            class="my-3"
                            style="border-top: 1px dashed #888;"
                        ></div>

                        <!-- Footer -->
                        <div class="text-center text-[10px]">
                            {#if controller.receiptSettings.footerText}
                                <div>
                                    {controller.receiptSettings.footerText}
                                </div>
                            {:else}
                                <div>Terima kasih atas kepercayaan Anda</div>
                            {/if}
                            {#if controller.receiptSettings.termsConditions}
                                <div class="mt-1">
                                    {controller.receiptSettings.termsConditions}
                                </div>
                            {:else}
                                <div class="mt-1">
                                    Barang yg sudah diambil tidak dpt
                                    dikembalikan
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Printer type indicator -->
            <div
                class="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
                <Badge variant="outline">
                    {PRINTER_TYPES.find(
                        (p) => p.id === controller.receiptSettings.printerType,
                    )?.label || controller.receiptSettings.printerType}
                </Badge>
                <span>•</span>
                <Badge variant="outline">
                    {controller.receiptSettings.paperSize}
                </Badge>
            </div>
        </div>
    </CardContent>
    <CardFooter>
        <Button
            onclick={() => controller.saveReceiptSettings()}
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
