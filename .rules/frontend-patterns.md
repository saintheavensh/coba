# Frontend Development Patterns

Stack: **Svelte 5**, **Tailwind CSS**.

## Component Patterns

### Composition (Slots/Snippets)

Use **Snippets** (Svelte 5) or **Slots** for composition.

```svelte
<!-- Card.svelte -->
<script lang="ts">
    let { children, header } = $props();
</script>

<div class="card">
    {#if header}
        <div class="card-header">{@render header()}</div>
    {/if}
    <div class="card-body">
        {@render children()}
    </div>
</div>

<!-- Usage -->
<Card>
    {#snippet header()}
        <h3>Title</h3>
    {/snippet}
    <p>Content</p>
</Card>
```

### State Management (Runes)

Use `$state` for local state and reactive classes for shared state.

```typescript
// store.svelte.ts
export class CounterStore {
    count = $state(0);

    increment() {
        this.count += 1;
    }
}
```

```svelte
<!-- Component.svelte -->
<script>
    import { CounterStore } from './store.svelte.ts';
    const store = new CounterStore();
</script>

<button onclick={() => store.increment()}>
    Count is {store.count}
</button>
```

### Context Pattern

Use `setContext` and `getContext` for passing data deep in the tree.

```svelte
<!-- Parent.svelte -->
<script>
    import { setContext } from 'svelte';
    let theme = $state('dark');
    setContext('theme', theme);
</script>
```

```svelte
<!-- Child.svelte -->
<script>
    import { getContext } from 'svelte';
    const theme = getContext('theme');
</script>
```

## Performance Optimization

### Derived State

Use `$derived` for values that depend on other state.

```typescript
let count = $state(0);
let double = $derived(count * 2); // Auto-updates, no unnecessary calcs
```

### Effects

Use `$effect` sparingly, primarily for side effects (DOM manipulation, analytics).

```typescript
$effect(() => {
    console.log(`Count changed to ${count}`);
});
```

## Form Handling

### Controlled Inputs

```svelte
<script>
    let name = $state('');
    
    function handleSubmit(e) {
        e.preventDefault();
        // Validation logic
    }
</script>

<form onsubmit={handleSubmit}>
    <input bind:value={name} placeholder="Name" />
</form>
```

## Aesthetics & UI

-   **Tailwind CSS**: Use utility classes.
-   **Micro-interactions**: Add hover states (`hover:bg-...`) and transitions (`transition-all duration-200`).
-   **Structure**: Keep components small and focused.
