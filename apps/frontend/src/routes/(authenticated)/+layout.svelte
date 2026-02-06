<script lang="ts">
    import { authStore } from "$lib/features/auth/auth.svelte";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import SuperAdminLayout from "$lib/shared/layouts/SuperAdminLayout.svelte";
    import SpecializedLayout from "$lib/shared/layouts/SpecializedLayout.svelte";

    let { children } = $props();

    const role = $derived(authStore.role);

    // Explicit list of roles that should see the Specialized Layout
    const isSpecializedRole = $derived(
        ["teknisi", "kasir", "warehouse", "owner", "manager"].includes(
            role as string,
        ),
    );

    // Guard Logic:
    // If Super Admin tries to access non-superadmin paths (except logout), redirect?
    // (Existing logic preserved but guarded)
    $effect(() => {
        if (
            browser &&
            authStore.isAuthenticated &&
            authStore.hasRole("super_admin") &&
            !authStore.loading
        ) {
            const pathname = $page.url.pathname;
            // Ensure superadmin stays in /superadmin for dashboard stuff if that's the intention
            // But if they are accessing shared routes like /finance, they can?
            // The original logic forced redirect to /superadmin if not startswith /superadmin.
            // I will keep it as is.
            if (!pathname.startsWith("/superadmin") && pathname !== "/logout") {
                goto("/superadmin" + (pathname === "/" ? "" : pathname));
            }
        }
    });

    const isReady = $derived(
        browser && authStore.isAuthenticated && !authStore.loading && !!role,
    );
</script>

{#if !isReady}
    <!-- Prevent Flash: Render nothing or a minimal transparent shell while determining role -->
    <div class="h-screen w-full bg-slate-950"></div>
{:else if isSpecializedRole}
    <SpecializedLayout {children} />
{:else}
    <SuperAdminLayout {children} />
{/if}
