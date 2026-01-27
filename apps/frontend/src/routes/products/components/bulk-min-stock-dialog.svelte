<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { InventoryService } from "$lib/services/inventory.service";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { AlertTriangle, Loader2, Package, Settings2 } from "lucide-svelte";

    // Props
    let { open = $bindable(false) } = $props();

    // Query client
    const queryClient = useQueryClient();

    // State
    let selectedCategoryId = $state("");
    let minStock = $state(5);
    let productCount = $state(0);
    let isLoadingCount = $state(false);

    // Categories query
    const categoriesQuery = createQuery(() => ({
        queryKey: ["categories"],
        queryFn: InventoryService.getCategories,
    }));

    let categories = $derived(categoriesQuery.data || []);

    // Filter to only leaf categories (no children)
    let leafCategories = $derived(
        categories.filter(
            (cat) => !categories.some((c) => c.parentId === cat.id),
        ),
    );

    // Mutation
    const bulkUpdateMutation = createMutation(() => ({
        mutationFn: ({
            categoryId,
            minStock,
        }: {
            categoryId: string;
            minStock: number;
        }) => InventoryService.bulkUpdateMinStock(categoryId, minStock),
        onSuccess: (updatedCount) => {
            toast.success(`${updatedCount} produk berhasil diperbarui`);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            handleClose();
        },
        onError: () => {
            toast.error("Gagal memperbarui minimum stok");
        },
    }));

    // Effects
    $effect(() => {
        if (selectedCategoryId) {
            fetchProductCount(selectedCategoryId);
        } else {
            productCount = 0;
        }
    });

    async function fetchProductCount(categoryId: string) {
        isLoadingCount = true;
        try {
            productCount =
                await InventoryService.getProductCountByCategory(categoryId);
        } catch (e) {
            productCount = 0;
        } finally {
            isLoadingCount = false;
        }
    }

    function handleClose() {
        open = false;
        selectedCategoryId = "";
        minStock = 5;
        productCount = 0;
    }

    function handleSubmit() {
        if (!selectedCategoryId) {
            toast.error("Pilih kategori terlebih dahulu");
            return;
        }
        if (productCount === 0) {
            toast.error("Tidak ada produk dalam kategori ini");
            return;
        }
        bulkUpdateMutation.mutate({ categoryId: selectedCategoryId, minStock });
    }

    let isSubmitting = $derived(bulkUpdateMutation.isPending);
    let selectedCategoryName = $derived(
        categories.find((c) => c.id === selectedCategoryId)?.name || "",
    );
</script>

<Dialog bind:open onOpenChange={(v) => !v && handleClose()}>
    <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
                <Settings2 class="h-5 w-5 text-primary" />
                Ubah Minimum Stok per Kategori
            </DialogTitle>
            <DialogDescription>
                Ubah batas minimum stok untuk semua produk dalam satu kategori
                sekaligus.
            </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-4">
            <!-- Category Selection -->
            <div class="space-y-2">
                <Label>Pilih Kategori</Label>
                <Select
                    type="single"
                    value={selectedCategoryId}
                    onValueChange={(v) => (selectedCategoryId = v)}
                >
                    <SelectTrigger class="w-full">
                        <span
                            class={selectedCategoryId
                                ? ""
                                : "text-muted-foreground"}
                        >
                            {selectedCategoryName || "Pilih kategori..."}
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        {#each leafCategories as cat}
                            <SelectItem value={cat.id}>{cat.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            <!-- Product Count Preview -->
            {#if selectedCategoryId}
                <div
                    class="rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                        >
                            <Package class="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">
                                Produk yang akan diubah
                            </div>
                            <div class="text-2xl font-bold text-primary">
                                {#if isLoadingCount}
                                    <Loader2 class="h-5 w-5 animate-spin" />
                                {:else}
                                    {productCount} produk
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Min Stock Input -->
            <div class="space-y-2">
                <Label for="minStock">Minimum Stok Baru</Label>
                <Input
                    id="minStock"
                    type="number"
                    bind:value={minStock}
                    min="0"
                    class="text-lg font-semibold"
                    placeholder="Masukkan angka"
                />
                <p class="text-xs text-muted-foreground">
                    Produk dengan stok di bawah nilai ini akan ditandai sebagai
                    "Menipis"
                </p>
            </div>

            <!-- Warning -->
            {#if productCount > 0 && selectedCategoryId}
                <div
                    class="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                >
                    <AlertTriangle
                        class="h-5 w-5 text-yellow-600 shrink-0 mt-0.5"
                    />
                    <div class="text-sm text-yellow-800">
                        <strong>Perhatian:</strong> Tindakan ini akan mengubah
                        minimum stok untuk
                        <strong>{productCount}</strong> produk dalam kategori
                        <strong>{selectedCategoryName}</strong>.
                    </div>
                </div>
            {/if}
        </div>

        <DialogFooter>
            <Button
                variant="outline"
                onclick={handleClose}
                disabled={isSubmitting}
            >
                Batal
            </Button>
            <Button
                onclick={handleSubmit}
                disabled={isSubmitting ||
                    !selectedCategoryId ||
                    productCount === 0}
                class="min-w-[140px]"
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    Simpan Perubahan
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
