<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { ArrowLeft, Shield } from "lucide-svelte";

    // TODO: Implement warranty claim form
    // This will allow:
    // - Search for completed service by service number
    // - Create warranty claim linked to original service
    // - Track warranty status
</script>

<div class="space-y-6">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/service">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Kembali
        </Button>
        <div>
            <h3 class="text-2xl font-bold tracking-tight">🛡️ Klaim Garansi</h3>
            <p class="text-sm text-muted-foreground">
                Ajukan klaim garansi untuk service sebelumnya
            </p>
        </div>
    </div>
    <Separator />

    <Card>
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                <Shield class="h-5 w-5" />
                Form Klaim Garansi
            </CardTitle>
            <CardDescription>
                Halaman ini sedang dalam pengembangan. Gunakan untuk mengajukan
                klaim garansi.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div
                class="flex flex-col items-center justify-center py-12 text-center"
            >
                <div class="text-6xl mb-4">🚧</div>
                <h4 class="text-lg font-semibold mb-2">Dalam Pengembangan</h4>
                <p class="text-muted-foreground mb-4">
                    Form klaim garansi sedang dikembangkan.
                </p>
                <Button href="/service">Lihat Daftar Service</Button>
            </div>
        </CardContent>
    </Card>
</div>
