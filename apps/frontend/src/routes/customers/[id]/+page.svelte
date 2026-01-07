<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { CustomersService } from "$lib/services/customers.service";
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
    import { toast } from "svelte-sonner";

    let customer: any = null;
    let sales: any[] = [];
    let unpaidSales: any[] = [];
    let loading = true;

    // Payment State
    let openPaymentDialog = false;
    let selectedSale: any = null;
    let paymentAmount = 0;
    let paymentNotes = "";
    let proofFile: File | null = null;
    let paying = false;

    async function loadData() {
        const id = $page.params.id;
        if (!id) return;

        loading = true;
        try {
            const [custData, salesData, unpaidData] = await Promise.all([
                CustomersService.getById(id),
                CustomersService.getSales(id),
                CustomersService.getUnpaidSales(id),
            ]);
            customer = custData;
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
        // Default to remaining amount: finalAmount - (already paid?)
        // Calculate remaining based on PaymentStatus logic or backend?
        // Backend returns `paymentStatus`.
        // Let's default to `finalAmount` for simplicity or 0.
        // Ideally we should know "remaining", but our API didn't return it explicitly.
        // Assuming user enters amount manually.
        paymentAmount = 0;
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

            await CustomersService.payDebt(
                customer.id,
                paymentAmount,
                paymentNotes,
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

        <Tabs defaultValue="unpaid" class="w-full">
            <TabsList>
                <TabsTrigger value="unpaid">Tagihan Belum Lunas</TabsTrigger>
                <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid" class="mt-4">
                <div class="border rounded-md">
                    {#if unpaidSales.length === 0}
                        <div class="p-8 text-center text-muted-foreground">
                            Tidak ada tagihan belum lunas.
                        </div>
                    {:else}
                        <div class="divide-y">
                            {#each unpaidSales as sale}
                                <div
                                    class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-muted/50"
                                >
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold"
                                                >{sale.id}</span
                                            >
                                            <Badge
                                                variant="outline"
                                                class="text-xs bg-red-50 text-red-600 border-red-200 capitalize"
                                                >{sale.paymentStatus}</Badge
                                            >
                                        </div>
                                        <div
                                            class="text-sm text-muted-foreground flex items-center gap-2"
                                        >
                                            <Calendar class="h-3 w-3" />
                                            {formatDate(sale.createdAt)}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="text-right">
                                            <div
                                                class="text-sm text-muted-foreground"
                                            >
                                                Total Tagihan
                                            </div>
                                            <div class="font-bold">
                                                {formatCurrency(
                                                    sale.finalAmount,
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onclick={() => openPayment(sale)}
                                        >
                                            <Wallet class="h-4 w-4 mr-2" /> Bayar
                                        </Button>
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
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Bayar Tagihan {selectedSale?.id}</DialogTitle>
                <DialogDescription>
                    Masukkan nominal pembayaran untuk invoice ini.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label>Nominal Pembayaran</Label>
                    <div class="relative">
                        <span
                            class="absolute left-3 top-2.5 text-muted-foreground text-sm"
                            >Rp</span
                        >
                        <Input
                            type="number"
                            class="pl-9"
                            bind:value={paymentAmount}
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label>Bukti Transfer (Jika ada)</Label>
                    <div class="grid w-full max-w-sm items-center gap-1.5">
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
