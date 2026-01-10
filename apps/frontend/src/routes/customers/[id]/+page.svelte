<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { CustomersService } from "$lib/services/customers.service";
    import {
        PaymentMethodsService,
        type PaymentMethod,
    } from "$lib/services/settings.service";
    import { formatCurrency } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { Badge } from "$lib/components/ui/badge";
    import {
        ArrowLeft,
        Wallet,
        Upload,
        Calendar,
        FileText,
    } from "lucide-svelte";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { toast } from "svelte-sonner";

    let customer = $state<any>(null);
    let sales = $state<any[]>([]);
    let unpaidSales = $state<any[]>([]);
    let loading = $state(true);

    // Payment State
    let openPaymentDialog = $state(false);
    let selectedSale = $state<any>(null);
    let paymentAmount = $state(0);
    let paymentMethod = $state<"cash" | "transfer" | "qris">("cash");
    let selectedBank = $state("");
    let paymentNotes = $state("");
    let proofFile = $state<File | null>(null);
    let paying = $state(false);

    // Bank options from settings
    let paymentMethods = $state<PaymentMethod[]>([]);
    let transferMethod = $derived(
        paymentMethods.find((m) => m.type === "transfer"),
    );
    let bankOptions = $derived(
        transferMethod?.variants
            ?.filter((v) => v.enabled)
            ?.map((v) => ({
                value: v.id,
                label: `${v.name}${v.accountNumber ? " - " + v.accountNumber : ""}`,
            })) || [],
    );

    async function loadData() {
        const id = $page.params.id;
        if (!id) return;

        loading = true;
        try {
            const [custData, salesData, unpaidData, paymentMethodsData] =
                await Promise.all([
                    CustomersService.getById(id),
                    CustomersService.getSales(id),
                    CustomersService.getUnpaidSales(id),
                    PaymentMethodsService.getEnabled(),
                ]);
            customer = custData;
            paymentMethods = paymentMethodsData;
            sales = salesData;
            unpaidSales = unpaidData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data pelanggan");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function openPayment(sale: any) {
        selectedSale = sale;
        // Calculate remaining amount from payments
        const paidAmount = (sale.payments || [])
            .filter((p: any) => p.method !== "tempo")
            .reduce((sum: number, p: any) => sum + p.amount, 0);
        const remaining = sale.finalAmount - paidAmount;
        paymentAmount = remaining > 0 ? remaining : 0;
        paymentMethod = "cash";
        selectedBank = "";
        paymentNotes = "";
        proofFile = null;
        openPaymentDialog = true;
    }

    async function handlePayment() {
        if (!customer) return;
        if (paymentAmount <= 0) return toast.error("Nominal harus > 0");

        paying = true;
        try {
            let proofUrl = undefined;
            if (proofFile) {
                // Upload Proof First
                try {
                    proofUrl = await CustomersService.uploadProof(proofFile);
                } catch (e) {
                    console.error("Upload failed", e);
                    toast.error(
                        "Gagal upload bukti transfer. Melanjutkan tanpa bukti.",
                    );
                }
            }

            // Build notes with bank info if transfer
            const notes =
                paymentMethod === "transfer" && selectedBank
                    ? `${selectedBank.toUpperCase()}${paymentNotes ? " - " + paymentNotes : ""}`
                    : paymentNotes;

            await CustomersService.payDebt(
                customer.id,
                paymentAmount,
                paymentMethod,
                notes,
                selectedSale?.id, // If paying specific sale
                proofUrl,
            );

            toast.success("Pembayaran berhasil!");
            openPaymentDialog = false;
            loadData(); // Refresh to update debt and status
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "Gagal memproses pembayaran",
            );
        } finally {
            paying = false;
        }
    }

    function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            proofFile = input.files[0];
        }
    }
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/customers">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
            {#if customer}
                <h2 class="text-3xl font-bold tracking-tight">
                    {customer.name}
                </h2>
                <div
                    class="flex items-center gap-2 text-muted-foreground text-sm"
                >
                    <span class="flex items-center gap-1"
                        ><span class="i-lucide-phone h-3 w-3"></span>
                        {customer.phone}</span
                    >
                </div>
            {:else}
                <h2 class="text-3xl font-bold tracking-tight">Loading...</h2>
            {/if}
        </div>
    </div>

    {#if customer}
        <div class="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-sm font-medium text-muted-foreground"
                        >Total Hutang</CardTitle
                    >
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold text-red-600">
                        {formatCurrency(customer.debt || 0)}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-sm font-medium text-muted-foreground"
                        >Limit Kredit</CardTitle
                    >
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold text-green-600">
                        {formatCurrency(customer.creditLimit || 0)}
                    </div>
                </CardContent>
            </Card>
        </div>

        <Tabs value="unpaid" class="w-full">
            <TabsList>
                <TabsTrigger value="unpaid">Tagihan Belum Lunas</TabsTrigger>
                <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid" class="mt-4">
                <div class="border rounded-md">
                    {#if unpaidSales.length === 0}
                        <div class="p-8 text-center text-muted-foreground">
                            <div class="text-4xl mb-2">✅</div>
                            <p>Tidak ada tagihan belum lunas.</p>
                        </div>
                    {:else}
                        <div class="divide-y">
                            {#each unpaidSales as sale}
                                {@const paidAmount = (sale.payments || [])
                                    .filter((p: any) => p.method !== "tempo")
                                    .reduce(
                                        (sum: number, p: any) => sum + p.amount,
                                        0,
                                    )}
                                {@const remainingAmount =
                                    sale.finalAmount - paidAmount}
                                {@const progressPercent = Math.min(
                                    100,
                                    Math.round(
                                        (paidAmount / sale.finalAmount) * 100,
                                    ),
                                )}
                                <div class="p-4 space-y-3 hover:bg-muted/50">
                                    <div
                                        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                    >
                                        <div class="space-y-1">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <a
                                                    href="/sales/history/{sale.id}"
                                                    class="font-bold hover:underline text-blue-600"
                                                >
                                                    {sale.id}
                                                </a>
                                                <Badge
                                                    variant="outline"
                                                    class="text-xs {sale.paymentStatus ===
                                                    'partial'
                                                        ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                        : 'bg-red-50 text-red-600 border-red-200'} capitalize"
                                                >
                                                    {sale.paymentStatus ===
                                                    "partial"
                                                        ? "Sebagian"
                                                        : "Belum Bayar"}
                                                </Badge>
                                            </div>
                                            <div
                                                class="text-sm text-muted-foreground flex items-center gap-2"
                                            >
                                                <Calendar class="h-3 w-3" />
                                                {formatDate(sale.createdAt)}
                                            </div>
                                        </div>
                                        <div
                                            class="flex w-full md:w-auto items-center justify-between md:justify-end gap-4"
                                        >
                                            <div
                                                class="text-left md:text-right space-y-0"
                                            >
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    Sisa Tagihan
                                                </div>
                                                <div
                                                    class="font-bold text-red-600 text-lg leading-tight"
                                                >
                                                    {formatCurrency(
                                                        remainingAmount,
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onclick={() =>
                                                    openPayment(sale)}
                                            >
                                                <Wallet class="h-4 w-4 mr-2" />
                                                Bayar
                                            </Button>
                                        </div>
                                    </div>

                                    <!-- Progress Bar -->
                                    <div class="space-y-1">
                                        <div
                                            class="flex justify-between text-xs text-muted-foreground"
                                        >
                                            <span
                                                >Terbayar: {formatCurrency(
                                                    paidAmount,
                                                )}</span
                                            >
                                            <span
                                                >Total: {formatCurrency(
                                                    sale.finalAmount,
                                                )}</span
                                            >
                                        </div>
                                        <div
                                            class="w-full bg-gray-200 rounded-full h-2"
                                        >
                                            <div
                                                class="bg-green-500 h-2 rounded-full transition-all"
                                                style="width: {progressPercent}%"
                                            ></div>
                                        </div>
                                        <div
                                            class="text-xs text-right text-muted-foreground"
                                        >
                                            {progressPercent}% terbayar
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </TabsContent>

            <TabsContent value="history" class="mt-4">
                <div class="border rounded-md">
                    {#if sales.length === 0}
                        <div class="p-8 text-center text-muted-foreground">
                            Belum ada riwayat transaksi.
                        </div>
                    {:else}
                        <div class="divide-y">
                            {#each sales as sale}
                                <div
                                    class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                >
                                    <div>
                                        <div class="font-bold">{sale.id}</div>
                                        <div
                                            class="size-sm text-muted-foreground"
                                        >
                                            {formatDate(sale.createdAt)}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <Badge
                                            variant="secondary"
                                            class="capitalize"
                                            >{sale.paymentStatus}</Badge
                                        >
                                        <div class="font-bold">
                                            {formatCurrency(sale.finalAmount)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            href={`/sales/history/${sale.id}`}
                                        >
                                            Detail <ArrowLeft
                                                class="ml-1 h-3 w-3 rotate-180"
                                            />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </TabsContent>
        </Tabs>
    {/if}

    <!-- Payment Dialog -->
    <Dialog bind:open={openPaymentDialog}>
        <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Bayar Tagihan {selectedSale?.id}</DialogTitle>
                <DialogDescription>
                    Masukkan nominal pembayaran untuk invoice ini.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <!-- Invoice Summary -->
                {#if selectedSale}
                    {@const paidAmount = (selectedSale.payments || [])
                        .filter((p: any) => p.method !== "tempo")
                        .reduce((sum: number, p: any) => sum + p.amount, 0)}
                    {@const remainingAmount =
                        selectedSale.finalAmount - paidAmount}
                    <div class="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground"
                                >Total Tagihan</span
                            >
                            <span class="font-medium"
                                >{formatCurrency(
                                    selectedSale.finalAmount,
                                )}</span
                            >
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground"
                                >Sudah Dibayar</span
                            >
                            <span class="font-medium text-green-600"
                                >{formatCurrency(paidAmount)}</span
                            >
                        </div>
                        <div class="border-t pt-2 flex justify-between text-sm">
                            <span class="font-medium">Sisa Tagihan</span>
                            <span class="font-bold text-red-600"
                                >{formatCurrency(remainingAmount)}</span
                            >
                        </div>
                    </div>

                    <!-- Payment History -->
                    {#if (selectedSale.payments || []).filter((p: any) => p.method !== "tempo").length > 0}
                        {@const paymentHistory = (selectedSale.payments || [])
                            .filter((p: any) => p.method !== "tempo")
                            .sort(
                                (a: any, b: any) =>
                                    new Date(b.createdAt || 0).getTime() -
                                    new Date(a.createdAt || 0).getTime(),
                            )}
                        <div class="space-y-2">
                            <div class="flex items-center gap-2">
                                <Calendar
                                    class="h-4 w-4 text-muted-foreground"
                                />
                                <Label class="text-muted-foreground"
                                    >Riwayat Pembayaran ({paymentHistory.length})</Label
                                >
                            </div>
                            <div
                                class="border rounded-lg bg-card max-h-40 overflow-y-auto"
                            >
                                {#each paymentHistory as payment, idx}
                                    <div
                                        class="px-3 py-2.5 flex justify-between items-start gap-3 {idx >
                                        0
                                            ? 'border-t'
                                            : ''}"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div
                                                class="flex items-center gap-2 flex-wrap"
                                            >
                                                <Badge
                                                    variant="outline"
                                                    class="capitalize text-xs {payment.method ===
                                                    'cash'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : payment.method ===
                                                            'transfer'
                                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                          : 'bg-purple-50 text-purple-700 border-purple-200'}"
                                                >
                                                    {payment.method === "cash"
                                                        ? "💵 Tunai"
                                                        : payment.method ===
                                                            "transfer"
                                                          ? "🏦 Transfer"
                                                          : payment.method ===
                                                              "qris"
                                                            ? "📱 QRIS"
                                                            : payment.method}
                                                </Badge>
                                                <span
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {payment.createdAt
                                                        ? new Date(
                                                              payment.createdAt,
                                                          ).toLocaleDateString(
                                                              "id-ID",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              },
                                                          )
                                                        : "-"}
                                                </span>
                                            </div>
                                            {#if payment.reference}
                                                <p
                                                    class="text-xs text-muted-foreground mt-1 truncate"
                                                >
                                                    📝 {payment.reference}
                                                </p>
                                            {/if}
                                        </div>
                                        <div class="text-right shrink-0">
                                            <span
                                                class="font-semibold text-green-600"
                                            >
                                                +{formatCurrency(
                                                    payment.amount,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else}
                        <div
                            class="text-center py-3 text-sm text-muted-foreground bg-muted/30 rounded-lg"
                        >
                            Belum ada pembayaran untuk tagihan ini
                        </div>
                    {/if}
                {/if}

                <!-- Payment Method Selection -->
                <div class="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all {paymentMethod ===
                            'cash'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-muted hover:border-muted-foreground/50'}"
                            onclick={() => {
                                paymentMethod = "cash";
                                selectedBank = "";
                            }}
                        >
                            <span class="text-xl">💵</span>
                            <span class="text-xs font-medium">Tunai</span>
                        </button>
                        <button
                            type="button"
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all {paymentMethod ===
                            'transfer'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-muted hover:border-muted-foreground/50'}"
                            onclick={() => (paymentMethod = "transfer")}
                        >
                            <span class="text-xl">🏦</span>
                            <span class="text-xs font-medium">Transfer</span>
                        </button>
                        <button
                            type="button"
                            class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all {paymentMethod ===
                            'qris'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-muted hover:border-muted-foreground/50'}"
                            onclick={() => {
                                paymentMethod = "qris";
                                selectedBank = "";
                            }}
                        >
                            <span class="text-xl">📱</span>
                            <span class="text-xs font-medium">QRIS</span>
                        </button>
                    </div>
                </div>

                <!-- Bank Selection (for Transfer) -->
                {#if paymentMethod === "transfer"}
                    <div class="space-y-2">
                        <Label>Pilih Bank Tujuan</Label>
                        <select
                            class="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            bind:value={selectedBank}
                        >
                            <option value="">-- Pilih Bank --</option>
                            {#each bankOptions as bank}
                                <option value={bank.value}>{bank.label}</option>
                            {/each}
                        </select>
                    </div>
                {/if}

                <div class="space-y-2">
                    <Label>Nominal Pembayaran</Label>
                    <div class="relative">
                        <span
                            class="absolute left-3 top-2.5 text-muted-foreground text-sm z-10"
                            >Rp</span
                        >
                        <CurrencyInput
                            class="pl-9"
                            bind:value={paymentAmount}
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label>Bukti Transfer (Jika ada)</Label>
                    <div class="grid w-full items-center gap-1.5">
                        <Label
                            for="picture"
                            class="cursor-pointer border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
                        >
                            {#if proofFile}
                                <FileText class="h-6 w-6 mb-2 text-green-600" />
                                <span class="text-xs text-green-600 font-medium"
                                    >{proofFile.name}</span
                                >
                            {:else}
                                <Upload
                                    class="h-6 w-6 mb-2 text-muted-foreground"
                                />
                                <span class="text-xs text-muted-foreground"
                                    >Klik untuk upload bukti</span
                                >
                            {/if}
                            <Input
                                id="picture"
                                type="file"
                                accept="image/*"
                                class="hidden"
                                onchange={handleFileChange}
                            />
                        </Label>
                    </div>
                </div>
                <div class="space-y-2">
                    <Label>Catatan</Label>
                    <Input
                        bind:value={paymentNotes}
                        placeholder="Catatan tambahan (opsional)"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (openPaymentDialog = false)}>Batal</Button
                >
                <Button onclick={handlePayment} disabled={paying}>
                    {paying ? "Memproses..." : "Bayar"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
