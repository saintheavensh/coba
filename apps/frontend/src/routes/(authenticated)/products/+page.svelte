<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    // Simple redirect based on role
    // In a real app, this would check the user object from the session/auth store
    onMount(() => {
        const user = (page.data.user as any) || { role: "owner" }; // Default to owner/manager if not specified for test

        switch (user.role) {
            case "owner":
            case "manager":
            case "super_admin":
                goto("/manager/products", { replaceState: true });
                break;
            case "warehouse":
            case "supervisor":
                goto("/warehouse/products", { replaceState: true });
                break;
            case "teknisi":
                goto("/teknisi/parts", { replaceState: true });
                break;
            case "kasir":
                goto("/kasir", { replaceState: true });
                break;
            default:
                goto("/dashboard", { replaceState: true });
        }
    });
</script>

<div class="flex items-center justify-center min-h-[400px]">
    <div class="flex flex-col items-center gap-2">
        <span
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></span>
        <p class="text-slate-500">Redirecting to your product view...</p>
    </div>
</div>
