<script lang="ts">
  import { page } from "$app/stores";
  import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ChartBar,
    Boxes,
    LogOut,
    Settings,
    Store,
  } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import Separator from "$lib/components/ui/separator/separator.svelte";

  const menuItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      href: "/products",
      icon: Store,
    },
    {
      title: "Purchases",
      href: "/purchases", // Note: Need to update routes if link changed, kept logic consistent
      icon: ShoppingCart, // Using ShoppingCart for Purchases based on image logic usually
    },
    {
      title: "Sales",
      href: "/sales",
      icon: ChartBar, // Use Chart for Sales? Or reversed? Reference image has Graph for Sales.
    },
    {
      title: "Service",
      href: "/service",
      icon: Settings, // TODO: use Wrench icon when available
    },
    {
      title: "Reports",
      href: "/reports",
      icon: Boxes, // Placeholder
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Update icons to match reference better
  // Dashboard: Grid -> LayoutDashboard
  // Inventory: Home/Store -> Store/Package
  // Purchases: Cart -> ShoppingCart
  // Sales: Graph -> ChartLine (using ChartBar for now)
  // Reports: FileText -> ClipboardList/Boxes
  // Settings: Cog -> Settings
</script>

<div class="flex h-screen w-64 flex-col border-r bg-background text-foreground">
  <div class="flex h-16 items-center px-6">
    <div class="flex items-center gap-2 text-blue-600">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
      >
        <Package class="h-5 w-5" />
      </div>
      <span class="font-bold text-lg text-foreground">Inventory App</span>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto py-6">
    <nav class="grid gap-1 px-4">
      {#each menuItems as item}
        <a
          href={item.href}
          class={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-blue-600",
            $page.url.pathname === item.href ||
              ($page.url.pathname.startsWith(item.href) && item.href !== "/")
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

  <div class="mt-auto p-4 px-6">
    <button
      onclick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }}
      class="flex w-full items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
    >
      <LogOut class="h-5 w-5" />
      Logout
    </button>
  </div>
</div>
