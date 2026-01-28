<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import SiteHeader from "$lib/components/site-header.svelte";
	import { Toaster } from "$lib/components/ui/sonner";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	import { browser } from "$app/environment";

	import { page } from "$app/stores";

	import { cn } from "$lib/utils";
	import { uiStore } from "$lib/stores/ui.svelte";

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				// Freshness - stale after 1 min for better UX (no instant refetch on window focus spam)
				staleTime: 5 * 1000,
			},
		},
	});

	// Auth Guard - Check authentication via cookie (stored in HTTP-only cookie, user info in localStorage)
	$effect(() => {
		if (browser) {
			const user = localStorage.getItem("user");
			const isLoginPage = $page.url.pathname.startsWith("/login");

			// If no user in localStorage and not on login page, redirect to login
			if (!user && !isLoginPage) {
				window.location.href = "/login";
				return;
			}

			// If user exists and on login page, redirect to home
			if (user && isLoginPage) {
				window.location.href = "/";
				return;
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	{#if $page.url.pathname.startsWith("/login")}
		<div
			class="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 p-4"
		>
			{@render children()}
		</div>
		<Toaster />
	{:else}
		<div class="flex h-screen w-full bg-slate-950 overflow-hidden">
			<!-- Floating Sidebar (Merged Background) -->
			<aside
				class={cn(
					"hidden lg:block flex-shrink-0 h-full transition-all duration-300 ease-in-out",
					uiStore.isSidebarCollapsed ? "w-[70px]" : "w-64",
				)}
			>
				<AppSidebar />
			</aside>

			<!-- Main Content Area (Floating Card) -->
			<div class="flex-1 h-full py-3 pr-3 pl-0">
				<div
					class="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950/50 rounded-[32px] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-2xl relative backdrop-blur-sm"
				>
					<SiteHeader />

					<!-- Main Scrollable Content -->
					<main class="flex-1 overflow-y-auto overflow-x-hidden">
						<div class="p-6 md:p-8 max-w-7xl mx-auto w-full">
							{@render children()}
						</div>
					</main>
				</div>
			</div>
			<Toaster />
		</div>
	{/if}
</QueryClientProvider>
