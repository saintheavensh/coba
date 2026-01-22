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
		<div class="flex min-h-screen w-full bg-slate-50/50">
			<aside
				class="hidden border-r bg-background lg:block sticky top-0 h-screen"
			>
				<AppSidebar />
			</aside>

			<div class="flex flex-col flex-1 min-w-0">
				<SiteHeader />

				<!-- Main Content -->
				<main class="flex-1 p-6 md:p-8">
					{@render children()}
				</main>
			</div>
			<Toaster />
		</div>
	{/if}
</QueryClientProvider>
