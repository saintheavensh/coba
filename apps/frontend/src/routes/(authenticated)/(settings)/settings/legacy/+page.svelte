<script lang="ts">
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import {
        Store,
        User,
        Users,
        Receipt,
        Wrench,
        MessageCircle,
        CreditCard,
    } from "lucide-svelte";
    import { LegacySettingsController } from "$lib/features/settings/legacy.controller.svelte";

    // Tab Components
    import LegacyStoreTab from "$lib/features/settings/components/legacy-tabs/LegacyStoreTab.svelte";
    import LegacyReceiptTab from "$lib/features/settings/components/legacy-tabs/LegacyReceiptTab.svelte";
    import LegacyServiceTab from "$lib/features/settings/components/legacy-tabs/LegacyServiceTab.svelte";
    import LegacyWhatsappTab from "$lib/features/settings/components/legacy-tabs/LegacyWhatsappTab.svelte";
    import LegacyPaymentTab from "$lib/features/settings/components/legacy-tabs/LegacyPaymentTab.svelte";
    import LegacyUsersTab from "$lib/features/settings/components/legacy-tabs/LegacyUsersTab.svelte";
    import LegacyAccountTab from "$lib/features/settings/components/legacy-tabs/LegacyAccountTab.svelte";

    // Initialize Controller
    const controller = new LegacySettingsController();

    // Sync data from controller's internal queries to its state
    $effect(() => {
        controller.syncSettingsData(controller.settingsQuery.data);
        controller.syncPaymentMethods(controller.paymentMethodsQuery.data);
    });
</script>

<div class="container mx-auto p-4 max-w-5xl space-y-6 pb-20">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Pengaturan</h1>
            <p class="text-muted-foreground">
                Kelola informasi toko, preferensi aplikasi, dan pengguna.
            </p>
        </div>
    </div>

    <Tabs bind:value={controller.activeTab} class="w-full">
        <TabsList
            class="w-full justify-start h-auto flex-wrap p-2 gap-2 bg-muted/50"
        >
            <TabsTrigger value="store" class="flex gap-2 min-w-fit">
                <Store class="h-4 w-4" /> Informasi Toko
            </TabsTrigger>
            <TabsTrigger value="receipt" class="flex gap-2 min-w-fit">
                <Receipt class="h-4 w-4" /> Nota & Struk
            </TabsTrigger>
            <TabsTrigger value="service" class="flex gap-2 min-w-fit">
                <Wrench class="h-4 w-4" /> Service
            </TabsTrigger>
            <TabsTrigger value="whatsapp" class="flex gap-2 min-w-fit">
                <MessageCircle class="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="payment" class="flex gap-2 min-w-fit">
                <CreditCard class="h-4 w-4" /> Pembayaran
            </TabsTrigger>
            <TabsTrigger value="employees" class="flex gap-2 min-w-fit">
                <Users class="h-4 w-4" /> Pengguna
            </TabsTrigger>
            <TabsTrigger value="account" class="flex gap-2 min-w-fit">
                <User class="h-4 w-4" /> Akun
            </TabsTrigger>
        </TabsList>

        <div class="mt-6">
            <TabsContent value="store">
                <LegacyStoreTab {controller} />
            </TabsContent>

            <TabsContent value="receipt">
                <LegacyReceiptTab {controller} />
            </TabsContent>

            <TabsContent value="service">
                <LegacyServiceTab {controller} />
            </TabsContent>

            <TabsContent value="whatsapp">
                <LegacyWhatsappTab {controller} />
            </TabsContent>

            <TabsContent value="payment">
                <LegacyPaymentTab {controller} />
            </TabsContent>

            <TabsContent value="employees">
                <LegacyUsersTab {controller} />
            </TabsContent>

            <TabsContent value="account">
                <LegacyAccountTab {controller} />
            </TabsContent>
        </div>
    </Tabs>
</div>
