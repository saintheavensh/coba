<script lang="ts">
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Check, ChevronsUpDown, Plus } from "lucide-svelte";
    import { cn } from "$lib/utils";

    let {
        value = $bindable(""),
        options = [],
        items = [],
        placeholder = "Pilih Varian...",
        allowCreate = true,
        disabled = false,
        onSelect,
    } = $props<{
        value: string;
        options?: string[];
        items?: { value: string; label: string }[];
        placeholder?: string;
        allowCreate?: boolean;
        disabled?: boolean;
        onSelect?: (value: string) => void;
    }>();

    let open = $state(false);
    let searchTerm = $state("");

    // Normalize everything to { value, label }
    let normalizedItems = $derived.by(() => {
        if (items && items.length > 0) {
            return items;
        }
        if (options && options.length > 0) {
            return options.map((opt: string) => ({ value: opt, label: opt }));
        }
        return [];
    });

    // Filter based on label
    let filteredItems = $derived(
        normalizedItems.filter((item: { value: string; label: string }) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    let selectedLabel = $derived(
        normalizedItems.find(
            (i: { value: string; label: string }) => i.value === value,
        )?.label || value,
    );

    function handleSelect(currentValue: string) {
        value = currentValue;
        open = false;
        if (onSelect) {
            onSelect(currentValue);
        }
    }

    function handleCreate() {
        if (searchTerm.trim()) {
            value = searchTerm.trim();
            open = false;
        }
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger
        class={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between",
            disabled && "opacity-50 cursor-not-allowed",
        )}
        role="combobox"
        {disabled}
    >
        <span class="truncate">
            {value ? selectedLabel : placeholder}
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Popover.Trigger>
    <Popover.Content class="w-[200px] p-0" align="start">
        <Command.Root>
            <Command.Input placeholder="Cari..." bind:value={searchTerm} />
            <Command.List>
                <Command.Empty class="py-2 px-4 text-sm">
                    {#if allowCreate && searchTerm}
                        <div class="flex flex-col gap-2">
                            <span class="text-muted-foreground"
                                >Tidak ditemukan.</span
                            >
                            <Button
                                variant="secondary"
                                size="sm"
                                class="w-full justify-start h-auto py-1"
                                onclick={handleCreate}
                            >
                                <Plus class="mr-2 h-3 w-3" />
                                Buat "{searchTerm}"
                            </Button>
                        </div>
                    {:else}
                        Tidak ditemukan.
                    {/if}
                </Command.Empty>
                <Command.Group>
                    {#each filteredItems as item}
                        <Command.Item
                            value={item.label}
                            onSelect={() => handleSelect(item.value)}
                        >
                            <Check
                                class={cn(
                                    "mr-2 h-4 w-4",
                                    value === item.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                )}
                            />
                            {item.label}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
