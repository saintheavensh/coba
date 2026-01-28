<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import {
        Bell,
        Search,
        Menu,
        LayoutDashboard,
        Package,
        ShoppingCart,
        ChartBar,
        Boxes,
        Settings,
        Store,
        LogOut,
        Users,
        Truck,
        Tags,
        Wrench,
        ChevronDown,
        ChevronRight,
        Circle,
    } from "lucide-svelte";
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/components/ui/avatar";
    import { page } from "$app/stores";
    import {
        Sheet,
        SheetContent,
        SheetTrigger,
    } from "$lib/components/ui/sheet";
    import { cn } from "$lib/utils";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
        DropdownMenuGroup,
    } from "$lib/components/ui/dropdown-menu";
    import { activityLogs } from "$lib/stores/settings";
    import { slide } from "svelte/transition";

    // Grouped Menu Structure with Submenus (Mirrored from AppSidebar)
    const menuGroups = [
        {
            label: "",
            items: [
                {
                    title: "Dashboard",
                    href: "/",
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            label: "Manajemen",
            items: [
                {
                    title: "Produk",
                    href: "/products",
                    icon: Store,
                },
                {
                    title: "Kategori",
                    href: "/categories",
                    icon: Tags,
                },
                {
                    title: "Supplier",
                    href: "/suppliers",
                    icon: Truck,
                },
                {
                    title: "Customers",
                    href: "/customers",
                    icon: Users,
                },
            ],
        },
        {
            label: "Transaksi",
            items: [
                {
                    title: "Penjualan",
                    icon: ChartBar,
                    children: [
                        {
                            title: "Input Penjualan",
                            href: "/sales",
                            icon: Circle,
                        },
                        {
                            title: "Riwayat Penjualan",
                            href: "/sales/history",
                            icon: Circle,
                        },
                    ],
                },
                {
                    title: "Pembelian",
                    icon: ShoppingCart,
                    children: [
                        {
                            title: "Input Pembelian",
                            href: "/purchases",
                            icon: Circle,
                        },
                        {
                            title: "Retur Pembelian",
                            href: "/purchase-returns",
                            icon: Circle,
                        },
                    ],
                },
                {
                    title: "Service",
                    href: "/service",
                    icon: Wrench,
                },
            ],
        },
        {
            label: "Laporan",
            items: [
                {
                    title: "Laporan",
                    href: "/reports",
                    icon: Boxes,
                },
            ],
        },
        {
            label: "Pengaturan",
            items: [
                {
                    title: "Pengaturan",
                    href: "/settings",
                    icon: Settings,
                },
            ],
        },
    ];

    let expanded: Record<string, boolean> = $state({});

    $effect(() => {
        const path = $page.url.pathname;
        for (const group of menuGroups) {
            for (const item of group.items) {
                if (item.children) {
                    if (
                        item.children.some(
                            (child) =>
                                path === child.href ||
                                path.startsWith(child.href!),
                        )
                    ) {
                        expanded[item.title] = true;
                    }
                }
            }
        }
    });

    function toggle(title: string) {
        expanded[title] = !expanded[title];
    }

    function getTimeDifference(date: Date) {
        const now = new Date();
        const diff = Math.floor(
            (now.getTime() - new Date(date).getTime()) / 1000,
        );

        if (diff < 60) return "Baru saja";
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        return new Date(date).toLocaleDateString();
    }
</script>

<header
    class="sticky top-0 z-30 flex h-16 items-center gap-4 bg-transparent text-slate-900 dark:text-slate-200 transition-all duration-200 px-6"
>
    <!-- Mobile Menu Trigger -->
    <div class="lg:hidden relative z-10">
        <Sheet>
            <SheetTrigger
                class={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className:
                        "-ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10",
                })}
            >
                <Menu class="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
                side="left"
                class="w-64 p-0 border-r border-slate-200 dark:border-slate-800"
            >
                <div
                    class="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md text-white"
                        >
                            <Package class="h-4 w-4" />
                        </div>
                        <span class="font-bold text-lg tracking-tight"
                            >Inventory App</span
                        >
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto py-4">
                    <nav class="grid gap-6 px-4">
                        {#each menuGroups as group}
                            <div class="grid gap-1">
                                {#if group.label}
                                    <h4
                                        class="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                                    >
                                        {group.label}
                                    </h4>
                                {/if}
                                {#each group.items as item}
                                    {#if item.children}
                                        <div>
                                            <button
                                                onclick={() =>
                                                    toggle(item.title)}
                                                class={cn(
                                                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                    expanded[item.title]
                                                        ? "text-slate-900 dark:text-white"
                                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                                                )}
                                            >
                                                <div
                                                    class="flex items-center gap-3"
                                                >
                                                    <item.icon
                                                        class="h-4 w-4"
                                                    />
                                                    {item.title}
                                                </div>
                                                <ChevronRight
                                                    class={cn(
                                                        "h-3.5 w-3.5 transition-transform duration-200 opacity-50",
                                                        expanded[item.title] &&
                                                            "rotate-90",
                                                    )}
                                                />
                                            </button>
                                            {#if expanded[item.title]}
                                                <div
                                                    class="ml-4 mt-1 border-l border-slate-200 dark:border-slate-800 pl-2 space-y-1"
                                                    transition:slide|local={{
                                                        duration: 200,
                                                    }}
                                                >
                                                    {#each item.children as child}
                                                        <a
                                                            href={child.href}
                                                            class={cn(
                                                                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-all",
                                                                $page.url
                                                                    .pathname ===
                                                                    child.href ||
                                                                    ($page.url.pathname.startsWith(
                                                                        child.href!,
                                                                    ) &&
                                                                        child.href !==
                                                                            "/")
                                                                    ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400"
                                                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
                                                            )}
                                                        >
                                                            {child.title}
                                                        </a>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    {:else}
                                        <a
                                            href={item.href}
                                            class={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                $page.url.pathname ===
                                                    item.href ||
                                                    ($page.url.pathname.startsWith(
                                                        item.href!,
                                                    ) &&
                                                        item.href !== "/")
                                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                                            )}
                                        >
                                            <item.icon class="h-4 w-4" />
                                            {item.title}
                                        </a>
                                    {/if}
                                {/each}
                            </div>
                        {/each}
                    </nav>
                </div>
                <div
                    class="mt-auto p-4 px-6 border-t border-slate-200 dark:border-slate-800"
                >
                    <a
                        href="/logout"
                        class="flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut class="h-4 w-4" />
                        Logout
                    </a>
                </div>
            </SheetContent>
        </Sheet>
    </div>

    <div class="flex-1 relative z-10">
        {#if $page.url.pathname === "/" && $activityLogs.length > 0}
            <div class="flex items-center gap-2 mt-0.5">
                <span class="relative flex h-2 w-2">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                    ></span>
                    <span
                        class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
                    ></span>
                </span>
                <p
                    class="text-xs text-slate-400 hidden md:block truncate max-w-[300px]"
                >
                    {$activityLogs[0].action} by
                    <span class="font-medium text-slate-300"
                        >{$activityLogs[0].user}</span
                    >
                </p>
            </div>
        {/if}
    </div>

    <div class="flex items-center gap-3 md:gap-4 relative z-10">
        <!-- Search Bar -->
        <div class="relative hidden md:block group">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors"
            />
            <Input
                type="search"
                placeholder="Type to search..."
                class="w-[200px] pl-9 h-9 bg-slate-200/50 dark:bg-slate-900/50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-500 transition-all rounded-full lg:w-[280px]"
            />
        </div>

        <!-- Notification Dropdown -->
        <DropdownMenu>
            <DropdownMenuTrigger
                class={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className:
                        "relative rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                })}
            >
                <Bell class="h-5 w-5" />
                {#if $activityLogs.filter((l) => !l.isRead).length > 0}
                    <span
                        class="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-slate-950"
                    ></span>
                {/if}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                class="w-80 rounded-xl shadow-xl border-slate-800 bg-slate-950 text-slate-200"
                align="end"
            >
                <DropdownMenuLabel
                    class="flex justify-between items-center p-3"
                >
                    <span class="font-bold">Notifications</span>
                    {#if $activityLogs.length > 0}
                        <button
                            class="text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                            onclick={() => activityLogs.markAllAsRead()}
                            >Mark all read</button
                        >
                    {/if}
                </DropdownMenuLabel>
                <DropdownMenuSeparator class="bg-slate-800" />
                <div class="max-h-[350px] overflow-y-auto">
                    {#if $activityLogs.length === 0}
                        <div
                            class="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2"
                        >
                            <Bell class="h-8 w-8 text-slate-700" />
                            <span>No new notifications</span>
                        </div>
                    {:else}
                        {#each $activityLogs as log}
                            <DropdownMenuItem
                                class="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-slate-900"
                            >
                                <div class="flex justify-between w-full">
                                    <span
                                        class="font-semibold text-xs text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded"
                                        >{log.user}</span
                                    >
                                    <span class="text-[10px] text-slate-500"
                                        >{getTimeDifference(
                                            log.timestamp,
                                        )}</span
                                    >
                                </div>
                                <p
                                    class="text-sm font-medium leading-tight text-slate-300 mt-1"
                                >
                                    {log.action}
                                </p>
                                <p class="text-xs text-slate-500 line-clamp-2">
                                    {log.details}
                                </p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator
                                class="my-0 bg-slate-800/50"
                            />
                        {/each}
                    {/if}
                </div>
                <DropdownMenuItem
                    class="justify-center text-center text-xs font-medium text-blue-500 hover:text-blue-400 cursor-pointer py-3 focus:bg-slate-900"
                >
                    View All Activity
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger
                class="rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50"
            >
                <Avatar class="h-9 w-9 border-2 border-white/10 shadow-sm">
                    <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                    />
                    <AvatarFallback
                        class="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold"
                        >AD</AvatarFallback
                    >
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                class="w-56 rounded-xl shadow-lg border-slate-800 bg-slate-950 text-slate-200"
            >
                <DropdownMenuLabel class="font-normal">
                    <div class="flex flex-col space-y-1">
                        <p class="text-sm font-medium leading-none text-white">
                            Administrator
                        </p>
                        <p class="text-xs leading-none text-slate-500">
                            admin@example.com
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator class="bg-slate-800" />
                <DropdownMenuGroup>
                    <DropdownMenuItem class="cursor-pointer focus:bg-slate-900">
                        <Users class="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer focus:bg-slate-900">
                        <Settings class="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator class="bg-slate-800" />
                <DropdownMenuItem
                    class="cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-950/20"
                >
                    <LogOut class="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</header>
