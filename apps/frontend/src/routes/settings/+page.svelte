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
    import { Store, User, Shield } from "lucide-svelte";

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
    </Tabs>
</div>
