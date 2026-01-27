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
        Clock,
        Loader2,
        Plus, // Added
    } from "lucide-svelte";
    import { goto } from "$app/navigation"; // Added
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/api";
    import { ServiceService } from "$lib/services/service.service";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import { Printer, FileText } from "lucide-svelte";
    import ServiceNotePrint from "../components/service-note-print.svelte";

    // Logic & State
    import { ServiceFormStore } from "./form.svelte";

    // Steps
    import Step1Customer from "./steps/Step1Customer.svelte";
    import Step2Device from "./steps/Step2Device.svelte";
    import Step3Service from "./steps/Step3Service.svelte";
    import Step35QC from "./steps/Step35QC.svelte";
    import Step4Review from "./steps/Step4Review.svelte"; // Wait, I created Step5Review
    import Step5Review from "./steps/Step5Review.svelte";
    import { fade, slide } from "svelte/transition";
    import { ClipboardCheck, FileCheck } from "lucide-svelte";
    import { cn } from "$lib/utils";

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

    // Unified Steps for Intake
    const steps = [
        { step: 1, label: "Customer", icon: User, desc: "Data Pelanggan" },
        {
            step: 2,
            label: "Unit",
            icon: Smartphone,
            desc: "Fisik & Kelengkapan",
        },
        {
            step: 3,
            label: "Checklist",
            icon: ClipboardCheck,
            desc: "Fungsi Awal (QC)",
        },
        { step: 4, label: "Keluhan", icon: Wrench, desc: "Detail Masalah" },
        {
            step: 5,
            label: "Konfirmasi",
            icon: FileCheck,
            desc: "Review & Simpan",
        },
    ];

    let totalSteps = 5;

    // Skip QC step if unit is dead - LOGIC MOVED TO form.nextStep/prevStep to avoid navigation loop
    // $effect(() => {
    //    if (form.isDead && form.currentStep === 3) {
    //        form.currentStep = 4;
    //    }
    // });

    let showPrintSuccessModal = $state(false);
    let createdServiceId = $state<number | string | null>(null);
    let showPrintPreview = $state(false);
    let printMode = $state<"receipt" | "sticker">("receipt");

    function openPrintPreview(mode: "receipt" | "sticker") {
        printMode = mode;
        showPrintPreview = true;
    }

    function closeAllAndRedirect() {
        showPrintSuccessModal = false;
        goto("/service");
    }
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
        class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 bg-card/60 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-white/20 p-6 sm:p-8 min-h-[850px] backdrop-blur-3xl relative overflow-hidden"
    >
        <!-- Background Decor -->
        <div
            class="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        ></div>
        <div
            class="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
        ></div>
        <!-- Sidebar (Desktop Navigation) -->
        <aside
            class="hidden lg:flex flex-col gap-8 h-full pr-8 border-r border-border/40"
        >
            <div class="space-y-6">
                <Button
                    variant="ghost"
                    href="/service"
                    class="-ml-4 justify-start text-muted-foreground hover:text-foreground group rounded-xl"
                >
                    <ArrowLeft
                        class="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"
                    />
                    Kembali ke Daftar
                </Button>
                <div>
                    <h1
                        class="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                    >
                        Service Baru
                    </h1>
                    <p
                        class="text-sm text-muted-foreground mt-2 leading-relaxed"
                    >
                        Buat tiket service baru untuk pelanggan dengan mudah.
                    </p>
                </div>
            </div>

            <Separator class="bg-border/50" />

            <!-- Service Type Selector -->
            <div class="space-y-4">
                <p
                    class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1"
                >
                    Mode Layanan
                </p>
                <div
                    class="grid grid-cols-2 gap-3 p-1 bg-muted/40 rounded-2xl border border-border/50"
                >
                    <button
                        class={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]",
                            form.priority === "standard"
                                ? "bg-background shadow-sm border-primary/20 text-primary ring-1 ring-primary/10"
                                : "border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground",
                        )}
                        onclick={() => {
                            form.priority = "standard";
                            form.isDirectComplete = false;
                            form.isWalkin = false;
                        }}
                    >
                        <Clock class="h-5 w-5 mb-2" />
                        <span class="text-[10px] font-bold">DITINGGAL</span>
                    </button>
                    <button
                        class={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]",
                            form.priority === "wait"
                                ? "bg-background shadow-sm border-primary/20 text-primary ring-1 ring-primary/10"
                                : "border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground",
                        )}
                        onclick={() => {
                            form.priority = "wait";
                            form.isDirectComplete = true;
                            form.isWalkin = true;
                        }}
                    >
                        <User class="h-5 w-5 mb-2" />
                        <span class="text-[10px] font-bold">DITUNGGU</span>
                    </button>
                </div>
                {#if form.priority === "wait"}
                    <div
                        class="px-2 pt-1 animate-in slide-in-from-top-2 duration-300"
                    >
                        <label
                            class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <input
                                type="checkbox"
                                bind:checked={form.isDirectComplete}
                                class="w-4 h-4 rounded border-muted text-primary focus:ring-primary accent-primary"
                            />
                            <span
                                class="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors"
                                >Langsung Selesai & Bayar</span
                            >
                        </label>
                    </div>
                {/if}
            </div>

            <Separator class="bg-border/50" />

            <!-- Vertical Stepper -->
            <nav class="space-y-0 relative">
                {#each steps as item}
                    {@const isActive = form.currentStep === item.step}
                    {@const isCompleted = form.currentStep > item.step}
                    <div class="relative pl-6 pb-10 last:pb-0 group">
                        <!-- Connecting Line -->
                        {#if item.step !== 5}
                            <div
                                class={cn(
                                    "absolute left-[35px] top-10 bottom-0 w-[2px] transition-colors duration-500",
                                    isCompleted
                                        ? "bg-primary"
                                        : "bg-muted/50 group-hover:bg-muted",
                                )}
                            ></div>
                        {/if}

                        <div class="flex items-start gap-4 cursor-default">
                            <!-- Indicator -->
                            <div
                                class={cn(
                                    "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500 shadow-sm",
                                    isActive
                                        ? "border-primary bg-background ring-4 ring-primary/10 scale-110"
                                        : isCompleted
                                          ? "border-primary bg-primary text-primary-foreground scale-100"
                                          : "border-muted/50 bg-muted/20 text-muted-foreground/50",
                                )}
                            >
                                {#if isCompleted}
                                    <CheckCircle
                                        class="h-4 w-4 animate-in zoom-in duration-300"
                                    />
                                {:else}
                                    <span class="text-xs font-bold font-mono"
                                        >{item.step}</span
                                    >
                                {/if}
                            </div>

                            <!-- Label -->
                            <div
                                class={cn(
                                    "transition-all duration-300 pt-1",
                                    isActive
                                        ? "opacity-100 translate-x-1"
                                        : isCompleted
                                          ? "opacity-80"
                                          : "opacity-40",
                                )}
                            >
                                <p
                                    class={cn(
                                        "text-sm font-bold leading-none",
                                        isActive
                                            ? "text-primary"
                                            : "text-foreground",
                                    )}
                                >
                                    {item.label}
                                </p>
                                <p
                                    class="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wide"
                                >
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
                            <!-- QC Step (Using Step35QC component but mapped to step 3) -->
                            <Step35QC {form} />
                        {:else if form.currentStep === 4}
                            <!-- Complaint Step (Using Step3Service component but needs adaptation or Refactor) -->
                            <!-- Note: Step3Service currently has Cost Estimate etc. We should check if we can reuse or need new component -->
                            <Step3Service
                                {form}
                                {technicians}
                                {inventoryItems}
                                {services}
                            />
                        {:else if form.currentStep === 5}
                            <Step5Review {form} />
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
                            onclick={() => {
                                if (form.currentStep === 2 && form.isDead) {
                                    form.currentStep = 4; // Skip QC
                                } else {
                                    form.nextStep();
                                }
                            }}
                            size="lg"
                            class="px-8 rounded-full shadow-lg shadow-primary/20"
                        >
                            Selanjutnya
                            <ArrowRight class="h-4 w-4 ml-2" />
                        </Button>
                    {:else}
                        <!-- Finish Buttons -->
                        <div class="flex gap-2">
                            <Button
                                onclick={async () => {
                                    const res = await form.handleSubmit();
                                    if (res?.success) form.resetForNextUnit();
                                }}
                                disabled={form.isSubmitting}
                                size="lg"
                                variant="outline"
                                class="px-6 rounded-full border-green-600 text-green-600 hover:bg-green-50"
                            >
                                <Plus class="h-4 w-4 mr-2" />
                                Simpan & Tambah Unit
                            </Button>

                            <Button
                                onclick={async () => {
                                    const res = await form.handleSubmit();
                                    if (res?.success) {
                                        // goto("/service");
                                        // New logic: Check if we have ID to print
                                        if (res.serviceId) {
                                            createdServiceId = res.serviceId;
                                            showPrintSuccessModal = true;
                                        } else {
                                            goto("/service");
                                        }
                                    }
                                }}
                                disabled={form.isSubmitting}
                                size="lg"
                                class="px-8 rounded-full shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
                            >
                                {#if form.isSubmitting}
                                    <Loader2
                                        class="h-4 w-4 mr-2 animate-spin"
                                    />
                                    Menyimpan...
                                {:else}
                                    <CheckCircle class="h-4 w-4 mr-2" />
                                    Simpan & Selesai
                                {/if}
                            </Button>
                        </div>
                    {/if}
                </div>
            </div>
        </main>
    </div>

    <!-- Print Success Modal -->
    <Dialog open={showPrintSuccessModal} onOpenChange={closeAllAndRedirect}>
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Service Berhasil Dibuat!</DialogTitle>
                <DialogDescription>
                    Apakah Anda ingin mencetak dokumen untuk service ini?
                </DialogDescription>
            </DialogHeader>
            <div class="grid grid-cols-2 gap-4 py-4">
                <Button
                    variant="outline"
                    class="h-auto py-4 flex flex-col gap-2"
                    onclick={() => openPrintPreview("sticker")}
                >
                    <Printer class="h-8 w-8 text-primary" />
                    <span class="font-semibold">Cetak Label Unit</span>
                    <span class="text-xs text-muted-foreground text-center"
                        >Stiker Tempel</span
                    >
                </Button>
                <Button
                    variant="outline"
                    class="h-auto py-4 flex flex-col gap-2"
                    onclick={() => openPrintPreview("receipt")}
                >
                    <FileText class="h-8 w-8 text-primary" />
                    <span class="font-semibold">Cetak Nota</span>
                    <span class="text-xs text-muted-foreground text-center"
                        >Struk Customer</span
                    >
                </Button>
            </div>
            <DialogFooter class="sm:justify-between">
                <Button variant="ghost" onclick={closeAllAndRedirect}
                    >Tutup & Ke Daftar</Button
                >
                <Button variant="default" onclick={() => goto("/service")}
                    >Ke Detail Service</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {#if createdServiceId}
        <ServiceNotePrint
            bind:open={showPrintPreview}
            serviceId={createdServiceId}
            serviceOrder={{
                no: "LOADING...",
                dateIn: new Date(),
                customer: { name: form.customerName },
                phone: { brand: form.phoneBrand, model: form.phoneModel },
            }}
            mode={printMode}
            onClose={() => {
                showPrintPreview = false;
            }}
        />
        <!-- Note: We mock serviceOrder partially because create API returns ID but we have form data here. 
             If ServiceNotePrint fetches by ID internally, that's better. 
             Currently ServiceNotePrint accepts `serviceOrder` prop.
             We can pass the form data as a temporary object so it renders immediately. 
        -->
    {/if}
</div>
