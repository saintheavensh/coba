<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-svelte";
    import { api } from "$lib/api";
    import { toast } from "svelte-sonner";
    import { API_URL } from "$lib/api";

    let {
        value = $bindable(""),
        disabled = false,
        folder = "misc",
    }: { value: string; disabled?: boolean; folder?: string } = $props();

    let isUploading = $state(false);
    let fileInput: HTMLInputElement;

    async function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        isUploading = true;

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (folder) {
                formData.append("folder", folder);
            }

            const res = await api.post("/uploads", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success && res.data.data.url) {
                value = res.data.data.url;
                toast.success("Gambar berhasil diupload");
            } else {
                toast.error("Gagal mengupload gambar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengupload gambar");
        } finally {
            isUploading = false;
            // Reset input so same file can be selected again if needed
            input.value = "";
        }
    }

    function removeImage() {
        value = "";
    }
</script>

<div class="w-full">
    {#if value}
        <div
            class="relative w-40 h-40 group rounded-lg overflow-hidden border bg-muted/20"
        >
            <img
                src={value.startsWith("http") ? value : `${API_URL}${value}`}
                alt="Upload preview"
                class="w-full h-full object-cover"
            />
            <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
                <Button
                    variant="destructive"
                    size="icon"
                    class="rounded-full"
                    onclick={removeImage}
                    disabled={disabled || isUploading}
                >
                    <X class="h-4 w-4" />
                </Button>
            </div>
        </div>
    {:else}
        <button
            type="button"
            class="w-40 h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onclick={() => fileInput?.click()}
            disabled={disabled || isUploading}
        >
            {#if isUploading}
                <Loader2 class="h-8 w-8 animate-spin" />
                <span class="text-xs">Uploading...</span>
            {:else}
                <Upload class="h-8 w-8" />
                <span class="text-xs font-medium">Upload Gambar</span>
            {/if}
        </button>
    {/if}

    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        class="hidden"
        onchange={handleFileChange}
        disabled={disabled || isUploading}
    />
</div>
