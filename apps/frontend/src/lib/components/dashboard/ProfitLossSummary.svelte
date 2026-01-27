<script module>
    import { Separator } from "$lib/components/ui/separator";
</script>

<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        TrendingUp,
        TrendingDown,
        DollarSign,
        PieChart,
        Activity,
    } from "lucide-svelte";
    import { Skeleton } from "$lib/components/ui/skeleton";

    let { data, isLoading } = $props<{
        data: any;
        isLoading: boolean;
    }>();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    const profitColor = $derived(
        data?.netProfit >= 0 ? "text-green-600" : "text-red-600",
    );
    const profitIcon = $derived(
        data?.netProfit >= 0 ? TrendingUp : TrendingDown,
    );
</script>

<Card class="overflow-hidden border-2 shadow-lg">
    <CardHeader class="bg-primary/5 pb-4 border-b">
        <div class="flex items-center justify-between">
            <CardTitle class="text-lg font-bold flex items-center gap-2">
                <DollarSign class="h-5 w-5 text-primary" />
                Analisis Laba Rugi (P&L)
            </CardTitle>
            {#if !isLoading}
                <div
                    class={`flex items-center gap-1 text-sm font-bold ${profitColor}`}
                >
                    {#if data?.grossProfit > 0}
                        <TrendingUp class="h-4 w-4" />
                        {Math.round(
                            (data.netProfit / data.revenue.total) * 100,
                        )}% Margin
                    {/if}
                </div>
            {/if}
        </div>
    </CardHeader>
    <CardContent class="p-6">
        {#if isLoading}
            <div class="space-y-4">
                <Skeleton class="h-12 w-full" />
                <Skeleton class="h-24 w-full" />
                <Skeleton class="h-12 w-full" />
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Revenue Column -->
                <div class="space-y-3">
                    <p
                        class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
                    >
                        <Activity class="h-3 w-3" /> Pendapatan
                    </p>
                    <div class="space-y-2">
                        <div class="flex justify-between items-end">
                            <span class="text-sm text-muted-foreground"
                                >Sales</span
                            >
                            <span class="font-semibold"
                                >{formatCurrency(data.revenue.sales)}</span
                            >
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-sm text-muted-foreground"
                                >Services</span
                            >
                            <span class="font-semibold"
                                >{formatCurrency(data.revenue.services)}</span
                            >
                        </div>
                        <Separator />
                        <div class="flex justify-between items-end">
                            <span class="text-sm font-bold">Total Revenue</span>
                            <span class="text-lg font-black text-blue-600"
                                >{formatCurrency(data.revenue.total)}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- COGS & Gross Profit -->
                <div class="space-y-3 p-4 bg-muted/30 rounded-xl">
                    <p
                        class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
                    >
                        <PieChart class="h-3 w-3" /> Harga Pokok (COGS)
                    </p>
                    <div class="space-y-2">
                        <div class="flex justify-between items-end">
                            <span class="text-sm text-muted-foreground"
                                >HPP Barang</span
                            >
                            <span class="font-medium"
                                >{formatCurrency(data.cogs.sales)}</span
                            >
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-sm text-muted-foreground"
                                >HPP Sparepart</span
                            >
                            <span class="font-medium"
                                >{formatCurrency(data.cogs.services)}</span
                            >
                        </div>
                        <Separator />
                        <div class="flex justify-between items-end pt-1">
                            <span class="text-sm font-semibold"
                                >Gross Profit</span
                            >
                            <span class="font-bold text-green-600"
                                >{formatCurrency(data.grossProfit)}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Expenses & Net Profit -->
                <div class="space-y-3">
                    <p
                        class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
                    >
                        <Activity class="h-3 w-3" /> Pengeluaran
                    </p>
                    <div class="space-y-2">
                        <div
                            class="flex justify-between items-end text-red-600"
                        >
                            <span class="text-sm">Operasional</span>
                            <span class="font-medium"
                                >- {formatCurrency(
                                    data.expenses.operational,
                                )}</span
                            >
                        </div>
                        <div
                            class="flex justify-between items-end text-red-600"
                        >
                            <span class="text-sm">Komisi Teknisi</span>
                            <span class="font-medium"
                                >- {formatCurrency(
                                    data.expenses.commissions,
                                )}</span
                            >
                        </div>
                        <Separator />
                        <div class="flex justify-between items-end pt-1">
                            <span class="text-sm font-bold">Net Profit</span>
                            <div class="text-right">
                                <span
                                    class={`text-2xl font-black ${profitColor}`}
                                >
                                    {formatCurrency(data.netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </CardContent>
</Card>
