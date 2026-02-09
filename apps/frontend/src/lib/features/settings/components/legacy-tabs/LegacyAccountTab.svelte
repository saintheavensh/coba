<script lang="ts">
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { User, Loader2 } from "lucide-svelte";
    import { AuthService } from "$lib/features/auth/auth.service";
    import { browser } from "$app/environment";
    import type { LegacySettingsController } from "../../legacy.controller.svelte";

    let { controller } = $props<{ controller: LegacySettingsController }>();

    let currentUser = $state<any>(null);

    // Load current user
    $effect(() => {
        if (browser) {
            currentUser = AuthService.getUser();
        }
    });
</script>

<Card>
    <CardHeader>
        <CardTitle>Akun Saya</CardTitle>
        <CardDescription>Informasi akun yang sedang login.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
        {#if currentUser}
            <div class="flex items-center gap-4">
                <div
                    class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                >
                    <User class="h-8 w-8" />
                </div>
                <div>
                    <h3 class="text-xl font-bold">{currentUser.name}</h3>
                    <div class="flex items-center gap-2 text-muted-foreground">
                        <span>@{currentUser.username}</span>
                        <Badge variant="secondary">{currentUser.role}</Badge>
                    </div>
                </div>
            </div>

            <Separator />

            <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={currentUser.name} readonly />
                </div>
                <div class="space-y-2">
                    <Label>Username</Label>
                    <Input value={currentUser.username} readonly />
                </div>
                <div class="space-y-2">
                    <Label>Role / Hak Akses</Label>
                    <Input value={currentUser.role} readonly />
                </div>
                <div class="space-y-2">
                    <Label>ID Pengguna</Label>
                    <Input value={currentUser.id} readonly />
                </div>
            </div>
        {:else}
            <div class="flex justify-center p-8">
                <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        {/if}
    </CardContent>
</Card>
