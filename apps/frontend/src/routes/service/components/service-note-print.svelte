<script lang="ts">
    import { generateQrCodeSvg } from "$lib/utils";
    import { browser } from "$app/environment";

    export let serviceOrder: any = null;
    export let open = false;

    // Reactive State for QR
    let qrHtml = "";

    // Generate QR when order changes
    $: if (serviceOrder?.no) {
        generateQrCodeSvg(serviceOrder.no).then((html) => {
            qrHtml = html;
        });
    }

    // Auto print when opened
    $: if (browser && open && serviceOrder) {
        setTimeout(() => {
            // window.print() REMOVED - using Server Side Printing
            console.warn(
                "ServiceNotePrint loaded but client-printing is disabled.",
            );
        }, 500);
    }

    // Portal Action to move node to body
    function portal(node: HTMLElement) {
        document.body.appendChild(node);
        return {
            destroy() {
                if (node.parentNode) node.parentNode.removeChild(node);
            },
        };
    }
</script>

{#if open && serviceOrder}
    <div
        class="hidden fixed inset-0 bg-white z-[9999] print-area print-portal"
        use:portal
    >
        <!-- Thermal Printer Layout (58mm or 80mm usually, here using generic small width) -->
        <div class="w-[78mm] p-2 text-black font-mono text-sm bg-white">
            <!-- Header -->
            <div class="text-center mb-4">
                <h2 class="font-bold text-lg">SAINT HEAVENS</h2>
                <p class="text-xs">Service & Sparepart Handphone</p>
                <p class="text-xs">Jl. Raya No. 123 (0812-3456-7890)</p>
                <hr class="border-t border-black border-dashed my-2" />
                <h3 class="font-bold">SERVICE DOJO</h3>
            </div>

            <!-- Info -->
            <div class="space-y-1 mb-4 text-xs">
                <div class="flex justify-between">
                    <span>No. Service:</span>
                    <span class="font-bold">{serviceOrder.no}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{serviceOrder.dateIn?.split(" ")[0]}</span>
                </div>
                <div class="flex justify-between">
                    <span>Customer:</span>
                    <span class="font-bold">{serviceOrder.customer?.name}</span>
                </div>
                <div class="flex justify-between">
                    <span>Telepon:</span>
                    <span>{serviceOrder.customer?.phone}</span>
                </div>
            </div>

            <hr class="border-t border-black border-dashed my-2" />

            <!-- Device -->
            <div class="mb-4 text-xs">
                <p class="font-bold mb-1">Unit:</p>
                <p>{serviceOrder.phone?.brand} {serviceOrder.phone?.model}</p>
                <p class="italic text-[10px] mt-1">
                    Keluhan: {serviceOrder.complaint}
                </p>
                <p class="italic text-[10px]">
                    Status Fisik: {serviceOrder.phone?.condition?.join(", ") ||
                        "-"}
                </p>
            </div>

            <!-- QRCode -->
            <div class="flex flex-col items-center justify-center my-4">
                <div class="w-32 h-32">
                    {@html qrHtml}
                </div>
                <p class="text-xs mt-1">{serviceOrder.no || "-"}</p>
            </div>

            <!-- Footer -->
            <div class="text-center text-[10px] mt-4">
                <p>Harap bawa struk ini saat pengambilan.</p>
                <p>Terima Kasih!</p>
            </div>
        </div>
    </div>
{/if}

<style>
    @media print {
        /* Hide all body children except the portal */
        :global(body > *:not(.print-portal)) {
            display: none !important;
        }

        /* Ensure body is clean */
        :global(body) {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
        }

        /* Style the portal content */
        :global(.print-portal) {
            display: block !important;
            position: static !important; /* Flow naturally */
            width: 80mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            visibility: visible !important;
            z-index: 9999 !important;
        }

        /* Hide the overlay flex centering */
        :global(.print-portal) {
            /* Override flex from the screen class 'flex items-center ...' */
            display: block !important;
        }

        /* Ensure no other page margins interfere */
        @page {
            size: 80mm auto; /* Specific for 80mm thermal paper */
            margin: 0;
        }
    }
</style>
