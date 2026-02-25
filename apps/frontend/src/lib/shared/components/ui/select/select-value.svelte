<script lang="ts">
    import { Select as SelectPrimitive } from "bits-ui";

    let { ref = $bindable(null), placeholder, ...restProps }: any = $props();
</script>

<!-- svelte-ignore node_invalid_placement_ssr -->
<!-- svelte-ignore a11y_missing_attribute -->
<SelectPrimitive.Value bind:ref {placeholder} {...restProps} />
