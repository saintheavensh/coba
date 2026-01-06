<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Upload, X, Image as ImageIcon } from "lucide-svelte";
    import { api } from "$lib/api";
    import { toast } from "svelte-sonner";

    // Props
    let {
        value = $bindable(""), // URL
        disabled = false,
    } = $props();

    let uploading = $state(false);
    let fileInput: HTMLInputElement;

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar (JPG, PNG, WebP)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            // 5MB
            toast.error("Ukuran file maksimal 5MB");
            return;
        }

        uploading = true;
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Adjust depending on your API structure (standardized vs basic)
            // Backend returns apiSuccess(c, { url }) -> res.data.data.url
            const url = res.data?.data?.url || res.data?.url;

            if (url) {
                // Ensure absolute URL if backend returns relative
                // const fullUrl = url.startsWith("http") ? url : `${import.meta.env.VITE_API_BASE_URL}${url}`;
                // Actually, backend serves static at VITE_API_BASE_URL + /uploads/...
                // If backend returns `/uploads/foo.jpg`, we need to prepend API Base URL for frontend to see it properly?
                // Or works via proxy?
                // Usually easier to store full URL or just relative and component handles it.
                // Let's store full URL constructed here.
                const baseUrl =
                    import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
                    "http://localhost:4000";
                const fullUrl = url.startsWith("http")
                    ? url
                    : `${baseUrl}${url}`;

                value = fullUrl;
                toast.success("Foto berhasil diupload");
            } else {
                toast.error("Gagal mendapatkan URL gambar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal upload gambar");
        } finally {
            uploading = false;
            if (fileInput) fileInput.value = "";
        }
    }

    function removeImage() {
        value = "";
    }
</script>

<div class="grid gap-2">
    {#if value}
        <div
            class="relative w-full h-48 border rounded-lg overflow-hidden group bg-muted/20"
        >
            <img
                src={value}
                alt="Preview"
                class="w-full h-full object-contain"
                onerror={(e) =>
                    ((e.currentTarget as HTMLImageElement).src = "")}
            />
            {#if !disabled}
                <Button
                    variant="destructive"
                    size="icon"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onclick={removeImage}
                >
                    <X class="h-4 w-4" />
                </Button>
            {/if}
        </div>
        <div class="text-xs text-muted-foreground break-all">
            {value}
        </div>
    {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/5 transition-colors"
            onclick={() => !disabled && fileInput.click()}
        >
            <div class="p-4 rounded-full bg-muted">
                <Upload class="h-6 w-6 text-muted-foreground" />
            </div>
            <div class="text-center">
                <p class="text-sm font-medium">Klik untuk upload foto</p>
                <p class="text-xs text-muted-foreground">
                    JPG, PNG atau WebP (Max 5MB)
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                class="mt-2"
                disabled={disabled || uploading}
            >
                {uploading ? "Mengupload..." : "Pilih File"}
            </Button>
        </div>
    {/if}

    <input
        type="file"
        bind:this={fileInput}
        accept="image/*"
        class="hidden"
        onchange={handleFileSelect}
        {disabled}
    />
</div>
