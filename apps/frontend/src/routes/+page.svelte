<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Package,
        ShoppingBag,
        DollarSign,
        ArrowUpRight,
        ArrowRight,
        MousePointer2,
        Cable,
        Keyboard,
        Smartphone,
        Wrench,
        CheckCircle2,
        Clock,
        AlertCircle,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";

    // Mock Service Stats
    const serviceStats = {
        active: 12,
        completedToday: 5,
        totalIncomeToday: 2500000,
        pendingQC: 3,
    };

    const recentServices = [
        {
            id: 1,
            no: "SRV-2026-005",
            device: "iPhone 13",
            status: "Proses",
            tech: "Agus",
        },
        {
            id: 2,
            no: "SRV-2026-004",
            device: "Samsung A52",
            status: "Menunggu",
            tech: "-",
        },
        {
            id: 3,
            no: "SRV-2026-003",
            device: "Xiaomi Poco F3",
            status: "Selesai",
            tech: "Rudi",
        },
    ];
</script>

<div class="flex flex-col gap-8">
    <!-- SERVICE SECTION -->
    <div class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight">Service Overview</h2>
        <div class="grid gap-6 md:grid-cols-4">
            <Card class="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Active Services</span
                        >
                        <Wrench class="h-4 w-4 text-blue-500" />
                    </div>
                    <div class="mt-2 text-2xl font-bold">
                        {serviceStats.active}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        Unit dalam pengerjaan
                    </p>
                </CardContent>
            </Card>

            <Card class="border-l-4 border-l-green-500 shadow-sm">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Completed Today</span
                        >
                        <CheckCircle2 class="h-4 w-4 text-green-500" />
                    </div>
                    <div class="mt-2 text-2xl font-bold">
                        {serviceStats.completedToday}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        +2 dari kemarin
                    </p>
                </CardContent>
            </Card>

            <Card class="border-l-4 border-l-orange-500 shadow-sm">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Pendapatan Service</span
                        >
                        <DollarSign class="h-4 w-4 text-orange-500" />
                    </div>
                    <div class="mt-2 text-2xl font-bold">
                        Rp {serviceStats.totalIncomeToday.toLocaleString()}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">Hari ini</p>
                </CardContent>
            </Card>

            <Card class="border-l-4 border-l-yellow-500 shadow-sm">
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Pending QC</span
                        >
                        <AlertCircle class="h-4 w-4 text-yellow-500" />
                    </div>
                    <div class="mt-2 text-2xl font-bold">
                        {serviceStats.pendingQC}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        Butuh pengecekan
                    </p>
                </CardContent>
            </Card>
        </div>
    </div>

    <Separator />

    <!-- INVENTORY SECTION (Existing) -->
    <div class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight">Inventory Overview</h2>
        <div class="grid gap-6 md:grid-cols-3">
            <!-- Card 1: Total Products -->
            <Card
                class="border-border/5 shadow-sm hover:shadow-md transition-shadow"
            >
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Total Products</span
                        >
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600"
                        >
                            <Package class="h-4 w-4" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-bold">1,240</span>
                    </div>
                    <div
                        class="mt-1 flex items-center text-xs text-green-600 font-medium"
                    >
                        <ArrowUpRight class="mr-1 h-3 w-3" />
                        12% from last month
                    </div>
                </CardContent>
            </Card>

            <!-- Card 2: Total Purchases -->
            <Card
                class="border-border/5 shadow-sm hover:shadow-md transition-shadow"
            >
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Total Purchases (Oct)</span
                        >
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600"
                        >
                            <ShoppingBag class="h-4 w-4" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-bold">$12,450</span>
                    </div>
                    <div
                        class="mt-1 flex items-center text-xs text-muted-foreground"
                    >
                        +2 orders pending
                    </div>
                </CardContent>
            </Card>

            <!-- Card 3: Total Sales -->
            <Card
                class="border-border/5 shadow-sm hover:shadow-md transition-shadow"
            >
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >Total Sales (Oct)</span
                        >
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600"
                        >
                            <DollarSign class="h-4 w-4" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-bold">$34,200</span>
                    </div>
                    <div
                        class="mt-1 flex items-center text-xs text-green-600 font-medium"
                    >
                        <ArrowUpRight class="mr-1 h-3 w-3" />
                        8% from last month
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
        <!-- Low Stock Alerts -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold tracking-tight">
                    Low Stock Alerts
                </h2>
                <a
                    href="/products"
                    class="flex items-center text-sm font-medium text-blue-600 hover:underline"
                >
                    View Full <ArrowRight class="ml-1 h-4 w-4" />
                </a>
            </div>

            <Card class="border-border/5 shadow-sm">
                <Table>
                    <TableHeader class="bg-muted/30">
                        <TableRow>
                            <TableHead>PRODUCT</TableHead>
                            <TableHead>STOCK</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead class="text-right">ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <!-- Row 1 -->
                        <TableRow>
                            <TableCell>
                                <div class="font-medium">Wireless Mouse</div>
                                <div class="text-xs text-muted-foreground">
                                    WM-001
                                </div>
                            </TableCell>
                            <TableCell class="font-bold text-red-600"
                                >4</TableCell
                            >
                            <TableCell
                                ><Badge
                                    variant="outline"
                                    class="text-red-600 border-red-200"
                                    >Critical</Badge
                                ></TableCell
                            >
                            <TableCell class="text-right"
                                ><Button size="sm" variant="ghost"
                                    >Restock</Button
                                ></TableCell
                            >
                        </TableRow>
                        <!-- Row 2 -->
                        <TableRow>
                            <TableCell>
                                <div class="font-medium">USB-C Cable</div>
                                <div class="text-xs text-muted-foreground">
                                    US-099
                                </div>
                            </TableCell>
                            <TableCell class="font-bold text-orange-600"
                                >2</TableCell
                            >
                            <TableCell
                                ><Badge
                                    variant="outline"
                                    class="text-orange-600 border-orange-200"
                                    >Low</Badge
                                ></TableCell
                            >
                            <TableCell class="text-right"
                                ><Button size="sm" variant="ghost"
                                    >Restock</Button
                                ></TableCell
                            >
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>
        </div>

        <!-- Recent Services -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold tracking-tight">
                    Recent Services
                </h2>
                <a
                    href="/service"
                    class="flex items-center text-sm font-medium text-blue-600 hover:underline"
                >
                    View All <ArrowRight class="ml-1 h-4 w-4" />
                </a>
            </div>

            <Card class="border-border/5 shadow-sm">
                <Table>
                    <TableHeader class="bg-muted/30">
                        <TableRow>
                            <TableHead>DEVICE</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead>TEKNISI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each recentServices as s}
                            <TableRow>
                                <TableCell>
                                    <div class="font-medium">{s.device}</div>
                                    <div class="text-xs text-muted-foreground">
                                        {s.no}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{s.status}</Badge
                                    >
                                </TableCell>
                                <TableCell>{s.tech}</TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </Card>
        </div>
    </div>
</div>
