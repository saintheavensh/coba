<script lang="ts">
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import SiteHeader from "$lib/components/site-header.svelte";
	import { Toaster } from "$lib/components/ui/sonner";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	import { browser } from "$app/environment";

	import { page } from "$app/stores";

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

	// Auth Guard
	$effect(() => {
		if (browser) {
			const token = localStorage.getItem("token");
			if (!token && !$page.url.pathname.startsWith("/login")) {
				window.location.href = "/login";
			}
			// Optional: If token exists but user tries to go to login, redirect to home
			if (token && $page.url.pathname.startsWith("/login")) {
				window.location.href = "/";
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
		<div class="flex h-screen w-full bg-slate-50/50">
			<aside class="hidden border-r bg-background lg:block">
				<AppSidebar />
			</aside>

			<div class="flex flex-col flex-1 h-screen overflow-hidden">
				<SiteHeader />

				<!-- Main Content -->
				<main class="flex-1 overflow-y-auto p-6 md:p-8">
					{@render children()}
				</main>
			</div>
			<Toaster />
		</div>
	{/if}
</QueryClientProvider>
