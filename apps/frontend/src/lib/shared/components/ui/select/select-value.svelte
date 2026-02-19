<script lang="ts">
    import { Select as SelectPrimitive } from "bits-ui";

    let {
        ref = $bindable(null),
        placeholder,
        ...restProps
    }: SelectPrimitive.ValueProps = $props();
</script>

<SelectPrimitive.Value bind:ref {placeholder} {...restProps} />
