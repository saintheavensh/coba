<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Service domain: service, service-tools, devices, warranty
    const allowedRoles = ["owner", "manager", "technician", "super_admin"];

    onMount(() => {
        if (!authStore.hasRole(allowedRoles)) {
            goto("/unauthorized");
        }
    });
</script>

<slot />
