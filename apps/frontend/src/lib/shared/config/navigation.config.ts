import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    ShoppingBag,
    CreditCard,
    History,
    Wrench,
    List,
    ClipboardList,
    Plus,
    Package,
    PackageSearch,
    AlertTriangle,
    Dices,
    Skull,
    XCircle,
    BarChart3,
    Calendar,
    CalendarDays,
    Coins,
    TrendingUp,
    Truck,
    Building2,
    Undo2,
    Calculator,
    BookOpen,
    Settings,
    Users,
    Shield,
    Tags,
    UserCircle,
    Store,
    Wallet,
    CheckCircle
} from 'lucide-svelte';

export type UserRole = 'kasir' | 'teknisi' | 'warehouse' | 'supervisor' | 'manager' | 'owner' | 'super_admin';

export interface NavItem {
    id: string;
    title: string;
    href?: string;
    icon: any; // Lucide icon component reference
    roles: UserRole[] | ['*']; // '*' means all roles
    children?: NavItem[];
    divider?: boolean;
}

// Map User Roles exactly to the backend roles
export const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/', // Handled dynamically in components if needed, or redirect
        icon: LayoutDashboard,
        roles: ['*']
    },
    {
        id: 'pos',
        title: 'POS (New Sale)',
        href: '/sales',
        icon: ShoppingCart,
        roles: ['kasir', 'manager', 'owner', 'super_admin']
    },
    {
        id: 'transactions',
        title: 'Transaksi',
        icon: Receipt,
        roles: ['kasir', 'manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'history',
                title: 'Riwayat Penjualan',
                href: '/sales/history',
                icon: History,
                roles: ['kasir', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'customers',
                title: 'Customers',
                href: '/customers',
                icon: UserCircle,
                roles: ['kasir', 'manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'service',
        title: 'Service & Servis',
        icon: Wrench,
        roles: ['teknisi', 'kasir', 'manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'service-list',
                title: 'Daftar Service',
                href: '/service',
                icon: ClipboardList,
                roles: ['teknisi', 'kasir', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'calendar',
                title: 'Kalender',
                href: '/service/calendar',
                icon: Calendar,
                roles: ['teknisi', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'warranty',
                title: 'Garansi',
                href: '/warranty',
                icon: Shield,
                roles: ['teknisi', 'manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'inventory',
        title: 'Manajemen',
        icon: PackageSearch,
        roles: ['warehouse', 'manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'manager-products',
                title: 'Produk',
                href: '/manager/products',
                icon: Package,
                roles: ['manager', 'owner', 'super_admin']
            },
            {
                id: 'warehouse-stock',
                title: 'Stok Gudang',
                href: '/warehouse/products',
                icon: PackageSearch,
                roles: ['warehouse', 'supervisor', 'owner', 'super_admin']
            },
            {
                id: 'teknisi-parts',
                title: 'Sparepart',
                href: '/teknisi/parts',
                icon: Wrench,
                roles: ['teknisi', 'supervisor', 'owner', 'super_admin']
            },
            {
                id: 'devices',
                title: 'Devices',
                href: '/devices',
                icon: Store,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'categories',
                title: 'Kategori',
                href: '/categories',
                icon: Tags,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'suppliers',
                title: 'Supplier',
                href: '/suppliers',
                icon: Truck,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'stock-check',
                title: 'Cek Stok',
                href: '/searchproduct',
                icon: PackageSearch,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'kanibal',
                title: 'Kanibal',
                href: '/warehouse/kanibal',
                icon: Skull,
                roles: ['warehouse', 'manager', 'super_admin']
            },
            {
                id: 'defective',
                title: 'Defective Items',
                href: '/inventory/defective',
                icon: XCircle,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'purchasing',
        title: 'Pembelian',
        icon: Truck,
        roles: ['warehouse', 'manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'purchase-order',
                title: 'Pembelian Baru',
                href: '/purchases',
                icon: ClipboardList,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            },
            {
                id: 'returns',
                title: 'Retur',
                href: '/purchase-returns',
                icon: Undo2,
                roles: ['warehouse', 'manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'laporan',
        title: 'Laporan',
        icon: BarChart3,
        roles: ['manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'daily',
                title: 'Laporan Umum',
                href: '/reports',
                icon: Calendar,
                roles: ['manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'accounting',
        title: 'Keuangan',
        icon: Calculator,
        roles: ['manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'accounting-hub',
                title: 'Akuntansi',
                href: '/accounting',
                icon: Wallet,
                roles: ['manager', 'owner', 'super_admin']
            },
            {
                id: 'operational',
                title: 'Biaya Operasional',
                href: '/operational-costs',
                icon: Receipt,
                roles: ['manager', 'owner', 'super_admin']
            },
            {
                id: 'liabilities',
                title: 'Hutang / Piutang',
                href: '/accounting/liabilities',
                icon: BookOpen,
                roles: ['manager', 'owner', 'super_admin']
            }
        ]
    },
    {
        id: 'approvals',
        title: 'Approvals',
        href: '/owner/approvals',
        icon: CheckCircle,
        roles: ['owner', 'super_admin']
    },
    {
        id: 'settings',
        title: 'Pengaturan',
        icon: Settings,
        roles: ['manager', 'owner', 'super_admin'],
        children: [
            {
                id: 'store',
                title: 'Pengaturan Toko',
                href: '/settings/store',
                icon: Store,
                roles: ['manager', 'owner', 'super_admin']
            },
            {
                id: 'users',
                title: 'Karyawan',
                href: '/settings/employees',
                icon: Users,
                roles: ['owner', 'super_admin']
            },
            {
                id: 'payment',
                title: 'Pembayaran',
                href: '/settings/payment',
                icon: CreditCard,
                roles: ['manager', 'owner', 'super_admin']
            },
            {
                id: 'roles',
                title: 'Akses & Roles',
                href: '/roles',
                icon: Shield,
                roles: ['super_admin', 'owner']
            },
            {
                id: 'all-settings',
                title: 'Semua Pengaturan',
                href: '/settings',
                icon: Settings,
                roles: ['manager', 'owner', 'super_admin']
            }
        ]
    }
];

export function filterNavByRole(items: NavItem[], role: UserRole): NavItem[] {
    return items
        .filter(item => (item.roles as string[]).includes('*') || (item.roles as string[]).includes(role))
        .map(item => ({
            ...item,
            children: item.children ? filterNavByRole(item.children, role) : undefined
        }))
        .filter(item => item.children === undefined || item.children.length > 0);
}
