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

    import { api } from "$lib/api";

    let username = $state("");
    let password = $state("");
    let isLoading = $state(false);

    async function handleLogin() {
        if (!username || !password) {
            toast.error("Validasi Gagal", {
                description: "Username dan Password harus diisi",
            });
            return;
        }

        isLoading = true;
        try {
            const res = await api("/auth/login", {
                method: "POST",
                data: { username, password },
            });

            // Backend returns { success: true, data: { user: {...} } }
            // Axios wraps it in response.data, so we access res.data.data.user
            const user = res.data.data?.user || res.data.user;
            
            if (!user) {
                throw new Error("Invalid response format from server");
            }

            // Save user info
            localStorage.setItem("user", JSON.stringify(user));

            toast.success("Login Berhasil", {
                description: `Selamat datang, ${user.name}`,
            });

            // Force hard redirect to ensure sidebar and header state updates
            window.location.href = "/";
            // goto("/"); // Use hard redirect instead for auth state change
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                "Login gagal. Cek username/password.";
            toast.error("Gagal Masuk", { description: msg });
        } finally {
            isLoading = false;
        }
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
