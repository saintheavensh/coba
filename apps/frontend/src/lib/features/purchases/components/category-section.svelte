<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { Trash2, Plus } from "lucide-svelte";
    import Combobox from "$lib/shared/components/ui/combobox.svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { fade } from "svelte/transition";
    import { Label } from "$lib/shared/components/ui/label";

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

    // Product Options (Just Products)
    let productOptions = $derived(
        categoryProducts
            .map((p: any) => ({
                value: p.id,
                label: p.name,
                product: p,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    );

    // Helper to get variants for a selected product
    function getVariantOptions(productId: string) {
        const prod = products.find((p: any) => p.id === productId);
        if (!prod) return [];

        const opts = [];
        const prioritySet = new Set(supplierPrioritizedNames);

        if (prod.variants?.length) {
            for (const v of prod.variants) {
                opts.push({
                    value: v.id,
                    label: v.name,
                    variant: v,
                    isPriority: prioritySet.has(v.name),
                });
            }
        }

        // Add "New Variant" option
        opts.push({
            value: "new",
            label: "+ Buat Varian Baru",
            isNew: true,
        });

        return opts.sort((a, b) => {
            if (a.isNew) return 1; // Always last
            if (b.isNew) return -1;
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return a.label.localeCompare(b.label);
        });
    }

    function addItem() {
        items = [
            ...items,
            {
                productId: "",
                productName: "",
                variantId: "",
                variantName: "",
                qtyOrdered: 1,
                estimatedBuyPrice: 0,
                targetSellPrice: 0,
                isNewVariant: false,
            },
        ];
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    // When Product is Selected
    function onProductSelect(index: number, productId: string) {
        if (!productId) return;
        const prod = products.find((p: any) => p.id === productId);
        if (!prod) return;

        items[index].productId = productId;
        items[index].productName = prod.name;

        // Reset variant relative fields
        items[index].variantId = "";
        items[index].variantName = "";
        items[index].isNewVariant = false;
        items[index].estimatedBuyPrice = 0;
        items[index].targetSellPrice = 0;

        // Auto-select if only one variant and it's not "new"?
        // Or if no variants exist, default to "New Variant" mode immediately?
        if (!prod.variants || prod.variants.length === 0) {
            items[index].variantId = "new";
            items[index].variantName = "Original";
            items[index].isNewVariant = true;
        }
    }

    // When Variant is Selected
    function onVariantSelect(index: number, val: string) {
        if (!val) return;

        const item = items[index];
        const prod = products.find((p: any) => p.id === item.productId);
        if (!prod) return;

        if (val === "new") {
            item.variantId = ""; // No ID yet
            item.variantName = ""; // Let user type
            item.isNewVariant = true;
            item.targetSellPrice = 0; // Clean slate
        } else {
            const v = prod.variants?.find((v: any) => v.id === val);
            if (v) {
                item.variantId = v.id;
                item.variantName = v.name;
                item.isNewVariant = false;
                item.targetSellPrice = v.defaultPrice || 0;
            }
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
                    <th class="p-3 text-left w-[25%]">Produk</th>
                    <th class="p-3 text-left w-[20%]">Varian</th>
                    <th class="p-3 text-center w-[10%]">Qty Order</th>
                    <th class="p-3 text-right w-[15%]">Est. Beli</th>
                    <th class="p-3 text-right w-[15%]">Target Jual</th>
                    <th class="p-3 w-[5%]"></th>
                </tr>
            </thead>
            <tbody class="divide-y relative">
                {#if items.length === 0}
                    <tr>
                        <td
                            colspan="6"
                            class="p-8 text-center text-muted-foreground italic"
                        >
                            Klik "Tambah Baris" untuk input barang kategori {categoryName}
                        </td>
                    </tr>
                {/if}
                {#each items as item, i}
                    <tr class="group hover:bg-muted/20 transition-colors">
                        <!-- Product Selection -->
                        <td class="p-2 pl-4 align-top">
                            <Combobox
                                items={productOptions}
                                value={item.productId}
                                placeholder="Pilih Produk..."
                                onSelect={(opt) =>
                                    onProductSelect(i, opt?.value)}
                                class="w-full"
                            />
                        </td>

                        <!-- Variant Selection -->
                        <td class="p-2 align-top">
                            {#if item.productId}
                                <div class="flex flex-col gap-2">
                                    <Combobox
                                        items={getVariantOptions(
                                            item.productId,
                                        )}
                                        value={item.isNewVariant
                                            ? "new"
                                            : item.variantId}
                                        placeholder="Pilih Varian..."
                                        onSelect={(opt) =>
                                            onVariantSelect(i, opt?.value)}
                                        class="w-full"
                                    />
                                    {#if item.isNewVariant}
                                        <div in:fade={{ duration: 200 }}>
                                            <Input
                                                class="h-7 text-xs bg-transparent border-0 border-b rounded-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
                                                placeholder="Nama Varian Baru (Wajib)"
                                                bind:value={item.variantName}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <span
                                    class="text-xs text-muted-foreground italic max-w-[100px] block pt-2"
                                    >Pilih produk dulu</span
                                >
                            {/if}
                        </td>

                        <td class="p-2 align-top">
                            <Input
                                type="number"
                                class="h-9 text-center"
                                min="1"
                                bind:value={item.qtyOrdered}
                            />
                        </td>
                        <td class="p-2 align-top">
                            <CurrencyInput
                                class="h-9"
                                bind:value={item.estimatedBuyPrice}
                            />
                            <div
                                class="text-[10px] text-muted-foreground text-right mt-1"
                            >
                                {formatRp(
                                    (item.qtyOrdered || 0) *
                                        (item.estimatedBuyPrice || 0),
                                )}
                            </div>
                        </td>
                        <td class="p-2 align-top">
                            <CurrencyInput
                                class="h-9"
                                bind:value={item.targetSellPrice}
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
