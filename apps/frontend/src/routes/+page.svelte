<script lang="ts">
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Package,
        ShoppingBag,
        DollarSign,
        ArrowUpRight,
        ArrowRight,
        MousePointer2,
        Cable,
        Keyboard,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
</script>

<div class="flex flex-col gap-8">
    <!-- Stats Cards -->
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
                View Full Inventory <ArrowRight class="ml-1 h-4 w-4" />
            </a>
        </div>

        <Card class="border-border/5 shadow-sm">
            <Table>
                <TableHeader class="bg-muted/30">
                    <TableRow>
                        <TableHead class="w-[300px]">PRODUCT NAME</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>CURRENT STOCK</TableHead>
                        <TableHead>MIN THRESHOLD</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead class="text-right">ACTION</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <!-- Row 1 -->
                    <TableRow>
                        <TableCell>
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                                >
                                    <MousePointer2 class="h-5 w-5" />
                                </div>
                                <div>
                                    <div class="font-medium">
                                        Wireless Mouse
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        Logitech
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell
                            class="font-mono text-xs text-muted-foreground"
                            >WM-001</TableCell
                        >
                        <TableCell class="font-bold text-red-600">4</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                class="bg-red-50 text-red-600 border-red-200 hover:bg-red-50"
                                >Critical</Badge
                            >
                        </TableCell>
                        <TableCell class="text-right">
                            <Button
                                size="sm"
                                class="bg-blue-600 text-white hover:bg-blue-700"
                                >Restock</Button
                            >
                        </TableCell>
                    </TableRow>

                    <!-- Row 2 -->
                    <TableRow>
                        <TableCell>
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                                >
                                    <Cable class="h-5 w-5" />
                                </div>
                                <div>
                                    <div class="font-medium">USB-C Cable</div>
                                    <div class="text-xs text-muted-foreground">
                                        Anker
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell
                            class="font-mono text-xs text-muted-foreground"
                            >US-099</TableCell
                        >
                        <TableCell class="font-bold text-orange-600"
                            >2</TableCell
                        >
                        <TableCell>20</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                class="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50"
                                >Low</Badge
                            >
                        </TableCell>
                        <TableCell class="text-right">
                            <Button
                                size="sm"
                                class="bg-blue-600 text-white hover:bg-blue-700"
                                >Restock</Button
                            >
                        </TableCell>
                    </TableRow>

                    <!-- Row 3 -->
                    <TableRow>
                        <TableCell>
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                                >
                                    <Keyboard class="h-5 w-5" />
                                </div>
                                <div>
                                    <div class="font-medium">
                                        Mechanical Keyboard
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        Keychron
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell
                            class="font-mono text-xs text-muted-foreground"
                            >MK-204</TableCell
                        >
                        <TableCell class="font-bold text-orange-600"
                            >5</TableCell
                        >
                        <TableCell>15</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                class="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50"
                                >Low</Badge
                            >
                        </TableCell>
                        <TableCell class="text-right">
                            <Button
                                size="sm"
                                class="bg-blue-600 text-white hover:bg-blue-700"
                                >Restock</Button
                            >
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div class="flex items-center justify-between border-t p-4">
                <div class="text-sm text-muted-foreground">
                    Showing <span class="font-medium">1</span> to
                    <span class="font-medium">3</span>
                    of <span class="font-medium">12</span> results
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled
                        >Previous</Button
                    >
                    <Button variant="outline" size="sm">Next</Button>
                </div>
            </div>
        </Card>
    </div>
</div>
