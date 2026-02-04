<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { Trash2, Plus } from "lucide-svelte";
    import Combobox from "$lib/components/ui/combobox.svelte";
    import CurrencyInput from "$lib/components/custom/currency-input.svelte";
    import { fade } from "svelte/transition";

    let {
        categoryName,
        categoryId,
        items = $bindable([]),
        products = [],
        supplierId,
        supplierPrioritizedNames = [],
    } = $props();

    // Filter products for this category
    let categoryProducts = $derived(
        products.filter((p: any) => p.categoryId === categoryId),
    );

    // Build options similar to the main page logic, but scoped to this category
    let options = $derived.by(() => {
        const prioritySet = new Set(supplierPrioritizedNames);
        const opts: any[] = [];

        for (const p of categoryProducts) {
            // For now, simpler logic: just show products and their variants
            // If we want "Supplier A sells Original", we check if we have that logic.
            // The user said: "Variant: After selecting product, display variants belonging to Supplier A"
            // But we are pre-generating options here for a Combobox.

            // Strategy:
            // 1. Show existing variants
            // 2. Mark as priority if in prioritySet (history)
            // 3. Allow "New Variant"

            if (p.variants?.length) {
                for (const v of p.variants) {
                    opts.push({
                        value: `${p.id}::${v.id}`,
                        label: `${p.name} - ${v.name}`,
                        product: p,
                        variant: v,
                        isPriority: prioritySet.has(v.name),
                    });
                }
            } else {
                // No variants yet, allow selecting just product (will prompt for variant creation?)
                // Or actually, system always expects a variant name for the purchase item logic from previous code.
                opts.push({
                    value: `${p.id}::new::Original`, // Default
                    label: `${p.name} - Original (New)`,
                    product: p,
                    variantName: "Original",
                    isNew: true,
                });
            }
        }

        return opts.sort((a, b) => {
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return a.label.localeCompare(b.label);
        });
    });

    function addItem() {
        items = [
            ...items,
            {
                productId: "",
                productName: "",
                variantId: "",
                variantName: "",
                qty: 1,
                buyPrice: 0,
                sellPrice: 0,
            },
        ];
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    function onSelect(index: number, val: string) {
        if (!val) return;
        const parts = val.split("::");
        const productId = parts[0];
        const isNew = parts[1] === "new";

        const prod = products.find((p: any) => p.id === productId);
        if (!prod) return;

        items[index].productId = productId;
        items[index].productName = prod.name;

        if (isNew) {
            items[index].variantId = "";
            items[index].variantName = parts[2] || "Original";
            items[index].isNewVariant = true;
        } else {
            const variantId = parts[1];
            const v = prod.variants?.find((v: any) => v.id === variantId);
            items[index].variantId = variantId;
            items[index].variantName = v?.name || "";
            items[index].isNewVariant = false;
            if (v?.defaultPrice) items[index].sellPrice = v.defaultPrice;
        }
    }

    function formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }
</script>

<div
    class="border rounded-xl overflow-hidden shadow-sm bg-card/40 mb-6 theme-border"
>
    <div class="bg-muted/30 p-4 flex justify-between items-center border-b">
        <h3 class="font-bold text-lg flex items-center gap-2">
            <div class="h-3 w-3 rounded-full bg-violet-500"></div>
            {categoryName}
        </h3>
        <Button size="sm" variant="outline" onclick={addItem} class="h-8">
            <Plus class="w-4 h-4 mr-1" /> Tambah Baris
        </Button>
    </div>

    <div class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
            <thead
                class="bg-muted/20 text-xs uppercase text-muted-foreground border-b"
            >
                <tr>
                    <th class="p-3 text-left w-[40%]">Produk & Varian</th>
                    <th class="p-3 text-center w-[15%]">Qty</th>
                    <th class="p-3 text-right w-[20%]">Harga Beli</th>
                    <th class="p-3 text-right w-[20%]">Harga Jual</th>
                    <th class="p-3 w-[5%]"></th>
                </tr>
            </thead>
            <tbody class="divide-y relative">
                {#if items.length === 0}
                    <tr>
                        <td
                            colspan="5"
                            class="p-8 text-center text-muted-foreground italic"
                        >
                            Klik "Tambah Baris" untuk input barang kategori {categoryName}
                        </td>
                    </tr>
                {/if}
                {#each items as item, i}
                    <tr class="group hover:bg-muted/20 transition-colors">
                        <td class="p-2 pl-4 align-top">
                            <Combobox
                                items={options}
                                value={item.variantId
                                    ? `${item.productId}::${item.variantId}`
                                    : item.productId}
                                placeholder="Cari Produk..."
                                onSelect={(opt) => onSelect(i, opt?.value)}
                                class="w-full"
                            />
                            {#if item.productId}
                                <div
                                    in:fade={{ duration: 200 }}
                                    class="mt-1 flex gap-2"
                                >
                                    <Input
                                        class="h-7 text-xs bg-transparent border-0 border-b rounded-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
                                        placeholder="Nama Varian (Editable)"
                                        bind:value={item.variantName}
                                    />
                                </div>
                            {/if}
                        </td>
                        <td class="p-2 align-top">
                            <Input
                                type="number"
                                class="h-9 text-center"
                                min="1"
                                bind:value={item.qty}
                            />
                        </td>
                        <td class="p-2 align-top">
                            <CurrencyInput
                                class="h-9"
                                bind:value={item.buyPrice}
                            />
                            <div
                                class="text-[10px] text-muted-foreground text-right mt-1"
                            >
                                {formatRp(item.qty * item.buyPrice)}
                            </div>
                        </td>
                        <td class="p-2 align-top">
                            <CurrencyInput
                                class="h-9"
                                bind:value={item.sellPrice}
                            />
                        </td>
                        <td class="p-2 align-top text-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onclick={() => removeItem(i)}
                            >
                                <Trash2 class="w-4 h-4" />
                            </Button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
