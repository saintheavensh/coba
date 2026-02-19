<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();

    // Sales domain: purchases, sales, customers
    const allowedRoles = ["owner", "manager", "kasir", "super_admin"];

    $effect(() => {
        if (browser && authStore.isAuthenticated && !authStore.loading) {
            if (!authStore.hasRole(allowedRoles)) {
                goto(authStore.getRedirectPath());
            }
        }
    });
</script>

{@render children()}
