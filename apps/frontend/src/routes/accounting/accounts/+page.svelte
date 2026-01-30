<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Landmark,
        ChevronRight,
        ChevronDown,
        Plus,
        Search,
        Loader2,
        FolderOpen,
        FileText,
    } from "lucide-svelte";
    import { api } from "$lib/api";

    let loading = $state(true);
    let accounts = $state<any[]>([]);
    let accountTree = $state<any[]>([]);
    let accountTypes = $state<any[]>([]);
    let viewMode = $state<"flat" | "tree">("tree");
    let searchQuery = $state("");
    let expandedNodes = $state<Set<string>>(new Set());

    // Create Account State
    let showCreateDialog = $state(false);
    let creating = $state(false);
    let createForm = $state({
        code: "",
        name: "",
        typeId: "",
        parentId: "",
        description: "",
    });

    // Transfer State
    let showTransferDialog = $state(false);
    let transferring = $state(false);
    let transferForm = $state({
        fromAccountId: "",
        toAccountId: "",
        amount: 0,
        description: "Setoran Dana Cadangan",
    });

    async function handleTransfer() {
        try {
            transferring = true;
            await api.post("/accounting/accounts/transfer", transferForm);
            showTransferDialog = false;
            transferForm = {
                fromAccountId: "",
                toAccountId: "",
                amount: 0,
                description: "Setoran Dana Cadangan",
            };
            await fetchAccounts();
        } catch (e: any) {
            console.error("Failed to transfer funds", e);
            alert(e.response?.data?.error || "Gagal mentransfer dana");
        } finally {
            transferring = false;
        }
    }

    async function fetchAccounts() {
        try {
            loading = true;
            const [flatRes, treeRes, typesRes] = await Promise.all([
                api.get("/accounting/accounts"),
                api.get("/accounting/accounts/tree"),
                api.get("/accounting/accounts/types"),
            ]);
            accounts = flatRes.data;
            accountTree = treeRes.data;
            accountTypes = typesRes.data;

            // Expand first level by default
            for (const node of treeRes.data) {
                expandedNodes.add(node.id);
            }
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        } finally {
            loading = false;
        }
    }

    async function handleCreateAccount() {
        try {
            creating = true;
            await api.post("/accounting/accounts", {
                ...createForm,
                // Ensure parentId is undefined if empty string
                parentId: createForm.parentId || undefined,
            });

            // Reset and refresh
            showCreateDialog = false;
            createForm = {
                code: "",
                name: "",
                typeId: "",
                parentId: "",
                description: "",
            };
            await fetchAccounts();
        } catch (e: any) {
            console.error("Failed to create account", e);
            alert(e.response?.data?.error || "Gagal membuat akun");
        } finally {
            creating = false;
        }
    }

    onMount(() => {
        fetchAccounts();
    });

    function toggleNode(id: string) {
        if (expandedNodes.has(id)) {
            expandedNodes.delete(id);
        } else {
            expandedNodes.add(id);
        }
        expandedNodes = new Set(expandedNodes);
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    let filteredAccounts = $derived.by(() => {
        if (!searchQuery) return accounts;
        const q = searchQuery.toLowerCase();
        return accounts.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.code.toLowerCase().includes(q),
        );
    });

    function getTypeColor(typeId: string) {
        switch (typeId) {
            case "ASSET":
                return "bg-blue-100 text-blue-700";
            case "LIABILITY":
                return "bg-red-100 text-red-700";
            case "EQUITY":
                return "bg-purple-100 text-purple-700";
            case "REVENUE":
                return "bg-green-100 text-green-700";
            case "EXPENSE":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Chart of Accounts</span
                >
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Daftar Akun
            </h1>
        </div>

        <div class="flex items-center gap-3">
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                />
                <Input
                    bind:value={searchQuery}
                    placeholder="Cari akun..."
                    class="pl-9 w-64"
                />
            </div>
            <div class="flex border rounded-lg overflow-hidden">
                <button
                    onclick={() => (viewMode = "tree")}
                    class="px-3 py-2 text-sm {viewMode === 'tree'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'}"
                >
                    Tree
                </button>
                <button
                    onclick={() => (viewMode = "flat")}
                    class="px-3 py-2 text-sm {viewMode === 'flat'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'}"
                >
                    List
                </button>
            </div>

            <Dialog bind:open={showCreateDialog}>
                <DialogTrigger class={buttonVariants({ className: "gap-2" })}>
                    <Plus class="h-4 w-4" />
                    Tambah Akun
                </DialogTrigger>
                <DialogContent class="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Buat Akun Baru</DialogTitle>
                    </DialogHeader>
                    <form
                        onsubmit={(e) => {
                            e.preventDefault();
                            handleCreateAccount();
                        }}
                        class="space-y-4 pt-2"
                    >
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label
                                    >Tipe Akun <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <select
                                    bind:value={createForm.typeId}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="" disabled>Pilih Tipe</option
                                    >
                                    {#each accountTypes as type}
                                        <option value={type.id}
                                            >{type.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <div class="space-y-2">
                                <Label
                                    >Kode Akun <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    bind:value={createForm.code}
                                    placeholder="Contoh: 1001"
                                    required
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label
                                >Nama Akun <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                bind:value={createForm.name}
                                placeholder="Contoh: Kas Kecil"
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label>Induk Akun (Optional)</Label>
                            <select
                                bind:value={createForm.parentId}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">- Tidak ada induk -</option>
                                {#each accounts as acc}
                                    <option value={acc.id}
                                        >{acc.code} - {acc.name}</option
                                    >
                                {/each}
                            </select>
                            <p class="text-[10px] text-slate-500">
                                Pilih jika akun ini adalah sub-akun dari akun
                                lain.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label>Deskripsi</Label>
                            <Textarea
                                bind:value={createForm.description}
                                placeholder="Penjelasan penggunaan akun..."
                            />
                        </div>

                        <div class="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onclick={() => (showCreateDialog = false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={creating}>
                                {#if creating}
                                    <Loader2
                                        class="h-4 w-4 animate-spin mr-2"
                                    />
                                {/if}
                                Simpan Akun
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog bind:open={showTransferDialog}>
                <DialogTrigger>
                    <Button
                        variant="outline"
                        class="gap-2 px-6 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        <Landmark class="h-4 w-4" />
                        Transfer Dana
                    </Button>
                </DialogTrigger>
                <DialogContent
                    class="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl"
                >
                    <div class="h-1.5 bg-blue-600"></div>
                    <div class="p-8 space-y-6">
                        <div>
                            <h3 class="text-xl font-bold">
                                Transfer Antar Rekening
                            </h3>
                            <p class="text-sm text-slate-500 mt-1">
                                Pindahkan saldo kas atau alokasi dana cadangan
                                secara internal.
                            </p>
                        </div>

                        <form
                            onsubmit={(e) => {
                                e.preventDefault();
                                handleTransfer();
                            }}
                            class="space-y-5"
                        >
                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Dari Akun (Sumber)</Label
                                >
                                <select
                                    bind:value={transferForm.fromAccountId}
                                    class="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="" disabled
                                        >Pilih Sumber Dana</option
                                    >
                                    {#each accounts.filter((a) => a.typeId === "ASSET" || a.typeId === "LIABILITY") as acc}
                                        <option value={acc.id}
                                            >{acc.name} ({formatCurrency(
                                                acc.balance,
                                            )})</option
                                        >
                                    {/each}
                                </select>
                            </div>

                            <div class="flex justify-center -my-2">
                                <div
                                    class="bg-blue-50 p-2 rounded-full border border-blue-100"
                                >
                                    <ChevronDown
                                        class="h-4 w-4 text-blue-600"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Ke Akun (Tujuan)</Label
                                >
                                <select
                                    bind:value={transferForm.toAccountId}
                                    class="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="" disabled
                                        >Pilih Tujuan Alokasi</option
                                    >
                                    {#each accounts.filter((a) => a.id !== transferForm.fromAccountId) as acc}
                                        <option value={acc.id}
                                            >{acc.name} ({acc.code})</option
                                        >
                                    {/each}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Nominal Transfer</Label
                                >
                                <div class="relative">
                                    <span
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                                        >Rp</span
                                    >
                                    <Input
                                        type="number"
                                        bind:value={transferForm.amount}
                                        class="pl-10 h-11 rounded-xl font-bold text-lg"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Keterangan</Label
                                >
                                <Input
                                    bind:value={transferForm.description}
                                    placeholder="Misal: Alokasi Cadangan Service"
                                    class="h-11 rounded-xl italic"
                                    required
                                />
                            </div>

                            <div class="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    class="flex-1 rounded-xl h-11"
                                    onclick={() => (showTransferDialog = false)}
                                    >Batal</Button
                                >
                                <Button
                                    type="submit"
                                    disabled={transferring}
                                    class="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                                >
                                    {#if transferring}
                                        <Loader2
                                            class="h-4 w-4 animate-spin mr-2"
                                        />
                                        Mengirim...
                                    {:else}
                                        Konfirmasi Transfer
                                    {/if}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else if viewMode === "tree"}
        <!-- Tree View -->
        <Card class="border-0 shadow-lg rounded-2xl">
            <CardContent class="p-0">
                <div class="divide-y">
                    {#each accountTree as node}
                        {@render treeNode(node, 0)}
                    {:else}
                        <div class="p-8 text-center text-slate-500">
                            Belum ada akun. Silakan tambah akun baru.
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {:else}
        <!-- Flat List -->
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead class="w-24">Kode</TableHead>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead class="w-32">Tipe</TableHead>
                        <TableHead class="text-right w-40">Saldo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each filteredAccounts as account}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell class="font-mono text-sm"
                                >{account.code}</TableCell
                            >
                            <TableCell class="font-medium"
                                >{account.name}</TableCell
                            >
                            <TableCell>
                                <span
                                    class="text-xs px-2 py-1 rounded-full {getTypeColor(
                                        account.typeId,
                                    )}"
                                >
                                    {account.typeName}
                                </span>
                            </TableCell>
                            <TableCell class="text-right font-mono">
                                {formatCurrency(account.balance || 0)}
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={4}
                                class="p-8 text-center text-slate-500"
                            >
                                Belum ada akun. Silakan tambah akun baru.
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>

{#snippet treeNode(node: any, level: number)}
    <div class="border-b last:border-b-0">
        <button
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            style="padding-left: {16 + level * 24}px"
            onclick={() => node.children?.length > 0 && toggleNode(node.id)}
        >
            <!-- Expand icon -->
            {#if node.children?.length > 0}
                {#if expandedNodes.has(node.id)}
                    <ChevronDown class="h-4 w-4 text-slate-400" />
                {:else}
                    <ChevronRight class="h-4 w-4 text-slate-400" />
                {/if}
            {:else}
                <div class="w-4"></div>
            {/if}

            <!-- Icon based on whether it has children -->
            {#if node.children?.length > 0}
                <FolderOpen class="h-4 w-4 text-amber-500" />
            {:else}
                <FileText class="h-4 w-4 text-slate-400" />
            {/if}

            <!-- Account info -->
            <span class="font-mono text-sm text-slate-500 w-16"
                >{node.code}</span
            >
            <span class="font-medium flex-1">{node.name}</span>
            <span
                class="text-xs px-2 py-1 rounded-full {getTypeColor(
                    node.typeId,
                )}"
            >
                {node.typeName}
            </span>
            <span class="font-mono text-sm text-slate-600 w-32 text-right">
                {formatCurrency(node.balance || 0)}
            </span>
        </button>

        <!-- Children -->
        {#if node.children?.length > 0 && expandedNodes.has(node.id)}
            {#each node.children as child}
                {@render treeNode(child, level + 1)}
            {/each}
        {/if}
    </div>
{/snippet}
