<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Inventory domain: products, categories, brands, suppliers, inventory, purchase-returns
    const allowedRoles = ["owner", "manager", "warehouse", "super_admin"];

    onMount(() => {
        if (!authStore.hasRole(allowedRoles)) {
            goto("/unauthorized");
        }
    });
</script>

<slot />
