<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import {
        Plus,
        Pencil,
        Trash2,
        Loader2,
        Shield,
        Users,
    } from "lucide-svelte";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();
</script>

<Card>
    <CardHeader>
        <div class="flex items-center justify-between">
            <div>
                <CardTitle>Daftar Pengguna / Karyawan</CardTitle>
                <CardDescription>
                    Kelola akses login untuk teknisi dan kasir.
                </CardDescription>
            </div>
            <Button onclick={() => controller.openAddUser()}>
                <Plus class="mr-2 h-4 w-4" /> Tambah User
            </Button>
        </div>
    </CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if controller.usersQuery.isLoading}
                    <TableRow>
                        <TableCell colspan={4} class="text-center py-8">
                            <Loader2
                                class="h-6 w-6 animate-spin mx-auto text-muted-foreground"
                            />
                        </TableCell>
                    </TableRow>
                {:else if controller.usersQuery.isError}
                    <TableRow>
                        <TableCell
                            colspan={4}
                            class="text-center py-8 text-red-500"
                        >
                            Gagal memuat data pengguna.
                        </TableCell>
                    </TableRow>
                {:else if !controller.usersQuery.data || controller.usersQuery.data.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={4}
                            class="text-center py-8 text-muted-foreground"
                        >
                            Belum ada user tambahan.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each controller.usersQuery.data as user}
                        <TableRow>
                            <TableCell class="font-medium">
                                {user.name}
                            </TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    class={user.role === "admin"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"}
                                >
                                    {#if user.role === "admin"}
                                        <Shield class="mr-1 h-3 w-3" />
                                    {:else}
                                        <Users class="mr-1 h-3 w-3" />
                                    {/if}
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-right">
                                <div class="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={() =>
                                            controller.openEditUser(user)}
                                    >
                                        <Pencil class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-red-500"
                                        disabled={user.role === "admin" &&
                                            user.username === "admin"}
                                        onclick={() =>
                                            controller.deleteUser(user.id)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </CardContent>
</Card>

<!-- User Dialog (Add/Edit) -->
<Dialog
    bind:open={controller.showUserDialog}
    onOpenChange={(open) => {
        controller.showUserDialog = open;
    }}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle
                >{controller.editingUser
                    ? "Edit User"
                    : "Tambah User Baru"}</DialogTitle
            >
            <DialogDescription>
                {controller.editingUser
                    ? "Ubah data pengguna."
                    : "Isi form untuk membuat user baru."}
            </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Nama Lengkap</Label>
                <Input
                    bind:value={controller.userForm.name}
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Username</Label>
                <Input
                    bind:value={controller.userForm.username}
                    class="col-span-3"
                    disabled={!!controller.editingUser}
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right">Role</Label>
                <Select type="single" bind:value={controller.userForm.role}>
                    <SelectTrigger class="col-span-3">
                        {controller.userForm.role === "admin"
                            ? "Admin / Owner"
                            : "Teknisi / Staff"}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="teknisi">Teknisi / Staff</SelectItem>
                        <SelectItem value="admin">Admin / Owner</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {#if !controller.editingUser}
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label class="text-right">Password</Label>
                    <Input
                        type="password"
                        bind:value={controller.userForm.password}
                        class="col-span-3"
                    />
                </div>
            {/if}
        </div>
        <DialogFooter class="flex justify-between sm:justify-between">
            {#if controller.editingUser}
                <Button
                    variant="outline"
                    class="text-destructive border-destructive hover:bg-destructive/10"
                    onclick={() => controller.resetPassword()}
                >
                    Reset Password
                </Button>
            {:else}
                <div></div>
            {/if}
            <div class="flex gap-2">
                <Button
                    variant="ghost"
                    onclick={() => (controller.showUserDialog = false)}
                >
                    Batal
                </Button>
                <Button
                    onclick={() => controller.saveUser()}
                    disabled={controller.saving}
                >
                    {#if controller.saving}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Simpan
                </Button>
            </div>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Confirmation Dialog -->
<AlertDialog.Root
    open={controller.confirmDialog.open}
    onOpenChange={(open) => (controller.confirmDialog.open = open)}
>
    <!-- Note: AlertDialog.Trigger is not used here as we trigger via state -->
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title
                >{controller.confirmDialog.title}</AlertDialog.Title
            >
            <AlertDialog.Description>
                {controller.confirmDialog.description}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={controller.confirmDialog.isLoading}
                >Batal</AlertDialog.Cancel
            >
            <Button
                variant={controller.confirmDialog.variant || "destructive"}
                onclick={() => controller.handleConfirm()}
                disabled={controller.confirmDialog.isLoading}
            >
                {#if controller.confirmDialog.isLoading}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                {controller.confirmDialog.actionLabel}
            </Button>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
