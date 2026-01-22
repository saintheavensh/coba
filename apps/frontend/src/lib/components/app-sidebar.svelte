<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
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
    Calendar,
    Plus,
    Shield,
    List,
    Smartphone,
  } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { slide } from "svelte/transition";

  // Type definitions
  type MenuItem = {
    title: string;
    href?: string;
    icon?: any;
    children?: MenuItem[];
  };

  type MenuGroup = {
    label: string;
    items: MenuItem[];
  };

  // Grouped Menu Structure with Submenus
  const menuGroups: MenuGroup[] = [
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
          title: "Devices",
          href: "/devices",
          icon: Smartphone,
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
          icon: Wrench,
          children: [
            { title: "Service Baru", href: "/service/new", icon: Plus },
            {
              title: "Daftar Service",
              icon: List,
              // Start with expanded or allow toggle. It will need UI support.
              children: [
                { title: "Semua Data", href: "/service", icon: Circle },
                {
                  title: "Antrian",
                  href: "/service?status=antrian",
                  icon: Circle,
                },
                {
                  title: "Sedang Dicek",
                  href: "/service?status=dicek",
                  icon: Circle,
                },
                {
                  title: "Konfirmasi",
                  href: "/service?status=konfirmasi",
                  icon: Circle,
                },
                {
                  title: "Dikerjakan",
                  href: "/service?status=dikerjakan",
                  icon: Circle,
                },
                {
                  title: "Re-konfirmasi",
                  href: "/service?status=re-konfirmasi",
                  icon: Circle,
                },
                {
                  title: "Selesai / Siap",
                  href: "/service?status=selesai",
                  icon: Circle,
                },
                {
                  title: "Sudah Diambil",
                  href: "/service?status=diambil",
                  icon: Circle,
                },
                {
                  title: "Dibatalkan",
                  href: "/service?status=batal",
                  icon: Circle,
                },
              ],
            },
            { title: "Kalender", href: "/service/calendar", icon: Calendar },
            {
              title: "Garansi",
              href: "/warranty",
              icon: Shield,
            },
          ],
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

  import { ServiceService } from "$lib/services/service.service";
  import { refreshServiceList } from "$lib/stores/events";

  // State for expanded menus
  // Initialize based on current URL to auto-expand
  let expanded: Record<string, boolean> = $state({});
  let userRole = $state<string | null>(null);
  let statusCounts = $state<Record<string, number>>({});

  async function fetchStatusCounts() {
    try {
      const counts = await ServiceService.getCounts();
      // Reassign entire object for proper Svelte 5 reactivity
      const newCounts: Record<string, number> = {};
      counts.forEach((c) => {
        newCounts[c.status] = c.count;
      });
      statusCounts = newCounts;
    } catch {}
  }

  onMount(async () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      userRole = u.role;

      // Fetch counts on mount
      await fetchStatusCounts();
    } catch {}
  });

  // Re-fetch counts when service list is refreshed
  $effect(() => {
    const _ = $refreshServiceList; // Subscribe to refresh trigger
    fetchStatusCounts();
  });

  function getCount(href?: string) {
    if (!href || !href.includes("status=")) return null;
    const match = href.match(/status=([^&]*)/);
    if (match && match[1]) {
      return statusCounts[match[1]] || 0;
    }
    return null;
  }

  // Role-based menu filtering
  let filteredMenuGroups = $derived(() => {
    if (userRole === "teknisi") {
      // Technicians only see Service (without "Service Baru") and Settings
      const serviceMenu = menuGroups
        .find((g) => g.label === "Transaksi")
        ?.items.find((i) => i.title === "Service");

      // Filter out "Service Baru" from children
      const filteredServiceMenu = serviceMenu
        ? {
            ...serviceMenu,
            children: serviceMenu.children?.filter(
              (c) => c.title !== "Service Baru",
            ),
          }
        : null;

      return [
        {
          label: "Utama",
          items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Transaksi",
          items: filteredServiceMenu ? [filteredServiceMenu] : [],
        },
        {
          label: "Pengaturan",
          items: menuGroups.find((g) => g.label === "Pengaturan")?.items || [],
        },
      ].filter((g) => g.items.length > 0);
    }
    if (userRole === "kasir") {
      // Cashiers see Sales, Service (limited), and Settings
      return [
        {
          label: "Utama",
          items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Transaksi",
          items:
            menuGroups
              .find((g) => g.label === "Transaksi")
              ?.items.filter(
                (i) => i.title === "Penjualan" || i.title === "Service",
              ) || [],
        },
        {
          label: "Pengaturan",
          items: menuGroups.find((g) => g.label === "Pengaturan")?.items || [],
        },
      ].filter((g) => g.items.length > 0);
    }
    // Admin sees everything
    return menuGroups;
  });

  // Effect to auto-expand parent if child is active
  $effect(() => {
    const path = $page.url.pathname + $page.url.search; // Include search for exact match if needed, but path usually enough for folders
    const pathOnly = $page.url.pathname;

    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.children) {
          // Check deeper children
          let hasActiveChild = false;

          // Check level 2
          for (const child of item.children) {
            if (child.children) {
              // Check level 3
              if (
                child.children.some(
                  (c) =>
                    pathOnly === c.href ||
                    path === c.href ||
                    (c.href && c.href !== "/" && path.startsWith(c.href)),
                )
              ) {
                expanded[child.title] = true;
                hasActiveChild = true;
              }
            } else if (
              child.href &&
              (pathOnly === child.href ||
                (child.href !== "/" && pathOnly.startsWith(child.href)))
            ) {
              hasActiveChild = true;
            }
          }

          if (hasActiveChild) {
            expanded[item.title] = true;
          }
        }
      }
    }
  });

  function toggle(title: string) {
    if (title === "Daftar Service" && userRole === "kasir") return; // Should likely be handled in template by not showing toggle button
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
      {#each filteredMenuGroups() as group}
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
              <!-- Level 1 Collapsible (e.g. Service) -->
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
                  <div
                    class="ml-4 mt-1 border-l pl-2 space-y-1"
                    transition:slide|local
                  >
                    {#each item.children as child}
                      {#if child.children && (child.title !== "Daftar Service" || userRole !== "kasir")}
                        <!-- Level 2 Collapsible (e.g. Daftar Service) -->
                        <div>
                          <button
                            onclick={() => toggle(child.title)}
                            class={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground",
                              expanded[child.title] && "text-foreground",
                            )}
                          >
                            <div class="flex items-center gap-3">
                              {#if child.icon}
                                <child.icon class="h-4 w-4" />
                              {/if}
                              {child.title}
                            </div>
                            {#if expanded[child.title]}
                              <ChevronDown class="h-4 w-4 opacity-50" />
                            {:else}
                              <ChevronRight class="h-4 w-4 opacity-50" />
                            {/if}
                          </button>
                          {#if expanded[child.title]}
                            <!-- sub-items -->
                            <div
                              class="ml-4 mt-1 border-l pl-2 space-y-1"
                              transition:slide|local
                            >
                              {#each child.children as subChild}
                                <a
                                  href={subChild.href}
                                  class={cn(
                                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-blue-600",
                                    $page.url.pathname === subChild.href ||
                                      $page.url.pathname + $page.url.search ===
                                        subChild.href ||
                                      ($page.url.pathname.startsWith(
                                        subChild.href || "",
                                      ) &&
                                        subChild.href !== "/")
                                      ? "bg-blue-50 text-blue-600"
                                      : "text-muted-foreground hover:bg-muted",
                                  )}
                                >
                                  <span class="truncate">{subChild.title}</span>
                                  {#if getCount(subChild.href) !== null}
                                    <span
                                      class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700"
                                    >
                                      {getCount(subChild.href)}
                                    </span>
                                  {/if}
                                </a>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <!-- Level 2 Link (Fallback if no children OR if Cashier restricted) -->
                        <a
                          href={child.children
                            ? child.children[0].href
                            : child.href}
                          class={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-blue-600",
                            $page.url.pathname ===
                              (child.children
                                ? child.children[0].href
                                : child.href) ||
                              ($page.url.pathname.startsWith(
                                (child.children
                                  ? child.children[0].href
                                  : child.href) || "",
                              ) &&
                                (child.children
                                  ? child.children[0].href
                                  : child.href) !== "/")
                              ? "bg-blue-50 text-blue-600"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {#if child.icon}
                            <child.icon class="h-4 w-4" />
                          {/if}
                          {child.title}
                        </a>
                      {/if}
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
                    ($page.url.pathname.startsWith(item.href || "") &&
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
      onclick={async () => {
        // Use AuthService to properly logout (clears cookie on backend)
        const { AuthService } = await import("$lib/services/auth.service");
        await AuthService.logout();
        window.location.href = "/login";
      }}
      class="flex w-full items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
    >
      <LogOut class="h-4 w-4" />
      Logout
    </button>
  </div>
</div>
