<script lang="ts">
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { toast } from "svelte-sonner";
    import {
        Plus,
        Pencil,
        Trash2,
        Smartphone,
        Search,
        Loader2,
    } from "lucide-svelte";
    import { PUBLIC_API_BASE_URL } from "$env/static/public";
    import { page } from "$app/stores";
    import { get } from "svelte/store";

    // --- State (Svelte 5 Runes) ---
    let search = $state("");
    let isDialogOpen = $state(false);
    let editingItem = $state<any>(null);
    let isDeletingString = $state<string | null>(null);

    // Form
    let formBrand = $state("");
    let formModel = $state("");
    let formCode = $state("");

    const queryClient = useQueryClient();

    // --- Query ---
    // In TanStack Query v6, we pass a function returning options to support reactivity
    const query = createQuery(() => ({
        queryKey: ["devices", search],
        queryFn: async () => {
            const url = new URL(`${PUBLIC_API_BASE_URL}/devices`);
            if (search) url.searchParams.set("search", search);
            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${get(page).data.token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch devices");
            return res.json().then((r: any) => r.data);
        },
    }));

    // --- Mutations ---
    const createMutationCmd = createMutation(() => ({
        mutationFn: async (data: any) => {
            const res = await fetch(`${PUBLIC_API_BASE_URL}/devices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${get(page).data.token}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            toast.success("Device created successfully");
            isDialogOpen = false;
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            resetForm();
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`),
    }));

    const updateMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            const res = await fetch(
                `${PUBLIC_API_BASE_URL}/devices/${editingItem.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${get(page).data.token}`,
                    },
                    body: JSON.stringify(data),
                },
            );
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            toast.success("Device updated successfully");
            isDialogOpen = false;
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            resetForm();
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`),
    }));

    const deleteMutation = createMutation(() => ({
        mutationFn: async (id: string) => {
            const res = await fetch(`${PUBLIC_API_BASE_URL}/devices/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${get(page).data.token}` },
            });
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Device deleted");
            isDeletingString = null;
            queryClient.invalidateQueries({ queryKey: ["devices"] });
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`),
    }));

    function openCreate() {
        editingItem = null;
        resetForm();
        isDialogOpen = true;
    }

    function openEdit(device: any) {
        editingItem = device;
        formBrand = device.brand;
        formModel = device.model;
        formCode = device.code || "";
        isDialogOpen = true;
    }

    function resetForm() {
        formBrand = "";
        formModel = "";
        formCode = "";
    }

    function handleSubmit() {
        if (!formBrand || !formModel) {
            toast.error("Brand and Model are required");
            return;
        }

        const payload = {
            brand: formBrand,
            model: formModel,
            code: formCode || undefined,
        };

        if (editingItem) {
            updateMutation.mutate(payload);
        } else {
            createMutationCmd.mutate(payload);
        }
    }
</script>

<div class="space-y-6 p-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Device Master</h1>
            <p class="text-muted-foreground mt-1">
                Manage supported devices for compatibility tracking.
            </p>
        </div>
        <Button onclick={openCreate}>
            <Plus class="mr-2 h-4 w-4" /> Add Device
        </Button>
    </div>

    <!-- Toolbar -->
    <div
        class="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm"
    >
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                placeholder="Search device model or code..."
                class="pl-9"
                bind:value={search}
            />
        </div>
    </div>

    <!-- Data Table -->
    <div class="rounded-md border bg-card shadow-sm">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Device Info</Table.Head>
                    <Table.Head>Machine Code</Table.Head>
                    <Table.Head>Updated</Table.Head>
                    <Table.Head class="text-right">Actions</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if query.isLoading}
                    <Table.Row>
                        <Table.Cell colspan={4} class="h-24 text-center">
                            <div class="flex justify-center items-center">
                                <Loader2
                                    class="h-6 w-6 animate-spin text-muted-foreground"
                                />
                            </div>
                        </Table.Cell>
                    </Table.Row>
                {:else if query.isError}
                    <Table.Row>
                        <Table.Cell
                            colspan={4}
                            class="h-24 text-center text-red-500"
                        >
                            Failed to load devices
                        </Table.Cell>
                    </Table.Row>
                {:else if query.data?.length === 0}
                    <Table.Row>
                        <Table.Cell
                            colspan={4}
                            class="h-24 text-center text-muted-foreground"
                        >
                            No devices found. Add one to get started.
                        </Table.Cell>
                    </Table.Row>
                {:else}
                    {#each query.data || [] as device}
                        <Table.Row>
                            <Table.Cell>
                                <div class="flex flex-col">
                                    <span class="font-medium text-base"
                                        >{device.brand} {device.model}</span
                                    >
                                    <span class="text-xs text-muted-foreground"
                                        >ID: {device.id}</span
                                    >
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                {#if device.code}
                                    <code
                                        class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                        >{device.code}</code
                                    >
                                {:else}
                                    <span
                                        class="text-muted-foreground italic text-xs"
                                        >N/A</span
                                    >
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="text-sm text-muted-foreground">
                                {new Date(
                                    device.updatedAt || device.createdAt,
                                ).toLocaleDateString()}
                            </Table.Cell>
                            <Table.Cell class="text-right">
                                <div class="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={() => openEdit(device)}
                                    >
                                        <Pencil class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        disabled={deleteMutation.isPending &&
                                            isDeletingString === device.id}
                                        onclick={() => {
                                            if (
                                                confirm(
                                                    `Delete ${device.brand} ${device.model}?`,
                                                )
                                            ) {
                                                isDeletingString = device.id;
                                                deleteMutation.mutate(
                                                    device.id,
                                                );
                                            }
                                        }}
                                    >
                                        {#if deleteMutation.isPending && isDeletingString === device.id}
                                            <Loader2
                                                class="h-4 w-4 animate-spin"
                                            />
                                        {:else}
                                            <Trash2 class="h-4 w-4" />
                                        {/if}
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {/if}
            </Table.Body>
        </Table.Root>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog.Root bind:open={isDialogOpen}>
        <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
                <Dialog.Title
                    >{editingItem
                        ? "Edit Device"
                        : "Add New Device"}</Dialog.Title
                >
                <Dialog.Description>
                    Enter the device details. The Machine Code is helpful for
                    technicians.
                </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="brand" class="text-right">Brand</Label>
                    <Input
                        id="brand"
                        bind:value={formBrand}
                        placeholder="e.g. Samsung"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="model" class="text-right">Model</Label>
                    <Input
                        id="model"
                        bind:value={formModel}
                        placeholder="e.g. Galaxy S25 Ultra"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="code" class="text-right">Code</Label>
                    <Input
                        id="code"
                        bind:value={formCode}
                        placeholder="e.g. SM-S928B"
                        class="col-span-3"
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button variant="outline" onclick={() => (isDialogOpen = false)}
                    >Cancel</Button
                >
                <Button
                    onclick={handleSubmit}
                    disabled={createMutationCmd.isPending ||
                        updateMutation.isPending}
                >
                    {#if createMutationCmd.isPending || updateMutation.isPending}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    {editingItem ? "Save Changes" : "Create Device"}
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
