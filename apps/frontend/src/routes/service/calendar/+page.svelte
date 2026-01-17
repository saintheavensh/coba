<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/components/ui/select";
    import {
        ChevronLeft,
        ChevronRight,
        Calendar as CalendarIcon,
        List,
        Filter,
        GripVertical,
    } from "lucide-svelte";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { ServiceService } from "$lib/services/service.service";
    import { toast } from "svelte-sonner";

    // Types
    interface CalendarService {
        id: number;
        no: string;
        customer: { name: string; phone: string };
        device: { brand: string; model: string };
        status: string;
        technicianId: string | null;
        technicianName?: string;
        estimatedCompletionDate: string | null;
        dateIn: string;
    }

    // State
    let viewMode = $state<"week" | "month">("week");
    let currentDate = $state(new Date());
    let selectedTechnician = $state<string>("all");
    let selectedStatus = $state<string>("all");
    let draggedService = $state<CalendarService | null>(null);

    const queryClient = useQueryClient();

    // Get current user role from localStorage
    let userRole = $state<string>("admin");
    let userId = $state<string>("");

    $effect(() => {
        if (typeof window !== "undefined") {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            userRole = user.role || "admin";
            userId = user.id || "";
        }
    });

    // Fetch services
    const servicesQuery = createQuery(() => ({
        queryKey: ["services", "calendar"],
        queryFn: () => ServiceService.getAll(),
    }));

    // Reschedule mutation
    const rescheduleMutation = createMutation(() => ({
        mutationFn: async ({ id, date }: { id: number; date: Date }) => {
            return await ServiceService.update(id, {
                estimatedCompletionDate: date.toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            toast.success("Service rescheduled successfully");
        },
        onError: () => {
            toast.error("Failed to reschedule service");
        },
    }));

    // Filter services based on role and filters
    let filteredServices = $derived(() => {
        let services = (servicesQuery.data ||
            []) as unknown as CalendarService[];

        // Role-based filtering: technician only sees their own services
        if (userRole === "teknisi" && userId) {
            services = services.filter((s) => s.technicianId === userId);
        }

        // Apply technician filter
        if (selectedTechnician !== "all") {
            services = services.filter(
                (s) => s.technicianId === selectedTechnician,
            );
        }

        // Apply status filter
        if (selectedStatus !== "all") {
            services = services.filter((s) => s.status === selectedStatus);
        } else {
            // Default: Hide non-working statuses
            // User requested to hide: selesai, diambil, batal, antrian, konfirmasi
            // Remaining: dicek, dikerjakan, re-konfirmasi
            services = services.filter(
                (s) =>
                    ![
                        "selesai",
                        "diambil",
                        "batal",
                        "antrian",
                        "konfirmasi",
                    ].includes(s.status),
            );
        }

        return services;
    });

    // Scheduled services (has estimatedCompletionDate)
    let scheduledServices = $derived(
        filteredServices().filter((s) => s.estimatedCompletionDate),
    );

    // Backlog services (no estimatedCompletionDate)
    let backlogServices = $derived(
        filteredServices().filter((s) => !s.estimatedCompletionDate),
    );

    // Get unique technicians for filter
    let technicians = $derived(() => {
        const services = (servicesQuery.data ||
            []) as unknown as CalendarService[];
        const techMap = new Map<string, string>();
        services.forEach((s) => {
            if (s.technicianId && s.technicianName) {
                techMap.set(s.technicianId, s.technicianName);
            }
        });
        return Array.from(techMap.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    });

    // Calendar helpers
    function getWeekDays(date: Date): Date[] {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function getMonthDays(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];

        // Add days from previous month to fill week
        const startDay = firstDay.getDay() || 7;
        for (let i = startDay - 1; i > 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i);
            days.push(d);
        }

        // Add all days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // Add days from next month to complete grid
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push(d);
        }

        return days;
    }

    let calendarDays = $derived(
        viewMode === "week"
            ? getWeekDays(currentDate)
            : getMonthDays(currentDate),
    );

    function getServicesForDate(date: Date): CalendarService[] {
        return scheduledServices.filter((s) => {
            if (!s.estimatedCompletionDate) return false;
            const sDate = new Date(s.estimatedCompletionDate);
            return sDate.toDateString() === date.toDateString();
        });
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
        });
    }

    function formatMonth(date: Date): string {
        return date.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
        });
    }

    function isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    function isCurrentMonth(date: Date): boolean {
        return date.getMonth() === currentDate.getMonth();
    }

    function isPastDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    function navigate(direction: number) {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() + direction * 7);
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        currentDate = newDate;
    }

    function goToToday() {
        currentDate = new Date();
    }

    // Drag and drop handlers
    function handleDragStart(e: DragEvent, service: CalendarService) {
        draggedService = service;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(service.id));
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "move";
        }
    }

    function handleDrop(e: DragEvent, date: Date) {
        e.preventDefault();
        if (draggedService) {
            // Validate not a past date
            if (isPastDate(date)) {
                toast.error(
                    "Tidak dapat menjadwalkan service pada tanggal yang sudah lewat",
                );
                draggedService = null;
                return;
            }
            // Validate technician is assigned
            if (!draggedService.technicianId) {
                toast.error(
                    "Teknisi harus ditugaskan terlebih dahulu sebelum menjadwalkan service",
                );
                draggedService = null;
                return;
            }
            rescheduleMutation.mutate({ id: draggedService.id, date });
            draggedService = null;
        }
    }

    function getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            antrian: "bg-gray-100 text-gray-700",
            dicek: "bg-blue-100 text-blue-700",
            konfirmasi: "bg-yellow-100 text-yellow-700",
            dikerjakan: "bg-purple-100 text-purple-700",
            selesai: "bg-green-100 text-green-700",
            diambil: "bg-emerald-100 text-emerald-700",
            batal: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            antrian: "Antrian",
            dicek: "Dicek",
            konfirmasi: "Konfirmasi",
            dikerjakan: "Dikerjakan",
            selesai: "Selesai",
            diambil: "Diambil",
            batal: "Batal",
        };
        return labels[status] || status;
    }
</script>

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold tracking-tight">
                📅 Kalender Service
            </h3>
            <p class="text-sm text-muted-foreground">
                Jadwal dan kelola service dengan drag-and-drop
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onclick={goToToday}>
                Hari Ini
            </Button>
            <div class="flex items-center border rounded-lg">
                <Button
                    variant={viewMode === "week" ? "secondary" : "ghost"}
                    size="sm"
                    onclick={() => (viewMode = "week")}
                    class="rounded-r-none"
                >
                    <List class="h-4 w-4 mr-1" />
                    Minggu
                </Button>
                <Button
                    variant={viewMode === "month" ? "secondary" : "ghost"}
                    size="sm"
                    onclick={() => (viewMode = "month")}
                    class="rounded-l-none"
                >
                    <CalendarIcon class="h-4 w-4 mr-1" />
                    Bulan
                </Button>
            </div>
        </div>
    </div>
    <Separator />

    <div class="flex gap-4">
        <!-- Backlog Panel -->
        <Card class="w-64 shrink-0">
            <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium flex items-center gap-2">
                    📋 Belum Dijadwal
                    <Badge variant="secondary">{backlogServices.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent
                class="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto"
            >
                {#each backlogServices as service}
                    <div
                        role="listitem"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, service)}
                        class={`p-2 bg-muted rounded-lg cursor-grab active:cursor-grabbing border transition-colors ${service.technicianId ? "border-transparent hover:border-primary/50" : "border-dashed border-yellow-400"}`}
                    >
                        <div class="flex items-start gap-2">
                            <GripVertical
                                class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"
                            />
                            <div class="flex-1 min-w-0">
                                <div
                                    class="font-medium text-xs text-primary truncate"
                                >
                                    {service.no}
                                </div>
                                <div class="text-xs truncate">
                                    {service.customer.name}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground truncate"
                                >
                                    {service.device.brand}
                                    {service.device.model}
                                </div>
                                <Badge
                                    class={`mt-1 text-[10px] ${getStatusColor(service.status)}`}
                                >
                                    {getStatusLabel(service.status)}
                                </Badge>
                                {#if !service.technicianId}
                                    <div
                                        class="text-[10px] text-yellow-600 mt-1"
                                    >
                                        ⚠️ Belum ada teknisi
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
                {#if backlogServices.length === 0}
                    <p class="text-xs text-muted-foreground text-center py-4">
                        Tidak ada service menunggu jadwal
                    </p>
                {/if}
            </CardContent>
        </Card>

        <!-- Calendar -->
        <Card class="flex-1">
            <CardHeader class="pb-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onclick={() => navigate(-1)}
                        >
                            <ChevronLeft class="h-4 w-4" />
                        </Button>
                        <h4 class="font-semibold text-lg min-w-48 text-center">
                            {formatMonth(currentDate)}
                        </h4>
                        <Button
                            variant="ghost"
                            size="icon"
                            onclick={() => navigate(1)}
                        >
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </div>

                    <!-- Filters (Admin only) -->
                    {#if userRole === "admin"}
                        <div class="flex items-center gap-2">
                            <Filter class="h-4 w-4 text-muted-foreground" />
                            <Select
                                type="single"
                                bind:value={selectedTechnician}
                            >
                                <SelectTrigger class="w-40 h-8">
                                    <span
                                        >{selectedTechnician === "all"
                                            ? "Semua Teknisi"
                                            : technicians().find(
                                                  (t) =>
                                                      t.id ===
                                                      selectedTechnician,
                                              )?.name || "Teknisi"}</span
                                    >
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all"
                                        >Semua Teknisi</SelectItem
                                    >
                                    {#each technicians() as tech}
                                        <SelectItem value={tech.id}
                                            >{tech.name}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                            <Select type="single" bind:value={selectedStatus}>
                                <SelectTrigger class="w-32 h-8">
                                    <span
                                        >{selectedStatus === "all"
                                            ? "Semua Status"
                                            : getStatusLabel(
                                                  selectedStatus,
                                              )}</span
                                    >
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all"
                                        >Semua Status</SelectItem
                                    >
                                    <SelectItem value="antrian"
                                        >Antrian</SelectItem
                                    >
                                    <SelectItem value="dicek">Dicek</SelectItem>
                                    <SelectItem value="konfirmasi"
                                        >Konfirmasi</SelectItem
                                    >
                                    <SelectItem value="dikerjakan"
                                        >Dikerjakan</SelectItem
                                    >
                                    <SelectItem value="selesai"
                                        >Selesai</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </div>
                    {/if}
                </div>
            </CardHeader>
            <CardContent>
                <!-- Calendar Grid -->
                <div
                    class={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} gap-1`}
                >
                    <!-- Header -->
                    {#each ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as day}
                        <div
                            class="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    {/each}

                    <!-- Days -->
                    {#each calendarDays as day}
                        <div
                            role="gridcell"
                            tabindex="0"
                            ondragover={!isPastDate(day)
                                ? handleDragOver
                                : undefined}
                            ondrop={!isPastDate(day)
                                ? (e) => handleDrop(e, day)
                                : undefined}
                            class={`
                                min-h-24 p-1 rounded-lg border transition-colors
                                ${isToday(day) ? "bg-blue-50 border-blue-200" : "bg-background border-border"}
                                ${!isCurrentMonth(day) && viewMode === "month" ? "opacity-50" : ""}
                                ${isPastDate(day) ? "bg-muted/50 cursor-not-allowed" : ""}
                                ${draggedService && !isPastDate(day) ? "hover:bg-primary/5 hover:border-primary" : ""}
                            `}
                        >
                            <div
                                class={`text-xs font-medium mb-1 ${isToday(day) ? "text-blue-600" : ""} ${isPastDate(day) ? "text-muted-foreground" : ""}`}
                            >
                                {day.getDate()}
                            </div>
                            <div class="space-y-1">
                                {#each getServicesForDate(day).slice(0, viewMode === "week" ? 5 : 2) as service}
                                    <a
                                        href={`/service/${service.id}`}
                                        draggable="true"
                                        ondragstart={(e) =>
                                            handleDragStart(e, service)}
                                        class={`block p-1 rounded text-[10px] cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-primary ${getStatusColor(service.status)}`}
                                    >
                                        <div class="font-medium truncate">
                                            {service.no}
                                        </div>
                                        <div class="truncate opacity-75">
                                            {service.customer.name}
                                        </div>
                                    </a>
                                {/each}
                                {#if getServicesForDate(day).length > (viewMode === "week" ? 5 : 2)}
                                    <div
                                        class="text-[10px] text-muted-foreground text-center"
                                    >
                                        +{getServicesForDate(day).length -
                                            (viewMode === "week" ? 5 : 2)} lagi
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    </div>
</div>
