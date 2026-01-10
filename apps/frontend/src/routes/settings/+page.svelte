<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "svelte-sonner"; // Update import according to svelte-sonner usage
    import {
        Store,
        User,
        Shield,
        Users,
        Plus,
        Trash2,
        Settings,
        Receipt,
        ScrollText,
        MinusCircle,
        CreditCard,
        Banknote,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Switch } from "$lib/components/ui/switch";
    import { onMount } from "svelte";
    import {
        SettingsService,
        PaymentMethodsService,
        type PaymentMethod,
        type PaymentVariant,
        PAYMENT_ICONS,
        PAYMENT_TYPES,
    } from "$lib/services/settings.service";

    // Store
    import { settings, activityLogs } from "$lib/stores/settings";

    // Payment Methods State
    let paymentMethods = $state<PaymentMethod[]>([]);
    let loadingPayment = $state(false);
    let savingPayment = $state(false);
    let newVariantByMethod = $state<
        Record<
            string,
            { name: string; accountNumber: string; accountHolder: string }
        >
    >({});
    let newMethod = $state({
        name: "",
        icon: "💳",
        type: "custom" as "cash" | "transfer" | "qris" | "ewallet" | "custom",
    });
    let showAddMethod = $state(false);

    async function loadPaymentMethods() {
        loadingPayment = true;
        try {
            paymentMethods = await PaymentMethodsService.getAll();
        } catch (e) {
            console.error("Failed to load payment methods", e);
            toast.error("Gagal memuat metode pembayaran.");
        } finally {
            loadingPayment = false;
        }
    }

    onMount(() => {
        loadPaymentMethods();
    });

    async function addPaymentMethod() {
        if (!newMethod.name) return;
        savingPayment = true;
        try {
            await PaymentMethodsService.create({
                name: newMethod.name,
                type: newMethod.type,
                icon: newMethod.icon || "💳",
            });
            await loadPaymentMethods();
            newMethod = { name: "", icon: "💳", type: "custom" };
            showAddMethod = false;
            toast.success("Metode pembayaran berhasil ditambahkan.");
        } catch (e) {
            toast.error("Gagal menambah metode pembayaran.");
        } finally {
            savingPayment = false;
        }
    }

    async function togglePaymentMethod(id: string, enabled: boolean) {
        try {
            await PaymentMethodsService.update(id, { enabled });
            await loadPaymentMethods();
        } catch (e) {
            toast.error("Gagal mengubah status metode.");
        }
    }

    async function removePaymentMethod(id: string) {
        savingPayment = true;
        try {
            await PaymentMethodsService.disable(id);
            await loadPaymentMethods();
            toast.success("Metode pembayaran berhasil dinonaktifkan.");
        } catch (e) {
            toast.error("Gagal menonaktifkan metode pembayaran.");
        } finally {
            savingPayment = false;
        }
    }

    function getNewVariant(methodId: string) {
        if (!newVariantByMethod[methodId]) {
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
        }
        return newVariantByMethod[methodId];
    }

    async function addVariant(methodId: string) {
        const variant = newVariantByMethod[methodId];
        if (!variant?.name) return;
        savingPayment = true;
        try {
            await PaymentMethodsService.addVariant(methodId, {
                name: variant.name,
                accountNumber: variant.accountNumber || undefined,
                accountHolder: variant.accountHolder || undefined,
            });
            await loadPaymentMethods();
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
            };
            toast.success("Varian berhasil ditambahkan.");
        } catch (e) {
            toast.error("Gagal menambah varian.");
        } finally {
            savingPayment = false;
        }
    }

    async function removeVariant(methodId: string, variantId: string) {
        savingPayment = true;
        try {
            await PaymentMethodsService.disableVariant(methodId, variantId);
            await loadPaymentMethods();
            toast.success("Varian berhasil dinonaktifkan.");
        } catch (e) {
            toast.error("Gagal menonaktifkan varian.");
        } finally {
            savingPayment = false;
        }
    }

    // State for new preset
    let newPresetLabel = $state("");
    let newPresetDays = $state("");

    function addPreset() {
        if (!newPresetLabel || !newPresetDays) return;

        settings.updateSetting("warrantyPresets", [
            ...$settings.warrantyPresets,
            { label: newPresetLabel, days: parseInt(newPresetDays) },
        ]);

        newPresetLabel = "";
        newPresetDays = "";
    }

    function removePreset(index: number) {
        const newPresets = $settings.warrantyPresets.filter(
            (_, i) => i !== index,
        );
        settings.updateSetting("warrantyPresets", newPresets);
    }

    // Local state to bind with store
    // Ideally we subscribe, but for simplicity in this form we can auto-subscribe via $settings

    let userName = $state("Admin Toko");
    let userEmail = $state("admin@jayaabadi.com");

    function handleSaveSettings() {
        // In a real app, we would persist to backend here
        // Store is already updated via two-way binding with $settings
        activityLogs.addLog(
            "Admin",
            "Update Settings",
            "Mengubah pengaturan sistem/toko.",
            "info",
        );
        toast.success("Pengaturan berhasil disimpan.");
    }

    function handleSaveAccount() {
        activityLogs.addLog(
            "Admin",
            "Update Profile",
            "Memperbarui profil akun.",
            "success",
        );
        toast.success("Profil akun berhasil diperbarui.");
    }

    // Employee Management Logic
    let employees = $state([
        {
            id: 1,
            name: "Budi Santoso",
            username: "budi",
            role: "Kasir",
            status: "Aktif",
        },
        {
            id: 2,
            name: "Siti Aminah",
            username: "siti",
            role: "Staf Gudang",
            status: "Aktif",
        },
        {
            id: 3,
            name: "Admin Toko",
            username: "admin",
            role: "Administrator",
            status: "Aktif",
        },
    ]);

    let showAddEmployee = $state(false);
    let newEmployee = $state({
        name: "",
        username: "",
        password: "",
        role: "Kasir",
    });

    function handleAddEmployee() {
        employees = [
            ...employees,
            {
                id: Date.now(),
                name: newEmployee.name,
                username: newEmployee.username,
                role: newEmployee.role,
                status: "Aktif",
            },
        ];
        showAddEmployee = false;
        newEmployee = { name: "", username: "", password: "", role: "Kasir" };
        activityLogs.addLog(
            "Admin",
            "Add Employee",
            `Menambahkan karyawan baru: ${employees[employees.length - 1].name}`,
            "success",
        );
        toast.success("Karyawan baru berhasil ditambahkan.");
    }

    function handleDeleteEmployee(id: number) {
        const emp = employees.find((e) => e.id === id);
        employees = employees.filter((e) => e.id !== id);
        activityLogs.addLog(
            "Admin",
            "Delete Employee",
            `Menghapus karyawan: ${emp?.name}`,
            "warning",
        );
        toast.success("Karyawan dihapus.");
    }
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">Pengaturan</h3>
        <p class="text-sm text-muted-foreground">
            Kelola preferensi aplikasi, informasi toko, dan karyawan.
        </p>
    </div>
    <Separator />

    <Tabs value="general" class="space-y-4">
        <TabsList>
            <TabsTrigger value="general" class="flex gap-2"
                ><Settings class="h-4 w-4" /> Umum & Garansi</TabsTrigger
            >
            <TabsTrigger value="store" class="flex gap-2"
                ><Store class="h-4 w-4" /> Informasi Toko</TabsTrigger
            >
            <TabsTrigger value="employees" class="flex gap-2"
                ><Users class="h-4 w-4" /> Karyawan</TabsTrigger
            >
            <TabsTrigger value="account" class="flex gap-2"
                ><User class="h-4 w-4" /> Akun Saya</TabsTrigger
            >
            <TabsTrigger value="payment" class="flex gap-2"
                ><CreditCard class="h-4 w-4" /> Pembayaran</TabsTrigger
            >
        </TabsList>

        <!-- Tab: Umum & Garansi -->
        <TabsContent value="general">
            <Card>
                <CardHeader>
                    <CardTitle>Konfigurasi Garansi</CardTitle>
                    <CardDescription>
                        Atur kebijakan standar untuk layanan service.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Default Warranty Removed in favor of Presets -->
                        <div class="space-y-4 col-span-2">
                            <Label>Opsi Pilihan Garansi</Label>
                            <div class="border rounded-md p-4 space-y-4">
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="space-y-1">
                                        <Label class="text-xs"
                                            >Label (Tampilan)</Label
                                        >
                                        <Input
                                            placeholder="Contoh: Garansi 1 Minggu"
                                            bind:value={newPresetLabel}
                                        />
                                    </div>
                                    <div class="space-y-1">
                                        <Label class="text-xs"
                                            >Durasi (Hari)</Label
                                        >
                                        <div class="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="7"
                                                bind:value={newPresetDays}
                                            />
                                            <Button
                                                variant="secondary"
                                                onclick={addPreset}
                                                >Tambah</Button
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    {#each $settings.warrantyPresets as preset, i}
                                        <div
                                            class="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                                        >
                                            <span
                                                >{preset.label} ({preset.days} Hari)</span
                                            >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-6 w-6 text-red-500"
                                                onclick={() => removePreset(i)}
                                            >
                                                <MinusCircle class="h-4 w-4" />
                                            </Button>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <Label>Masa Tenggang Garansi (Hari)</Label>
                            <Input
                                type="number"
                                bind:value={$settings.gracePeriodDays}
                            />
                            <p class="text-xs text-muted-foreground">
                                Batas waktu klaim kebijakan toko setelah
                                expired.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={handleSaveSettings}
                        >Simpan Pengaturan</Button
                    >
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- Tab: Informasi Toko -->
        <TabsContent value="store">
            <Card>
                <CardHeader>
                    <CardTitle>Profil Toko & Nota</CardTitle>
                    <CardDescription>
                        Informasi ini akan ditampilkan pada Nota Penjualan dan
                        Service.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 mb-2">
                            <Store class="h-4 w-4 text-muted-foreground" />
                            <Label class="font-semibold">Identitas Toko</Label>
                        </div>
                        <div class="grid gap-4">
                            <div>
                                <Label for="name">Nama Toko</Label>
                                <Input id="name" bind:value={$settings.name} />
                            </div>
                            <div>
                                <Label for="address">Alamat Lengkap</Label>
                                <Textarea
                                    id="address"
                                    bind:value={$settings.address}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label for="phone">Nomor Telepon / WA</Label>
                                <Input
                                    id="phone"
                                    bind:value={$settings.phone}
                                    type="tel"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div class="space-y-1">
                        <div class="flex items-center gap-2 mb-2">
                            <ScrollText class="h-4 w-4 text-muted-foreground" />
                            <Label class="font-semibold"
                                >Pengaturan Nota (Receipt)</Label
                            >
                        </div>
                        <div>
                            <Label for="footer">Catatan Footer Nota</Label>
                            <Textarea
                                id="footer"
                                bind:value={$settings.receiptFooter}
                                placeholder="Contoh: Barang yang sudah dibeli tidak dapat dikembalikan."
                                rows={2}
                            />
                            <p class="text-xs text-muted-foreground">
                                Pesan ini akan muncul di bagian bawah struk.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={handleSaveSettings}
                        >Simpan Perubahan</Button
                    >
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- Tab: Akun -->
        <TabsContent value="account">
            <Card>
                <CardHeader>
                    <CardTitle>Akun Pengguna</CardTitle>
                    <CardDescription>
                        Informasi login dan keamanan akun.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-1">
                        <Label for="username">Nama Pengguna</Label>
                        <Input id="username" bind:value={userName} />
                    </div>
                    <div class="space-y-1">
                        <Label for="email">Email</Label>
                        <Input id="email" bind:value={userEmail} type="email" />
                    </div>
                    <Separator class="my-4" />
                    <div class="space-y-4">
                        <h4 class="text-sm font-medium flex items-center gap-2">
                            <Shield class="h-4 w-4 text-muted-foreground" /> Keamanan
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <Label for="password">Password Baru</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Kosongkan jika tidak ubah"
                                />
                            </div>
                            <div class="space-y-1">
                                <Label for="confirm">Konfirmasi Password</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    placeholder="Ulangi password baru"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={handleSaveAccount}>Update Profil</Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <!-- Tab: Karyawan -->
        <TabsContent value="employees">
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daftar Karyawan</CardTitle>
                        <CardDescription>
                            Kelola akses pengguna aplikasi (Administrator,
                            Kasir, Staf).
                        </CardDescription>
                    </div>
                    <Button size="sm" onclick={() => (showAddEmployee = true)}>
                        <Plus class="mr-2 h-4 w-4" /> Tambah Karyawan
                    </Button>
                    <Dialog bind:open={showAddEmployee}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                                <DialogDescription
                                    >Buat akun login baru untuk staf Anda.</DialogDescription
                                >
                            </DialogHeader>
                            <div class="grid gap-4 py-4">
                                <div class="space-y-1">
                                    <Label>Nama Lengkap</Label>
                                    <Input
                                        bind:value={newEmployee.name}
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <Label>Username</Label>
                                    <Input
                                        bind:value={newEmployee.username}
                                        placeholder="Username untuk login"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <Label>Password</Label>
                                    <Input
                                        type="password"
                                        bind:value={newEmployee.password}
                                    />
                                </div>
                                <div class="space-y-1">
                                    <Label>Role / Jabatan</Label>
                                    <Select
                                        type="single"
                                        name="role"
                                        bind:value={newEmployee.role}
                                    >
                                        <SelectTrigger>
                                            {newEmployee.role || "Pilih Role"}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Administrator"
                                                >Administrator (Full Akses)</SelectItem
                                            >
                                            <SelectItem value="Kasir"
                                                >Kasir (Penjualan saja)</SelectItem
                                            >
                                            <SelectItem value="Staf Gudang"
                                                >Staf Gudang (Stok saja)</SelectItem
                                            >
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onclick={handleAddEmployee}
                                    >Simpan Akun</Button
                                >
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead class="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each employees as emp}
                                <TableRow>
                                    <TableCell class="font-medium"
                                        >{emp.name}</TableCell
                                    >
                                    <TableCell>{emp.username}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline"
                                            >{emp.role}</Badge
                                        >
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            class="bg-green-100 text-green-700 hover:bg-green-100 border-none"
                                            >{emp.status}</Badge
                                        >
                                    </TableCell>
                                    <TableCell class="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 text-red-500"
                                            onclick={() =>
                                                handleDeleteEmployee(emp.id)}
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- Tab: Pembayaran -->
        <TabsContent value="payment">
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Metode Pembayaran</CardTitle>
                        <CardDescription>
                            Atur metode pembayaran yang tersedia untuk
                            pelanggan.
                        </CardDescription>
                    </div>
                    <Button size="sm" onclick={() => (showAddMethod = true)}>
                        <Plus class="h-4 w-4 mr-1" /> Tambah Metode
                    </Button>
                    <Dialog bind:open={showAddMethod}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle
                                    >Tambah Metode Pembayaran</DialogTitle
                                >
                                <DialogDescription>
                                    Buat metode pembayaran baru.
                                </DialogDescription>
                            </DialogHeader>
                            <div class="grid gap-4 py-4">
                                <div class="space-y-2">
                                    <Label>Nama Metode</Label>
                                    <Input
                                        bind:value={newMethod.name}
                                        placeholder="Contoh: GoPay, OVO, BCA"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label>Tipe</Label>
                                    <select
                                        class="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        bind:value={newMethod.type}
                                    >
                                        {#each PAYMENT_TYPES as pt}
                                            <option value={pt.id}
                                                >{pt.label}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <Label>Pilih Ikon</Label>
                                    <div class="flex flex-wrap gap-2">
                                        {#each PAYMENT_ICONS as pi}
                                            <button
                                                type="button"
                                                class="p-3 text-2xl rounded-lg border-2 transition-all {newMethod.icon ===
                                                pi.icon
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-transparent bg-muted/50 hover:bg-muted'}"
                                                onclick={() =>
                                                    (newMethod.icon = pi.icon)}
                                                title={pi.label}
                                            >
                                                {pi.icon}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onclick={addPaymentMethod}
                                    >Tambah</Button
                                >
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent class="space-y-4">
                    {#if loadingPayment}
                        <p class="text-center text-muted-foreground py-8">
                            Memuat...
                        </p>
                    {:else if paymentMethods.length === 0}
                        <p class="text-center text-muted-foreground py-8">
                            Belum ada metode pembayaran. Klik "Tambah Metode"
                            untuk memulai.
                        </p>
                    {:else}
                        {#each paymentMethods as method, idx}
                            <div class="p-4 border rounded-lg space-y-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="p-2 rounded-lg {method.type ===
                                            'cash'
                                                ? 'bg-green-100'
                                                : method.type === 'transfer'
                                                  ? 'bg-blue-100'
                                                  : method.type === 'qris'
                                                    ? 'bg-purple-100'
                                                    : 'bg-gray-100'}"
                                        >
                                            <span class="text-xl"
                                                >{method.icon}</span
                                            >
                                        </div>
                                        <div>
                                            <p class="font-medium">
                                                {method.name}
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground capitalize"
                                            >
                                                {method.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Switch
                                            checked={method.enabled}
                                            onCheckedChange={(checked) =>
                                                togglePaymentMethod(
                                                    method.id,
                                                    checked,
                                                )}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="text-red-500 h-8 w-8"
                                            onclick={() =>
                                                removePaymentMethod(method.id)}
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <!-- Variants section for non-cash types -->
                                {#if method.type !== "cash" && method.enabled}
                                    {@const methodId = method.id}
                                    <Separator />
                                    <div class="space-y-3">
                                        <Label class="text-sm font-medium">
                                            {method.type === "transfer"
                                                ? "Daftar Rekening Bank"
                                                : "Daftar " + method.name}
                                        </Label>

                                        <!-- Add Variant Form -->
                                        <div class="grid grid-cols-4 gap-2">
                                            <Input
                                                placeholder={method.type ===
                                                "transfer"
                                                    ? "Nama Bank"
                                                    : "Nama"}
                                                value={newVariantByMethod[
                                                    methodId
                                                ]?.name ?? ""}
                                                oninput={(e) => {
                                                    if (
                                                        !newVariantByMethod[
                                                            methodId
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            methodId
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                        };
                                                    newVariantByMethod[
                                                        methodId
                                                    ].name =
                                                        e.currentTarget.value;
                                                }}
                                            />
                                            {#if method.type === "transfer"}
                                                <Input
                                                    placeholder="Nomor Rekening"
                                                    value={newVariantByMethod[
                                                        methodId
                                                    ]?.accountNumber ?? ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                methodId
                                                            ]
                                                        )
                                                            newVariantByMethod[
                                                                methodId
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        newVariantByMethod[
                                                            methodId
                                                        ].accountNumber =
                                                            e.currentTarget.value;
                                                    }}
                                                />
                                                <Input
                                                    placeholder="Atas Nama"
                                                    value={newVariantByMethod[
                                                        methodId
                                                    ]?.accountHolder ?? ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                methodId
                                                            ]
                                                        )
                                                            newVariantByMethod[
                                                                methodId
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        newVariantByMethod[
                                                            methodId
                                                        ].accountHolder =
                                                            e.currentTarget.value;
                                                    }}
                                                />
                                            {:else}
                                                <Input
                                                    placeholder="Nomor/ID (opsional)"
                                                    value={newVariantByMethod[
                                                        methodId
                                                    ]?.accountNumber ?? ""}
                                                    oninput={(e) => {
                                                        if (
                                                            !newVariantByMethod[
                                                                methodId
                                                            ]
                                                        )
                                                            newVariantByMethod[
                                                                methodId
                                                            ] = {
                                                                name: "",
                                                                accountNumber:
                                                                    "",
                                                                accountHolder:
                                                                    "",
                                                            };
                                                        newVariantByMethod[
                                                            methodId
                                                        ].accountNumber =
                                                            e.currentTarget.value;
                                                    }}
                                                />
                                                <div></div>
                                            {/if}
                                            <Button
                                                variant="secondary"
                                                onclick={() =>
                                                    addVariant(method.id)}
                                            >
                                                <Plus class="h-4 w-4 mr-1" /> Tambah
                                            </Button>
                                        </div>

                                        <!-- Variant List -->
                                        {#if !method.variants?.length}
                                            <p
                                                class="text-sm text-muted-foreground text-center py-2"
                                            >
                                                Belum ada. Tambahkan di atas.
                                            </p>
                                        {:else}
                                            <div class="space-y-2">
                                                {#each method.variants as variant}
                                                    <div
                                                        class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                                    >
                                                        <div>
                                                            <p
                                                                class="font-medium"
                                                            >
                                                                {variant.name}
                                                            </p>
                                                            {#if variant.accountNumber || variant.accountHolder}
                                                                <p
                                                                    class="text-sm text-muted-foreground"
                                                                >
                                                                    {variant.accountNumber ||
                                                                        ""}{variant.accountHolder
                                                                        ? " - " +
                                                                          variant.accountHolder
                                                                        : ""}
                                                                </p>
                                                            {/if}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="text-red-500"
                                                            onclick={() =>
                                                                removeVariant(
                                                                    method.id,
                                                                    variant.id,
                                                                )}
                                                        >
                                                            <Trash2
                                                                class="h-4 w-4"
                                                            />
                                                        </Button>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    {/if}
                </CardContent>
                <CardFooter>
                    <Button
                        onclick={savePaymentMethods}
                        disabled={savingPayment}
                    >
                        {savingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
    </Tabs>
</div>
