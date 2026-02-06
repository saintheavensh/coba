<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Finance domain: accounting, reports, operational-costs
    const allowedRoles = ["owner", "manager", "cashier", "super_admin"];

    onMount(() => {
        if (!authStore.hasRole(allowedRoles)) {
            goto("/unauthorized");
        }
    });
</script>

<slot />
