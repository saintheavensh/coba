<script lang="ts">
    import AppSidebar from "$lib/shared/components/nav/app-sidebar.svelte";
    import SiteHeader from "$lib/shared/components/nav/site-header.svelte";
    import { cn } from "$lib/shared/core/utils";
    import { uiStore } from "$lib/shared/components/nav/ui-store.svelte";

    let { children } = $props();
</script>

<div class="flex h-screen w-full bg-slate-950 overflow-hidden relative">
    <aside
        class={cn(
            "hidden lg:block flex-shrink-0 h-full transition-all duration-300 ease-in-out relative z-20",
            uiStore.isSidebarCollapsed ? "w-[70px]" : "w-64",
        )}
    >
        <AppSidebar />
    </aside>

    <div class="flex-1 h-full py-4 pr-4 pl-4 lg:pl-0 relative z-10">
        <div
            class="flex flex-col h-full w-full bg-white/70 dark:bg-slate-900/40 rounded-[40px] border border-white/20 dark:border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl relative"
        >
            <SiteHeader />
            <main
                class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
            >
                <div class="p-6 md:p-10 max-w-7xl mx-auto w-full">
                    {@render children()}
                </div>
            </main>
        </div>
    </div>
</div>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 6px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
