<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();

    // Settings domain: settings, employees, admin
    const allowedRoles = ["owner", "super_admin", "manager"];

    $effect(() => {
        if (browser && authStore.isAuthenticated && !authStore.loading) {
            if (!authStore.hasRole(allowedRoles)) {
                goto(authStore.getRedirectPath());
            }
        }
    });
</script>

{@render children()}
