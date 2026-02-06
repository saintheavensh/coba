<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Settings domain: settings, employees, admin
    const allowedRoles = ["owner", "super_admin"];

    onMount(() => {
        if (!authStore.hasRole(allowedRoles)) {
            goto("/unauthorized");
        }
    });
</script>

<slot />
