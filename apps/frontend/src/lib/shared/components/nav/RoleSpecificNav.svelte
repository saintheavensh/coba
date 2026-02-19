<script lang="ts">
    import { authStore, ROLE_CONFIG } from "$lib/features/auth/auth.svelte";
    import { page } from "$app/stores";
    import { cn } from "$lib/shared/core/utils";
    import {
        LayoutDashboard,
        Wrench,
        Package,
        ShoppingCart,
        LogOut,
        Menu,
        Bell,
        User,
        Users,
        Search,
        Settings,
        BarChart3,
        Wallet,
        FileText,
        Truck,
        Layers,
        ClipboardList,
        Shield,
        KeyRound,
    } from "lucide-svelte";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { Button } from "$lib/shared/components/ui/button";
    import { Avatar, AvatarFallback } from "$lib/shared/components/ui/avatar";
    import RoleSwitcher from "./RoleSwitcher.svelte";

    interface NavItem {
        title: string;
        href: string;
        icon: any;
    }

    // Use activeRole for nav (the switcher mode), not the primary role
    const activeRole = $derived(authStore.activeRole);
    const userName = $derived(authStore.user?.name || "User");
    const roleConfig = $derived(authStore.activeRoleConfig);

    const navConfig: Record<string, NavItem[]> = {
        super_admin: [
            { title: "System", href: "/superadmin", icon: Shield },
            { title: "Users", href: "/users", icon: Users },
            { title: "Roles", href: "/roles", icon: KeyRound },
            { title: "Settings", href: "/settings", icon: Settings },
            { title: "Audit Log", href: "/audit", icon: FileText },
        ],
        teknisi: [
            {
                title: "My Workstation",
                href: "/technician",
                icon: LayoutDashboard,
            },
            { title: "Service List", href: "/service", icon: Wrench },
            { title: "Tools", href: "/service-tools", icon: Package },
            { title: "Stock", href: "/searchproduct", icon: Search },
        ],
        kasir: [
            { title: "Counter", href: "/kasir", icon: LayoutDashboard },
            { title: "New Sale", href: "/sales", icon: ShoppingCart },
            { title: "Services", href: "/service", icon: Wrench },
            { title: "Customers", href: "/customers", icon: User },
            { title: "Stock", href: "/searchproduct", icon: Search },
        ],
        warehouse: [
            { title: "Inventory", href: "/warehouse", icon: LayoutDashboard },
            { title: "Products", href: "/products", icon: Package },
            {
                title: "Penerimaan Barang",
                href: "/warehouse/reception",
                icon: Truck,
            },
            { title: "Stock", href: "/searchproduct", icon: Search },
        ],
        owner: [
            { title: "Dashboard", href: "/owner", icon: LayoutDashboard },
            { title: "Reports", href: "/reports", icon: BarChart3 },
            { title: "Accounting", href: "/accounting", icon: Wallet },
            { title: "Staff", href: "/users", icon: Users },
            { title: "Audit", href: "/accounting/audit-log", icon: Shield },
            { title: "Settings", href: "/settings", icon: Settings },
        ],
        manager: [
            { title: "Dashboard", href: "/manager", icon: LayoutDashboard },
            { title: "Services", href: "/service", icon: Wrench },
            { title: "Sales", href: "/sales", icon: ShoppingCart },
            {
                title: "Purchases",
                href: "/manager/purchases",
                icon: ShoppingCart,
            },
            { title: "Accounting", href: "/accounting", icon: Wallet },
            { title: "Products", href: "/products", icon: Package },
            { title: "Suppliers", href: "/suppliers", icon: Truck },
            { title: "Categories", href: "/categories", icon: Layers },
            { title: "Reports", href: "/reports", icon: BarChart3 },
        ],
    };

    const currentNav = $derived(navConfig[activeRole as string] || []);
    const activePath = $derived($page.url.pathname);

    async function handleLogout() {
        const { AuthService } = await import("$lib/features/auth/auth.service");
        await AuthService.logout();
        window.location.href = "/login";
    }
</script>

<nav
    class="flex h-16 items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50"
>
    <div class="flex items-center gap-6">
        <!-- Role Switcher (replaces static logo/badge) -->
        <RoleSwitcher />

        <!-- Fallback badge for single-role users -->
        {#if !authStore.hasMultipleRoles && roleConfig}
            <div class="flex items-center gap-3">
                <div
                    class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-base"
                >
                    {roleConfig.icon}
                </div>
                <span class="font-bold tracking-tight hidden md:block"
                    >{roleConfig.label} Terminal</span
                >
            </div>
        {/if}

        <!-- Dynamic Nav Links -->
        <div class="hidden lg:flex items-center gap-1">
            {#each currentNav as item}
                <a
                    href={item.href}
                    class={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                        activePath === item.href
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-slate-500",
                    )}
                >
                    <item.icon class="h-4 w-4" />
                    {item.title}
                </a>
            {/each}
        </div>
    </div>

    <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" class="rounded-full relative">
            <Bell class="h-5 w-5 text-slate-500" />
            <span
                class="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"
            ></span>
        </Button>

        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <div
                    class="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded-full border border-slate-200 dark:border-slate-800 pr-3"
                >
                    <Avatar class="h-8 w-8">
                        <AvatarFallback class="bg-blue-600 text-white text-xs">
                            {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div class="text-left hidden sm:block">
                        <p class="text-xs font-bold leading-none">{userName}</p>
                        <p class="text-[10px] text-slate-500 leading-tight">
                            {roleConfig?.label || activeRole}
                        </p>
                    </div>
                </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-56">
                <DropdownMenu.Label>My Account</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>Profile</DropdownMenu.Item>
                <DropdownMenu.Item>Settings</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    onclick={handleLogout}
                    class="text-red-500 focus:text-red-600"
                >
                    <LogOut class="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Mobile Menu Trigger -->
        <Button variant="ghost" size="icon" class="lg:hidden rounded-full">
            <Menu class="h-5 w-5" />
        </Button>
    </div>
</nav>
