<script lang="ts">
    import { onMount } from "svelte";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { goto } from "$app/navigation";
    import {
        Plus,
        ShoppingCart,
        Calendar,
        User,
        ArrowRight,
        Search,
        Filter,
        MoreHorizontal,
        Eye,
        Pencil,
        Trash2,
        Package,
        TrendingDown,
        ArrowUpRight,
        FileText,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";
    import { fade } from "svelte/transition";
    import { PurchaseListController } from "$lib/features/sales/purchases/purchase-list.controller.svelte";

    const controller = new PurchaseListController();

    onMount(() => {
        controller.load();
    });
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header Section -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <ShoppingCart class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Riwayat Pembelian
                    </h1>
                </div>
                <p class="text-violet-100 max-w-xl text-lg">
                    Kelola stok masuk dan riwayat belanja dari supplier.
                </p>
            </div>
            {#if controller.canCreate}
                <Button
                    href="/purchases/new"
                    size="lg"
                    class="bg-white text-violet-600 hover:bg-violet-50 border-0 shadow-lg font-semibold"
                >
                    <Plus class="mr-2 h-5 w-5" />
                    Buat PO Baru
                </Button>
            {/if}
        </div>
    </div>

    <!-- Stats Grid -->
    <div in:fade={{ duration: 400 }} class="grid gap-4 md:grid-cols-3">
        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-violet-500 shadow-md"
        >
            <CardContent class="p-5 flex items-center justify-between">
                <div>
                    <p
                        class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                        Total Pengeluaran
                    </p>
                    <h3 class="text-2xl font-bold mt-1 text-foreground">
                        {controller.formatRp(controller.totalSpent)}
                    </h3>
                </div>
                <div
                    class="p-3 bg-violet-100 dark:bg-violet-900/20 rounded-full"
                >
                    <TrendingDown class="h-5 w-5 text-violet-600" />
                </div>
            </CardContent>
        </Card>
        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-fuchsia-500 shadow-md"
        >
            <CardContent class="p-5 flex items-center justify-between">
                <div>
                    <p
                        class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                        Total Transaksi
                    </p>
                    <h3 class="text-2xl font-bold mt-1 text-foreground">
                        {controller.purchases.length}
                        <span class="text-sm font-normal text-muted-foreground"
                            >Nota</span
                        >
                    </h3>
                </div>
                <div
                    class="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/20 rounded-full"
                >
                    <FileText class="h-5 w-5 text-fuchsia-600" />
                </div>
            </CardContent>
        </Card>
        <Card
            class="bg-card/50 backdrop-blur border-l-4 border-l-pink-500 shadow-md"
        >
            <CardContent class="p-5 flex items-center justify-between">
                <div>
                    <p
                        class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                        Item Masuk
                    </p>
                    <h3 class="text-2xl font-bold mt-1 text-foreground">
                        {controller.totalItems}
                        <span class="text-sm font-normal text-muted-foreground"
                            >Items</span
                        >
                    </h3>
                </div>
                <div class="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-full">
                    <Package class="h-5 w-5 text-pink-600" />
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Filters & Content -->
    <div class="grid gap-6">
        <!-- Advanced Filter Bar -->
        <div
            class="bg-card/50 backdrop-blur-sm border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between sticky top-4 z-30"
        >
            <div class="flex flex-col md:flex-row gap-4 flex-1 w-full">
                <div class="relative flex-1 min-w-[200px]">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        type="search"
                        placeholder="Cari Invoice, Supplier..."
                        class="pl-9 h-10 bg-background/50 border-muted-foreground/20 focus:bg-background transition-all"
                        bind:value={controller.search}
                        onkeydown={(e) =>
                            e.key === "Enter" && controller.handleSearch()}
                    />
                </div>

                <div class="flex items-center gap-2">
                    <div class="w-[180px]">
                        <DateTimePicker
                            bind:value={controller.startDate}
                            showTime={false}
                        />
                    </div>
                    <span
                        class="text-muted-foreground text-xs uppercase font-medium"
                        >to</span
                    >
                    <div class="w-[180px]">
                        <DateTimePicker
                            bind:value={controller.endDate}
                            showTime={false}
                        />
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <select
                        bind:value={controller.statusFilter}
                        class="h-10 px-3 bg-background/50 border rounded-md text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="ORDERED">Ordered</option>
                        <option value="RECEIVED">Received</option>
                        <option value="VERIFIED">Verified</option>
                    </select>
                </div>

                <Button
                    onclick={() => controller.handleSearch()}
                    class="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                >
                    <Filter class="h-4 w-4 mr-2" /> Filter
                </Button>
            </div>
        </div>

        <!-- Desktop Table View -->
        <div
            class="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden"
        >
            <Table>
                <TableHeader class="bg-muted/50">
                    <TableRow class="hover:bg-transparent">
                        <TableHead class="w-[150px]">No. PO</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Input Oleh</TableHead>
                        <TableHead class="text-right">Total Nominal</TableHead>
                        <TableHead class="text-right w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if controller.loading}
                        {#each Array(5) as _}
                            <TableRow>
                                <TableCell colspan={7} class="h-16 text-center">
                                    <div
                                        class="w-full h-4 bg-muted/20 animate-pulse rounded"
                                    ></div>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {:else if controller.purchases.length === 0}
                        <TableRow>
                            <TableCell colspan={7} class="h-64 text-center">
                                <div
                                    class="flex flex-col items-center justify-center gap-3 opacity-60"
                                >
                                    <ShoppingCart
                                        class="h-12 w-12 text-muted-foreground/50"
                                    />
                                    <p class="text-lg font-medium">
                                        Belum ada riwayat pembelian
                                    </p>
                                    <p class="text-sm">
                                        Silakan buat pembelian baru untuk
                                        menambah stok.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each controller.purchases as po}
                            <TableRow
                                class="group hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
                            >
                                <TableCell
                                    class="font-mono font-medium text-violet-600"
                                >
                                    {po.notes || po.id}
                                </TableCell>
                                <TableCell>
                                    <div
                                        class="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                        <Calendar class="h-3.5 w-3.5" />
                                        {controller.formatDate(po.date)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        class="{controller.getStatusColor(
                                            po.status,
                                        )} text-white border-0 shadow-sm text-[10px] px-2"
                                    >
                                        {po.status || "ORDERED"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div class="font-medium text-foreground">
                                        {po.supplier?.name || "Unknown"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            class="font-normal text-xs bg-muted/50"
                                        >
                                            {po.items?.length || 0} Item
                                        </Badge>
                                        <span
                                            class="text-xs text-muted-foreground truncate max-w-[150px]"
                                        >
                                            {#each po.items?.slice(0, 2) || [] as item, i}
                                                {i > 0 ? ", " : ""}{item.product
                                                    ?.name}
                                            {/each}
                                            {#if (po.items?.length || 0) > 2}...{/if}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div
                                        class="flex items-center gap-2 text-sm text-foreground/80"
                                    >
                                        <div
                                            class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold"
                                        >
                                            {(po.user?.name || "U")[0]}
                                        </div>
                                        {po.user?.name ||
                                            po.user?.username ||
                                            "-"}
                                    </div>
                                </TableCell>
                                <TableCell
                                    class="text-right font-bold font-mono text-foreground"
                                >
                                    {controller.formatRp(po.totalAmount)}
                                </TableCell>
                                <TableCell class="text-right">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            class={buttonVariants({
                                                variant: "ghost",
                                                size: "icon",
                                            })}
                                        >
                                            <span class="sr-only"
                                                >Open menu</span
                                            >
                                            <MoreHorizontal class="h-4 w-4" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            <DropdownMenu.Label
                                                >Aksi</DropdownMenu.Label
                                            >
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    goto(`/purchases/${po.id}`)}
                                            >
                                                <Eye class="mr-2 h-4 w-4" /> Lihat
                                                Detail
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item
                                                class="text-red-500 focus:text-red-500"
                                                onclick={() =>
                                                    controller.handleDelete(
                                                        po.id,
                                                    )}
                                            >
                                                <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4">
            {#if controller.loading}
                {#each Array(3) as _}
                    <div class="h-32 bg-card animate-pulse rounded-xl"></div>
                {/each}
            {:else if controller.purchases.length === 0}
                <div
                    class="text-center p-12 bg-muted/20 rounded-xl border border-dashed"
                >
                    <p class="text-muted-foreground">
                        Belum ada riwayat pembelian.
                    </p>
                </div>
            {:else}
                {#each controller.purchases as po}
                    <div
                        class="bg-card rounded-xl border shadow-sm p-4 active:scale-[0.99] transition-transform relative overflow-hidden"
                    >
                        <div class="flex justify-between items-start mb-3">
                            <div
                                class="font-mono font-bold text-violet-600 text-sm"
                            >
                                #{po.notes || po.id}
                            </div>
                            <div
                                class="flex items-center gap-1.5 text-xs text-muted-foreground"
                            >
                                <Calendar class="h-3.5 w-3.5" />
                                {controller.formatDate(po.date)}
                            </div>
                        </div>

                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <div class="font-semibold text-foreground">
                                    {po.supplier?.name || "Unknown"}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground flex items-center gap-1 mt-1"
                                >
                                    <User class="h-3 w-3" />
                                    {po.user?.name || po.user?.username || "-"}
                                </div>
                            </div>
                            <Badge
                                variant="secondary"
                                class="font-normal text-xs h-6"
                            >
                                {po.items?.length || 0} Item
                            </Badge>
                        </div>

                        <div
                            class="flex justify-between items-end border-t pt-3 mt-2"
                        >
                            <div>
                                <p class="text-xs text-muted-foreground mb-1">
                                    Total Nominal
                                </p>
                                <p
                                    class="text-lg font-bold text-foreground font-mono"
                                >
                                    {controller.formatRp(po.totalAmount)}
                                </p>
                            </div>
                            <div class="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    class="h-8 w-8 p-0"
                                    onclick={() => goto(`/purchases/${po.id}`)}
                                >
                                    <Eye class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    class="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onclick={() =>
                                        controller.handleDelete(po.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>
