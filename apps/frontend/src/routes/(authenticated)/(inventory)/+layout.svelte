<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();

    // Inventory domain: products, categories, brands, suppliers, inventory, purchase-returns
    const allowedRoles = ["owner", "manager", "warehouse", "super_admin"];

    $effect(() => {
        if (browser && authStore.isAuthenticated && !authStore.loading) {
            if (!authStore.hasRole(allowedRoles)) {
                goto(authStore.getRedirectPath());
            }
        }
    });
</script>

{@render children()}
