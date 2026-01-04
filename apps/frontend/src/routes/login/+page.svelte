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
    import { toast } from "$lib/components/ui/sonner";
    import { goto } from "$app/navigation";
    import { Package } from "lucide-svelte";

    let username = "";
    let password = "";
    let isLoading = false;

    function handleLogin() {
        isLoading = true;

        // Simulate network delay
        setTimeout(() => {
            isLoading = false;
            if (username === "admin" && password === "admin") {
                toast.success("Login Berhasil", {
                    description: "Selamat datang kembali, Admin!",
                });
                goto("/");
            } else {
                toast.error("Login Gagal", {
                    description:
                        "Username atau password salah. Coba 'admin/admin'.",
                });
            }
        }, 1000);
    }
</script>

<div class="w-full max-w-md space-y-4">
    <div
        class="flex flex-col items-center justify-center space-y-2 text-center"
    >
        <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white"
        >
            <Package class="h-6 w-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight">Inventory App</h1>
        <p class="text-sm text-muted-foreground">
            Masuk untuk mengelola stok dan penjualan
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
                Masukkan username dan password Anda.
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
            <div class="space-y-2">
                <Label for="username">Username</Label>
                <Input
                    id="username"
                    placeholder="admin"
                    bind:value={username}
                />
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label for="password">Password</Label>
                    <a href="##" class="text-xs text-blue-600 hover:underline"
                        >Lupa password?</a
                    >
                </div>
                <Input
                    id="password"
                    type="password"
                    placeholder="admin"
                    bind:value={password}
                    onkeydown={(e) => e.key === "Enter" && handleLogin()}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button class="w-full" onclick={handleLogin} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Masuk Aplikasi"}
            </Button>
        </CardFooter>
    </Card>
</div>
