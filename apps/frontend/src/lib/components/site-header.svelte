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

    function getPageTitle(pathname: string) {
        if (pathname === "/") return "Dashboard";
        if (pathname.startsWith("/products")) return "Inventory";
        if (pathname.startsWith("/purchases")) return "Purchases";
        if (pathname.startsWith("/sales")) return "Sales";
        if (pathname.startsWith("/reports")) return "Reports";
        return "Dashboard";
    }

    const menuItems = [
        { title: "Dashboard", href: "/", icon: LayoutDashboard },
        { title: "Inventory", href: "/products", icon: Store },
        { title: "Purchases", href: "/purchases", icon: ShoppingCart },
        { title: "Sales", href: "/sales", icon: ChartBar },
        { title: "Reports", href: "/reports", icon: Boxes },
        { title: "Settings", href: "/settings", icon: Settings },
    ];

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
    class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6"
>
    <!-- Mobile Menu Trigger -->
    <div class="lg:hidden">
        <Sheet>
            <SheetTrigger
                class={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className: "-ml-2",
                })}
            >
                <Menu class="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0">
                <div class="flex h-16 items-center px-6 border-b">
                    <div class="flex items-center gap-2 text-blue-600">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
                        >
                            <Package class="h-5 w-5" />
                        </div>
                        <span class="font-bold text-lg text-foreground"
                            >Inventory App</span
                        >
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto py-4">
                    <nav class="grid gap-1 px-4">
                        {#each menuItems as item}
                            <a
                                href={item.href}
                                class={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-blue-600",
                                    $page.url.pathname === item.href ||
                                        ($page.url.pathname.startsWith(
                                            item.href,
                                        ) &&
                                            item.href !== "/")
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-muted-foreground hover:bg-muted",
                                )}
                            >
                                <item.icon class="h-5 w-5" />
                                {item.title}
                            </a>
                        {/each}
                    </nav>
                </div>
                <div class="mt-auto p-4 px-6 border-t">
                    <a
                        href="/logout"
                        class="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
                    >
                        <LogOut class="h-5 w-5" />
                        Logout
                    </a>
                </div>
            </SheetContent>
        </Sheet>
    </div>

    <div class="flex-1">
        <h1 class="text-lg font-semibold md:text-xl">
            {getPageTitle($page.url.pathname)}
        </h1>
        {#if $page.url.pathname === "/" && $activityLogs.length > 0}
            <p class="text-xs text-muted-foreground hidden md:block">
                Terakhir: {$activityLogs[0].action} oleh {$activityLogs[0].user}
            </p>
        {/if}
    </div>

    <div class="flex items-center gap-4">
        <div class="relative hidden sm:block">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Search..."
                class="w-[200px] pl-8 bg-muted/50 border-none focus-visible:ring-1 lg:w-[300px]"
            />
        </div>

        <!-- Notification Dropdown -->
        <DropdownMenu>
            <DropdownMenuTrigger
                class={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className: "relative",
                })}
            >
                <Bell class="h-5 w-5" />
                {#if $activityLogs.filter((l) => !l.isRead).length > 0}
                    <span
                        class="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-600 border border-background"
                    ></span>
                {/if}
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-80" align="end">
                <DropdownMenuLabel class="flex justify-between items-center">
                    Notifikasi
                    {#if $activityLogs.length > 0}
                        <button
                            class="text-xs font-normal text-muted-foreground hover:text-blue-600 bg-transparent border-none p-0 cursor-pointer"
                            onclick={() => activityLogs.markAllAsRead()}
                            >Mark all read</button
                        >
                    {/if}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div class="max-h-[300px] overflow-y-auto">
                    {#if $activityLogs.length === 0}
                        <div
                            class="p-4 text-center text-sm text-muted-foreground"
                        >
                            Tidak ada notifikasi baru.
                        </div>
                    {:else}
                        {#each $activityLogs as log}
                            <DropdownMenuItem
                                class="flex flex-col items-start gap-1 p-3 cursor-pointer"
                            >
                                <div class="flex justify-between w-full">
                                    <span
                                        class="font-medium text-xs text-blue-600"
                                        >{log.user}</span
                                    >
                                    <span
                                        class="text-[10px] text-muted-foreground"
                                        >{getTimeDifference(
                                            log.timestamp,
                                        )}</span
                                    >
                                </div>
                                <p class="text-sm font-medium leading-none">
                                    {log.action}
                                </p>
                                <p
                                    class="text-xs text-muted-foreground line-clamp-2"
                                >
                                    {log.details}
                                </p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        {/each}
                    {/if}
                </div>
                <DropdownMenuItem
                    class="justify-center text-center text-xs font-medium text-blue-600 cursor-pointer"
                >
                    Lihat Semua Aktivitas
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Avatar class="h-9 w-9 cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>AD</AvatarFallback>
        </Avatar>
    </div>
</header>
