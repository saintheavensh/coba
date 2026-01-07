<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { CustomersService } from "$lib/services/customers.service";

    import { Input } from "$lib/components/ui/input";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import {
        Plus,
        Pencil,
        Trash2,
        Phone,
        MapPin,
        Wallet,
        CreditCard,
        ArrowRight,
    } from "lucide-svelte";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Label } from "$lib/components/ui/label";
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/components/ui/avatar";
    import { toast } from "svelte-sonner";
    import SearchInput from "$lib/components/custom/search-input.svelte";
    import { formatCurrency } from "$lib/utils";

    const client = useQueryClient();

    // --- Queries ---
    const customersQuery = createQuery(() => ({
        queryKey: ["customers"],
        queryFn: () => CustomersService.getAll(),
    }));

    // --- Mutations ---
    const saveCustomerMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            if (data.id) {
                return CustomersService.update(data.id, data);
            } else {
                return CustomersService.create(data);
            }
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Data pelanggan disimpan");
            openDialog = false;
            resetForm();
        },
        onError: (err: any) => {
            toast.error(
                err.response?.data?.message || "Gagal menyimpan pelanggan",
            );
        },
    }));

    const deleteCustomerMutation = createMutation(() => ({
        mutationFn: CustomersService.delete,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Pelanggan dihapus");
        },
        onError: () => toast.error("Gagal menghapus pelanggan"),
    }));

    // Local State
    let searchQuery = $state("");
    let openDialog = $state(false);

    // Form State
    let editingId = $state<string | null>(null);
    let name = $state("");
    let phone = $state("");
    let address = $state("");
    let creditLimit = $state(0);
    // let image = $state("");

    // Reactive Data
    let customers = $derived(customersQuery.data || []);
    let loading = $derived(customersQuery.isLoading);

    let filteredCustomers = $derived(
        (customers || []).filter(
            (c: any) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.phone && c.phone.includes(searchQuery)),
        ),
    );

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    function resetForm() {
        editingId = null;
        name = "";
        phone = "";
        address = "";
        creditLimit = 0;
    }

    function handleEdit(customer: any) {
        editingId = customer.id;
        name = customer.name;
        phone = customer.phone || "";
        address = customer.address || "";
        creditLimit = customer.creditLimit || 0;
        openDialog = true;
    }

    let deleteId = $state<string | null>(null);
    let openDelete = $state(false);

    function confirmDelete(id: string) {
        deleteId = id;
        openDelete = true;
    }

    function handleDelete() {
        if (!deleteId) return;
        deleteCustomerMutation.mutate(deleteId);
        openDelete = false;
        deleteId = null;
    }

    const payDebtMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            return CustomersService.payDebt(data.id, data.amount, data.notes);
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Pembayaran berhasil dicatat");
            openPaymentDialog = false;
            resetPaymentForm();
        },
        onError: (err: any) => {
            toast.error(
                err.response?.data?.message || "Gagal mencatat pembayaran",
            );
        },
    }));

    // Payment State
    let openPaymentDialog = $state(false);
    let payingCustomerId = $state<string | null>(null);
    let paymentAmount = $state<number>(0);
    let paymentNotes = $state("");

    function resetPaymentForm() {
        payingCustomerId = null;
        paymentAmount = 0;
        paymentNotes = "";
    }

    function openPayment(customer: any) {
        payingCustomerId = customer.id;
        paymentAmount = customer.debt || 0; // Default to full debt
        paymentNotes = "";
        openPaymentDialog = true;
    }

    function handlePayment() {
        if (!payingCustomerId) return;
        if (paymentAmount <= 0)
            return toast.error("Jumlah pembayaran harus > 0");

        payDebtMutation.mutate({
            id: payingCustomerId,
            amount: Number(paymentAmount),
            notes: paymentNotes,
        });
    }

    function handleSave() {
        if (!name) return toast.error("Nama wajib diisi");
        if (!phone) return toast.error("Telepon wajib diisi");

        const payload = {
            id: editingId,
            name,
            phone,
            address,
            creditLimit: Number(creditLimit),
        };
        saveCustomerMutation.mutate(payload);
    }
</script>

<div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Pelanggan</h2>
            <p class="text-muted-foreground">
                Manajemen data pelanggan dan limit kredit.
            </p>
        </div>
    </div>

    <div class="flex justify-between items-center">
        <SearchInput bind:value={searchQuery} placeholder="Cari pelanggan..." />

        <Dialog bind:open={openDialog} onOpenChange={(o) => !o && resetForm()}>
            <DialogTrigger class={buttonVariants({ variant: "default" })}>
                <Plus class="mr-2 h-4 w-4" /> Pelanggan Baru
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        >{editingId ? "Edit" : "Tambah"} Pelanggan</DialogTitle
                    >
                    <DialogDescription
                        >Input data pelanggan baru.</DialogDescription
                    >
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right"
                            >Nama <span class="text-red-500">*</span></Label
                        >
                        <Input
                            bind:value={name}
                            placeholder="Nama Pelanggan"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right"
                            >Telepon <span class="text-red-500">*</span></Label
                        >
                        <Input
                            bind:value={phone}
                            placeholder="08xxx"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Alamat</Label>
                        <Input
                            bind:value={address}
                            placeholder="Alamat lengkap"
                            class="col-span-3"
                        />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label class="text-right">Limit Kredit</Label>
                        <div class="col-span-3 relative">
                            <span
                                class="absolute left-3 top-2.5 text-muted-foreground text-sm"
                                >Rp</span
                            >
                            <Input
                                type="number"
                                bind:value={creditLimit}
                                class="pl-9"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onclick={handleSave}
                        disabled={saveCustomerMutation.isPending}
                    >
                        {saveCustomerMutation.isPending
                            ? "Menyimpan..."
                            : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#if loading && customers.length === 0}
            <div class="col-span-full p-8 text-center text-muted-foreground">
                Memuat data...
            </div>
        {:else if filteredCustomers.length === 0}
            <div
                class="col-span-full p-8 text-center border rounded-lg bg-muted/20"
            >
                <p class="text-muted-foreground">Belum ada data pelanggan.</p>
            </div>
        {:else}
            {#each filteredCustomers as cust (cust.id)}
                <div
                    class="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex gap-3">
                            <Avatar class="h-10 w-10 border">
                                <AvatarFallback
                                    class="bg-primary/10 text-primary font-bold"
                                >
                                    {getInitials(cust.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <a
                                    href={`/customers/${cust.id}`}
                                    class="font-semibold hover:underline block"
                                    >{cust.name}</a
                                >
                                <div
                                    class="text-sm text-muted-foreground flex items-center gap-2"
                                >
                                    <Phone class="h-3 w-3" />
                                    {cust.phone}
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8"
                                href={`/customers/${cust.id}`}
                            >
                                <ArrowRight class="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8"
                                onclick={() => handleEdit(cust)}
                            >
                                <Pencil class="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-red-500 hover:bg-red-50"
                                onclick={() => confirmDelete(cust.id)}
                            >
                                <Trash2 class="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div class="mt-4 space-y-2 text-sm">
                        {#if cust.address}
                            <div
                                class="flex items-center gap-2 text-muted-foreground"
                            >
                                <MapPin class="h-3.5 w-3.5" />
                                <span class="truncate">{cust.address}</span>
                            </div>
                        {/if}

                        <div class="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div class="bg-red-50 p-2 rounded text-center">
                                <span class="text-xs text-red-500 block"
                                    >Hutang</span
                                >
                                <span class="font-bold text-red-700"
                                    >{formatCurrency(cust.debt || 0)}</span
                                >
                            </div>
                            <div class="bg-green-50 p-2 rounded text-center">
                                <span class="text-xs text-green-600 block"
                                    >Limit</span
                                >
                                <span class="font-bold text-green-700"
                                    >{formatCurrency(
                                        cust.creditLimit || 0,
                                    )}</span
                                >
                            </div>
                        </div>

                        {#if (cust.debt || 0) > 0}
                            <Button
                                class="w-full mt-2"
                                size="sm"
                                href={`/customers/${cust.id}`}
                            >
                                <Wallet class="h-4 w-4 mr-2" /> Lihat Tagihan
                            </Button>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Payment Dialog -->
    <Dialog
        bind:open={openPaymentDialog}
        onOpenChange={(o) => !o && resetPaymentForm()}
    >
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Bayar Hutang</DialogTitle>
                <DialogDescription>
                    Catat pembayaran hutang pelanggan.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label>Jumlah Pembayaran</Label>
                    <div class="relative">
                        <span
                            class="absolute left-3 top-2.5 text-muted-foreground text-sm"
                            >Rp</span
                        >
                        <Input
                            type="number"
                            class="pl-9"
                            bind:value={paymentAmount}
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label>Catatan (Opsional)</Label>
                    <Input
                        bind:value={paymentNotes}
                        placeholder="Contoh: Transfer Bank BCA"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (openPaymentDialog = false)}>Batal</Button
                >
                <Button
                    onclick={handlePayment}
                    disabled={payDebtMutation.isPending}
                >
                    {payDebtMutation.isPending ? "Memproses..." : "Bayar"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog.Root bind:open={openDelete}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Hapus Pelanggan?</AlertDialog.Title>
                <AlertDialog.Description>
                    Tindakan ini tidak dapat dibatalkan.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
                <AlertDialog.Action
                    onclick={handleDelete}
                    class="bg-red-600 text-white hover:bg-red-700"
                    >Hapus</AlertDialog.Action
                >
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>
