<script lang="ts">
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import { Check, ChevronsUpDown } from "lucide-svelte";
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";

    let {
        items = [],
        value = $bindable(),
        placeholder = "Select item...",
        searchPlaceholder = "Search...",
        emptyText = "No item found.",
        labelKey = "label",
        valueKey = "value",
        filterKey = undefined,
        onSelect,
        itemSnippet,
    } = $props<{
        items: any[];
        value?: any;
        placeholder?: string;
        searchPlaceholder?: string;
        emptyText?: string;
        labelKey?: string | ((item: any) => string);
        valueKey?: string | ((item: any) => string);
        filterKey?: string | ((item: any) => string); // Optional custom filter string
        onSelect?: (item: any) => void;
        itemSnippet?: import("svelte").Snippet<[any]>;
    }>();

    let open = $state(false);

    function getLabel(item: any) {
        if (typeof labelKey === "function") return labelKey(item);
        return item[labelKey];
    }

    function getValue(item: any) {
        if (typeof valueKey === "function") return valueKey(item);
        return item[valueKey];
    }

    // String used for filtering by Command component
    function getFilterValue(item: any) {
        if (filterKey) {
            if (typeof filterKey === "function") return filterKey(item);
            return item[filterKey];
        }
        return getLabel(item);
    }

    // Derived Label for Button display
    let selectedLabel = $derived.by(() => {
        const found = items.find((i) => getValue(i) === value);
        return found ? getLabel(found) : placeholder;
    });

    function handleSelect(item: any) {
        // If we bind value, we update it.
        const val = getValue(item);
        // Toggle? No, usually combobox selects.
        // If user wants deselect, they usually clear.
        // For now, simple select.
        value = val;
        open = false;
        if (onSelect) onSelect(item);
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger>
        {#snippet child({ props })}
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                class="w-full justify-between"
                {...props}
            >
                <span class="truncate">{selectedLabel}</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content
        class="w-[--radix-popover-trigger-width] p-0"
        align="start"
    >
        <Command.Root>
            <Command.Input placeholder={searchPlaceholder} />
            <Command.List>
                <Command.Empty>{emptyText}</Command.Empty>
                <Command.Group class="max-h-[300px] overflow-y-auto">
                    {#each items as item}
                        <Command.Item
                            value={getFilterValue(item)}
                            onSelect={() => handleSelect(item)}
                        >
                            <Check
                                class={cn(
                                    "mr-2 h-4 w-4",
                                    value === getValue(item)
                                        ? "opacity-100"
                                        : "opacity-0",
                                )}
                            />
                            {#if itemSnippet}
                                {@render itemSnippet(item)}
                            {:else}
                                {getLabel(item)}
                            {/if}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
