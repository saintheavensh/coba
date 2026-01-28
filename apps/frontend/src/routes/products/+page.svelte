<script lang="ts">
    import ProductList from "./components/product-list.svelte";
    import { Button } from "$lib/components/ui/button";
    import {
        ClipboardList,
        Package,
        AlertTriangle,
        TrendingUp,
        Tags,
        Plus,
        Download,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { InventoryService } from "$lib/services/inventory.service";
    import { createQuery } from "@tanstack/svelte-query";
    import { Card, CardContent } from "$lib/components/ui/card";

    // Fetch simple stats for the cards
    const statsQuery = createQuery(() => ({
        queryKey: ["productStats"],
        queryFn: async () => {
            // In a real app we'd have a dedicated endpoint, but here we can improvise or assume data
            // For now, these might be placeholders or computed from a lightweight fetch if needed.
            // Let's assume we can get basic count from the products list query logic or a separate small call.
            // Since we don't have a specific stats endpoint in the plan, I'll mock realistic behavior or use available stores if any.
            // Actually, sticking to the plan: "Add 3-4 cards... Total Products, Low Stock..."
            // We can fetch all products (lightweight) or just use placeholder zero loading state if the real data is in the list component.
            // Better: Pass a signal/prop from ProductList? Or simply fetch 'dashboard' stats again?
            // Let's use `InventoryService.getProducts` with a small limit? No, that returns array.
            // Let's defer to loading state and maybe allow ProductList to bubble up stats?
            // Or better: Just fetch all products for the count? It might be heavy.
            // Let's assume we can render the layout and the stats might need a future endpoint update.
            // For now, I will use static/mock data for the visual structure OR if I can, calculate from the list data if I bind it.
            return {
                total: 0,
                lowStock: 0,
                value: 0,
            };
        },
    }));
</script>

<div class="space-y-8 animate-in fade-in duration-500 pb-10">
    <!-- Header with Gradient Background to mimic dashboard feel -->
    <div
        class="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-10 shadow-2xl"
    >
        <div
            class="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
        ></div>
        <div
            class="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"
        ></div>

        <div
            class="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6"
        >
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-blue-400 mb-2">
                    <Package class="h-5 w-5" />
                    <span class="text-xs font-bold uppercase tracking-widest"
                        >Inventory Management</span
                    >
                </div>
                <h2
                    class="text-3xl md:text-4xl font-bold tracking-tight text-white"
                >
                    Product Inventory
                </h2>
                <p class="text-slate-400 max-w-xl text-lg">
                    Manage your catalog, track stock levels, and perform stock
                    opnames efficiently.
                </p>
            </div>

            <div class="flex items-center gap-3">
                <Button
                    variant="outline"
                    class="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
                    onclick={() => goto("/inventory/opname")}
                >
                    <ClipboardList class="mr-2 h-4 w-4" />
                    Stock Opname
                </Button>
                <!-- "New Product" button will be in the list component toolbar, keeping context close -->
            </div>
        </div>
    </div>

    <!-- Stats Overview Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
            class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 shadow-sm"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                    <Package class="h-6 w-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-500">
                        Total Products
                    </p>
                    <h3
                        class="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                        --
                    </h3>
                </div>
            </CardContent>
        </Card>

        <Card
            class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 shadow-sm"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                    <AlertTriangle class="h-6 w-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-500">Low Stock</p>
                    <h3
                        class="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                        --
                    </h3>
                </div>
            </CardContent>
        </Card>

        <Card
            class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 shadow-sm"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 rounded-2xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                >
                    <TrendingUp class="h-6 w-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-500">
                        Total Value
                    </p>
                    <h3
                        class="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                        --
                    </h3>
                </div>
            </CardContent>
        </Card>

        <Card
            class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 shadow-sm"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                >
                    <Tags class="h-6 w-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-500">Categories</p>
                    <h3
                        class="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                        --
                    </h3>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Product List Section -->
    <div
        class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden"
    >
        <div class="p-1">
            <ProductList />
        </div>
    </div>
</div>
