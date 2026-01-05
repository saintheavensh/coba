<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { cn } from "$lib/utils";

    export let size = 300;
    export let value: number[] = [];
    export let readonly = false;

    const dispatch = createEventDispatcher();

    // 3x3 Grid
    const points = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        x: (i % 3) * (size / 3) + size / 6,
        y: Math.floor(i / 3) * (size / 3) + size / 6,
    }));

    let isDrawing = false;
    let currentPath: number[] = value;
    let currentPos = { x: 0, y: 0 };

    $: if (value) {
        currentPath = value;
    }

    function getPointAt(x: number, y: number) {
        const radius = 20; // Hit radius
        return points.find((p) => Math.hypot(p.x - x, p.y - y) < radius);
    }

    function handleStart(e: MouseEvent | TouchEvent, pointId: number) {
        if (readonly) return;
        isDrawing = true;
        currentPath = [pointId];
        updateCurrentPos(e);
    }

    function handleMove(e: MouseEvent | TouchEvent) {
        if (!isDrawing || readonly) return;
        e.preventDefault();
        updateCurrentPos(e);

        const svg = e.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        let clientX, clientY;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const point = getPointAt(x, y);
        if (point && !currentPath.includes(point.id)) {
            currentPath = [...currentPath, point.id];
        }
    }

    function handleEnd() {
        if (!isDrawing || readonly) return;
        isDrawing = false;
        dispatch("change", currentPath);
    }

    function updateCurrentPos(e: MouseEvent | TouchEvent) {
        const svg = (e.target as Element).closest("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();

        let clientX, clientY;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        currentPos = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }
</script>

<svg
    width={size}
    height={size}
    class={cn(
        "touch-none select-none bg-muted/20 rounded-lg cursor-pointer",
        readonly && "pointer-events-none opacity-80",
    )}
    on:mousemove={handleMove}
    on:mouseup={handleEnd}
    on:mouseleave={handleEnd}
    on:touchmove={handleMove}
    on:touchend={handleEnd}
>
    <!-- Lines -->
    {#if currentPath.length > 0}
        <polyline
            points={currentPath
                .map((id) => `${points[id].x},${points[id].y}`)
                .join(" ")}
            fill="none"
            stroke="hsl(var(--primary))"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <!-- Line to current mouse pos while drawing -->
        {#if isDrawing}
            <line
                x1={points[currentPath[currentPath.length - 1]].x}
                y1={points[currentPath[currentPath.length - 1]].y}
                x2={currentPos.x}
                y2={currentPos.y}
                stroke="hsl(var(--primary))"
                stroke-width="4"
                stroke-linecap="round"
                stroke-dasharray="4 4"
                opacity="0.5"
            />
        {/if}
    {/if}

    <!-- Points -->
    {#each points as point}
        <circle
            cx={point.x}
            cy={point.y}
            r="8"
            class={cn(
                "fill-muted-foreground transition-all duration-200",
                currentPath.includes(point.id)
                    ? "fill-primary r-12"
                    : "hover:fill-primary/50",
            )}
        />
        <!-- Invisible hit area -->
        <circle
            cx={point.x}
            cy={point.y}
            r="20"
            fill="transparent"
            on:mousedown={(e) => handleStart(e, point.id)}
            on:touchstart={(e) => handleStart(e, point.id)}
        />
    {/each}
</svg>
