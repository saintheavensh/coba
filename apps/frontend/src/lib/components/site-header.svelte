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
        <Button variant="ghost" size="icon" class="relative">
            <Bell class="h-5 w-5" />
            <span
                class="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-600 border border-background"
            ></span>
        </Button>
        <Avatar class="h-9 w-9 cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>AD</AvatarFallback>
        </Avatar>
    </div>
</header>
