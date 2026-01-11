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
    Users,
    Filter,
    Archive,
    Wrench,
    ChevronDown,
    ChevronRight,
    Circle,
    Truck,
    Tags,
  } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { slide } from "svelte/transition";

  // Grouped Menu Structure with Submenus
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
            { title: "Input Penjualan", href: "/sales", icon: Circle },
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
            { title: "Input Pembelian", href: "/purchases", icon: Circle },
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

  // State for expanded menus
  // Initialize based on current URL to auto-expand
  let expanded: Record<string, boolean> = $state({});

  // Effect to auto-expand parent if child is active
  $effect(() => {
    const path = $page.url.pathname;
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.children) {
          if (
            item.children.some(
              (child) => path === child.href || path.startsWith(child.href!),
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
    <nav class="grid gap-6 px-4">
      {#each menuGroups as group}
        <div class="grid gap-1">
          {#if group.label}
            <h4
              class="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
            >
              {group.label}
            </h4>
          {/if}
          {#each group.items as item}
            {#if item.children}
              <!-- Collapsible Item -->
              <div>
                <button
                  onclick={() => toggle(item.title)}
                  class={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground",
                    expanded[item.title] && "text-foreground",
                  )}
                >
                  <div class="flex items-center gap-3">
                    <item.icon class="h-4 w-4" />
                    {item.title}
                  </div>
                  {#if expanded[item.title]}
                    <ChevronDown class="h-4 w-4 opacity-50" />
                  {:else}
                    <ChevronRight class="h-4 w-4 opacity-50" />
                  {/if}
                </button>
                {#if expanded[item.title]}
                  <div class="ml-4 mt-1 border-l pl-2 space-y-1">
                    {#each item.children as child}
                      <a
                        href={child.href}
                        class={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-blue-600",
                          $page.url.pathname === child.href ||
                            ($page.url.pathname.startsWith(child.href!) &&
                              child.href !== "/")
                            ? "bg-blue-50 text-blue-600"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <!-- Optional: Smaller Bullet Icon or just text padding -->
                        <!-- <child.icon class="h-2 w-2" /> -->
                        {child.title}
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Regular Item -->
              <a
                href={item.href}
                class={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-blue-600",
                  $page.url.pathname === item.href ||
                    ($page.url.pathname.startsWith(item.href!) &&
                      item.href !== "/")
                    ? "bg-blue-50 text-blue-600"
                    : "text-muted-foreground hover:bg-muted",
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

  <div class="mt-auto p-4 px-6">
    <button
      onclick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }}
      class="flex w-full items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
    >
      <LogOut class="h-4 w-4" />
      Logout
    </button>
  </div>
</div>
