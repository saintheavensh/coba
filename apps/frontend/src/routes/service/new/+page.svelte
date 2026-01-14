<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "svelte-sonner";
    import {
        ArrowLeft,
        ArrowRight,
        CheckCircle,
        User,
        Smartphone,
        Wrench,
        Clock, // Replaced CheckCircle for Walk-in icon to differentiate
        Loader2, // Loading spinner
    } from "lucide-svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { ServiceService } from "$lib/services/service.service";

    // Logic & State
    import { ServiceFormStore } from "./form.svelte";

    // Steps
    import Step1Customer from "./steps/Step1Customer.svelte";
    import Step2Device from "./steps/Step2Device.svelte";
    import Step3Service from "./steps/Step3Service.svelte";
    import Step35QC from "./steps/Step35QC.svelte";
    import Step4Review from "./steps/Step4Review.svelte";
    import { fade, slide } from "svelte/transition";
    import { ClipboardCheck } from "lucide-svelte";

    // Initialize Store
    const form = new ServiceFormStore();

    // Queries
    const techniciansQuery = createQuery(() => ({
        queryKey: ["users", "technicians"],
        queryFn: async () => {
            const res = await api.get("/auth/users?role=teknisi");
            return res.data?.data || [];
        },
    }));

    const inventoryQuery = createQuery(() => ({
        queryKey: ["inventory"],
        queryFn: async () => {
            const res = await api.get("/inventory");
            return res.data?.data || [];
        },
    }));

    const servicesQuery = createQuery(() => ({
        queryKey: ["services", "calendar"],
        queryFn: () => ServiceService.getAll(),
    }));

    const paymentMethodsQuery = createQuery(() => ({
        queryKey: ["payment-methods"],
        queryFn: async () => {
            const res = await api.get("/payment-methods");
            return res.data?.data || [];
        },
    }));

    let technicians = $derived(techniciansQuery.data || []);
    let inventoryItems = $derived(inventoryQuery.data || []);
    let services = $derived((servicesQuery.data || []) as any[]);
    let paymentMethods = $derived((paymentMethodsQuery.data || []) as any[]);

    // Steps for regular service (4 steps)
    const regularSteps = [
        { step: 1, label: "Customer", icon: User, desc: "Data diri pelanggan" },
        {
            step: 2,
            label: "Perangkat",
            icon: Smartphone,
            desc: "Detail handphone",
        },
        { step: 3, label: "Service", icon: Wrench, desc: "Keluhan & Biaya" },
        {
            step: 4,
            label: "Konfirmasi",
            icon: CheckCircle,
            desc: "Review data",
        },
    ];

    // Steps for walk-in service (5 steps with QC)
    const walkinSteps = [
        { step: 1, label: "Customer", icon: User, desc: "Data diri pelanggan" },
        {
            step: 2,
            label: "Perangkat",
            icon: Smartphone,
            desc: "Detail handphone",
        },
        { step: 3, label: "Service", icon: Wrench, desc: "Perbaikan & Biaya" },
        { step: 4, label: "QC", icon: ClipboardCheck, desc: "Quality Control" },
        {
            step: 5,
            label: "Konfirmasi",
            icon: CheckCircle,
            desc: "Review & Bayar",
        },
    ];

    // Use appropriate steps based on service type
    let steps = $derived(form.isWalkin ? walkinSteps : regularSteps);
    let totalSteps = $derived(form.isWalkin ? 5 : 4);
</script>

<div
    class="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500"
>
    <!-- Mobile Header (Visible only on small screens) -->
    <div class="lg:hidden mb-6 space-y-4">
        <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" href="/service">
                <ArrowLeft class="h-5 w-5" />
            </Button>
            <div>
                <h1 class="text-xl font-bold">Service Baru</h1>
                <p class="text-sm text-muted-foreground">
                    Step {form.currentStep} dari 4
                </p>
            </div>
        </div>
        <!-- Mobile Progress Bar -->
        <div class="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
                class="h-full bg-primary transition-all duration-300"
                style="width: {(form.currentStep / totalSteps) * 100}%"
            ></div>
        </div>
    </div>

    <div
        class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 bg-card rounded-3xl shadow-sm border p-6 min-h-[800px]"
    >
        <!-- Sidebar (Desktop Navigation) -->
        <aside class="hidden lg:flex flex-col gap-8 border-r pr-6 h-full">
            <div class="space-y-6">
                <Button
                    variant="ghost"
                    href="/service"
                    class="-ml-4 justify-start text-muted-foreground hover:text-foreground group"
                >
                    <ArrowLeft
                        class="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"
                    />
                    Kembali ke Daftar
                </Button>
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Service Baru
                    </h1>
                    <p class="text-muted-foreground mt-2">
                        Buat tiket service baru untuk pelanggan.
                    </p>
                </div>
            </div>

            <Separator />

            <!-- Service Type Selector -->
            <div class="space-y-3">
                <h3
                    class="font-semibold text-sm uppercase tracking-wider text-muted-foreground"
                >
                    Tipe Layanan
                </h3>
                <div class="grid gap-2">
                    <button
                        onclick={() => (form.isWalkin = false)}
                        class={`
                            flex items-center gap-3 p-3 rounded-xl transition-all border-2 text-left
                            ${!form.isWalkin ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:bg-muted"}
                        `}
                    >
                        <div
                            class={`p-2 rounded-full ${!form.isWalkin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                            <Clock class="h-4 w-4" />
                        </div>
                        <div>
                            <span class="font-medium block text-sm"
                                >Regular Service</span
                            >
                            <span class="text-xs text-muted-foreground"
                                >Ditinggal (Antrian)</span
                            >
                        </div>
                    </button>

                    <button
                        onclick={() => (form.isWalkin = true)}
                        class={`
                            flex items-center gap-3 p-3 rounded-xl transition-all border-2 text-left
                            ${form.isWalkin ? "border-green-500 bg-green-50 shadow-sm" : "border-transparent hover:bg-muted"}
                        `}
                    >
                        <div
                            class={`p-2 rounded-full ${form.isWalkin ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
                        >
                            <CheckCircle class="h-4 w-4" />
                        </div>
                        <div>
                            <span class="font-medium block text-sm"
                                >Walk-in Service</span
                            >
                            <span class="text-xs text-muted-foreground"
                                >Ditunggu (Langsung)</span
                            >
                        </div>
                    </button>
                </div>
            </div>

            <Separator />

            <!-- Vertical Stepper -->
            <nav class="space-y-1">
                {#each steps as item}
                    {@const isActive = form.currentStep === item.step}
                    {@const isCompleted = form.currentStep > item.step}
                    <div class="relative pl-4 pb-8 last:pb-0">
                        <!-- Connecting Line -->
                        {#if item.step !== 4}
                            <div
                                class={`absolute left-[27px] top-8 bottom-0 w-[2px] ${isCompleted ? "bg-primary" : "bg-muted"}`}
                            ></div>
                        {/if}

                        <div class="flex items-start gap-4">
                            <!-- Indicator -->
                            <div
                                class={`
                                relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300
                                ${isActive ? "border-primary bg-background ring-4 ring-primary/20" : isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"}
                            `}
                            >
                                {#if isCompleted}
                                    <CheckCircle class="h-4 w-4" />
                                {:else}
                                    <span class="text-xs font-bold"
                                        >{item.step}</span
                                    >
                                {/if}
                            </div>

                            <!-- Label -->
                            <div
                                class={`transition-opacity duration-300 ${!isActive && !isCompleted ? "opacity-50" : "opacity-100"}`}
                            >
                                <p class="text-sm font-semibold leading-none">
                                    {item.label}
                                </p>
                                <p class="text-xs text-muted-foreground mt-1">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                {/each}
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex flex-col h-full justify-between gap-6 relative">
            <div class="flex-1 min-h-[500px]">
                <!-- Step Content -->
                {#key form.currentStep}
                    <div
                        in:fade={{ duration: 300, delay: 150 }}
                        out:fade={{ duration: 150 }}
                    >
                        {#if form.currentStep === 1}
                            <Step1Customer {form} />
                        {:else if form.currentStep === 2}
                            <Step2Device {form} />
                        {:else if form.currentStep === 3}
                            <Step3Service
                                {form}
                                {technicians}
                                {inventoryItems}
                                {services}
                            />
                        {:else if form.currentStep === 4 && form.isWalkin}
                            <Step35QC {form} />
                        {:else if (form.currentStep === 4 && !form.isWalkin) || (form.currentStep === 5 && form.isWalkin)}
                            <Step4Review
                                {form}
                                {technicians}
                                {paymentMethods}
                            />
                        {/if}
                    </div>
                {/key}
            </div>

            <!-- Floating / Sticky Footer Action Bar -->
            <div
                class="sticky bottom-0 bg-background/80 backdrop-blur-md border-t -mx-6 -mb-6 p-6 flex items-center justify-between rounded-b-3xl mt-auto z-40"
            >
                <Button
                    variant="ghost"
                    onclick={form.prevStep.bind(form)}
                    disabled={form.currentStep === 1}
                    class={form.currentStep === 1 ? "opacity-0" : ""}
                >
                    <ArrowLeft class="h-4 w-4 mr-2" />
                    Sebelumnya
                </Button>

                <div class="flex items-center gap-2">
                    {#if form.currentStep < totalSteps}
                        <Button
                            onclick={form.nextStep.bind(form)}
                            size="lg"
                            class="px-8 rounded-full shadow-lg shadow-primary/20"
                        >
                            Selanjutnya
                            <ArrowRight class="h-4 w-4 ml-2" />
                        </Button>
                    {:else}
                        <Button
                            onclick={form.handleSubmit.bind(form)}
                            disabled={form.isSubmitting}
                            size="lg"
                            class="px-8 rounded-full shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
                        >
                            {#if form.isSubmitting}
                                <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                                Menyimpan...
                            {:else}
                                <CheckCircle class="h-4 w-4 mr-2" />
                                {form.isWalkin
                                    ? "Simpan & Selesai"
                                    : "Buat Service"}
                            {/if}
                        </Button>
                    {/if}
                </div>
            </div>
        </main>
    </div>
</div>
