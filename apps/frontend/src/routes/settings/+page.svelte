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
    import { toast } from "$lib/components/ui/sonner";
    import { Store, User, Shield, Users, Plus, Trash2 } from "lucide-svelte";
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

    // Mock Data
    let storeName = "Jaya Abadi Cell";
    let storeAddress = "Jl. Merdeka No. 45, Jakarta Pusat";
    let storePhone = "0812-3456-7890";

    let userName = "Admin Toko";
    let userEmail = "admin@jayaabadi.com";

    function handleSaveStore() {
        toast.success("Informasi Toko berhasil disimpan.");
    }

    function handleSaveAccount() {
        toast.success("Profil akun berhasil diperbarui.");
    }

    // Employee Management Logic
    let employees = [
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
    ];

    let showAddEmployee = false;
    let newEmployee = { name: "", username: "", password: "", role: "Kasir" };

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
        toast.success("Karyawan baru berhasil ditambahkan.");
    }

    function handleDeleteEmployee(id: number) {
        employees = employees.filter((e) => e.id !== id);
        toast.success("Karyawan dihapus.");
    }
</script>

<div class="space-y-6">
    <div>
        <h3 class="text-lg font-medium">Pengaturan</h3>
        <p class="text-sm text-muted-foreground">
            Kelola preferensi aplikasi dan informasi tokomu.
        </p>
    </div>
    <Separator />

    <Tabs value="store" class="space-y-4">
        <TabsList>
            <TabsTrigger value="store" class="flex gap-2"
                ><Store class="h-4 w-4" /> Informasi Toko</TabsTrigger
            >
            <TabsTrigger value="account" class="flex gap-2"
                ><User class="h-4 w-4" /> Akun</TabsTrigger
            >
            <TabsTrigger value="employees" class="flex gap-2"
                ><Users class="h-4 w-4" /> Karyawan</TabsTrigger
            >
        </TabsList>

        <!-- Tab: Informasi Toko -->
        <TabsContent value="store">
            <Card>
                <CardHeader>
                    <CardTitle>Profil Toko</CardTitle>
                    <CardDescription>
                        Informasi ini akan ditampilkan pada Nota Penjualan.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-1">
                        <Label for="name">Nama Toko</Label>
                        <Input id="name" bind:value={storeName} />
                    </div>
                    <div class="space-y-1">
                        <Label for="address">Alamat Lengkap</Label>
                        <Input id="address" bind:value={storeAddress} />
                    </div>
                    <div class="space-y-1">
                        <Label for="phone">Nomor Telepon / WA</Label>
                        <Input id="phone" bind:value={storePhone} type="tel" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onclick={handleSaveStore}>Simpan Perubahan</Button>
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
                    <Dialog bind:open={showAddEmployee}>
                        <DialogTrigger>
                            <Button size="sm"
                                ><Plus class="mr-2 h-4 w-4" /> Tambah Karyawan</Button
                            >
                        </DialogTrigger>
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
    </Tabs>
</div>
