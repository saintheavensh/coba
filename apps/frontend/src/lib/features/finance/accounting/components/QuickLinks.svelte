<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import {
        Landmark,
        Settings,
        Target,
        FileText,
        ClipboardList,
        ArrowRight,
    } from "lucide-svelte";
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <a href="/accounting/accounts" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 transition-colors"
                >
                    <Landmark class="h-6 w-6 text-blue-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Chart of Accounts
                    </h3>
                    <p class="text-sm text-slate-500">Kelola daftar akun</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>

    <a href="/accounting/assets" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl group-hover:bg-orange-200 transition-colors"
                >
                    <Settings class="h-6 w-6 text-orange-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Aset & Penyusutan
                    </h3>
                    <p class="text-sm text-slate-500">Kelola aset tetap toko</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>

    <a href="/accounting/targets" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 transition-colors"
                >
                    <Target class="h-6 w-6 text-green-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Target Pendapatan
                    </h3>
                    <p class="text-sm text-slate-500">Atur target bulanan</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>

    <a href="/accounting/journals" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-200 transition-colors"
                >
                    <FileText class="h-6 w-6 text-indigo-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Jurnal Umum
                    </h3>
                    <p class="text-sm text-slate-500">Lihat transaksi jurnal</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>

    <a href="/accounting/payables" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-red-200 transition-colors"
                >
                    <ClipboardList class="h-6 w-6 text-red-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Hutang Supplier
                    </h3>
                    <p class="text-sm text-slate-500">Kelola pembayaran</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>

    <a href="/accounting/audit-log" class="group">
        <Card
            class="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full"
        >
            <CardContent class="p-6 flex items-center gap-4">
                <div
                    class="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-slate-200 transition-colors"
                >
                    <ClipboardList class="h-6 w-6 text-slate-600" />
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-slate-900 dark:text-white">
                        Audit Log
                    </h3>
                    <p class="text-sm text-slate-500">Riwayat perubahan data</p>
                </div>
                <ArrowRight
                    class="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform"
                />
            </CardContent>
        </Card>
    </a>
</div>
