<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { toast } from "$lib/components/ui/sonner";

    // TODO: Implement 3-step wizard form
    // Step 1: Customer & HP data
    // Step 2: Complaint & Technician
    // Step 3: Confirmation

    function handleCreateService() {
        toast.success("Fitur Service Form sedang dalam development");
    }
</script>

<Card>
    <CardHeader>
        <CardTitle>Service Baru</CardTitle>
        <CardDescription>
            Form ini akan menampilkan wizard 3-step untuk create service order.
        </CardDescription>
    </CardHeader>
    <CardContent>
        <div class="flex flex-col items-center justify-center py-12 space-y-4">
            <p class="text-muted-foreground text-center">
                3-Step Wizard Form untuk service baru<br />
                (Customer Data → Complaint → Confirmation)
            </p>
            <Button onclick={handleCreateService}>
                Coming Soon: Create Service
            </Button>
        </div>
    </CardContent>
</Card>
