<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();

    // Service domain: service, service-tools, devices, warranty
    const allowedRoles = ["owner", "manager", "teknisi", "super_admin"];

    $effect(() => {
        if (browser && authStore.isAuthenticated && !authStore.loading) {
            if (!authStore.hasRole(allowedRoles)) {
                goto(authStore.getRedirectPath());
            }
        }
    });
</script>

{@render children()}
