import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { OpnameService } from "./opname.service";

interface OpnameItem {
    id: number;
    systemStock: number;
    physicalStock: number | null;
    difference: number;
    adjustmentReason: string | null;
    variantName: string | null;
    product: { name: string } | null;
}

interface OpnameSession {
    id: string;
    status: "draft" | "completed" | "cancelled";
    notes: string | null;
    createdAt: string;
    user: { name: string } | null;
    items: OpnameItem[];
}

/**
 * Controller for the Opname Session Detail page
 * Manages session data, item updates, and session finalization
 */
export class OpnameDetailController {
    private sessionId: string;

    // State
    session = $state<OpnameSession | null>(null);
    isLoading = $state(true);
    isSaving = $state(false);
    searchTerm = $state("");
    items = $state<OpnameItem[]>([]);

    constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    // Derived state
    get filteredItems() {
        return this.items.filter(
            (item) =>
                item.product?.name
                    .toLowerCase()
                    .includes(this.searchTerm.toLowerCase()) ||
                item.variantName
                    ?.toLowerCase()
                    .includes(this.searchTerm.toLowerCase()),
        );
    }

    get totalDifference(): number {
        return this.items.reduce((acc, item) => acc + (item.difference || 0), 0);
    }

    get countedItemsCount(): number {
        return this.items.filter((i) => i.physicalStock !== null).length;
    }

    get totalItemsCount(): number {
        return this.items.length;
    }

    get isDraft(): boolean {
        return this.session?.status === "draft";
    }

    // Actions
    async fetchSession() {
        this.isLoading = true;
        try {
            this.session = await OpnameService.getOpnameSessionDetails(this.sessionId);
            if (this.session) {
                this.items = [...this.session.items];
            }
        } catch (error) {
            toast.error("Failed to fetch session details");
        } finally {
            this.isLoading = false;
        }
    }

    async updateItem(item: OpnameItem) {
        try {
            const result = await OpnameService.updateOpnameItem(item.id, {
                physicalStock: item.physicalStock ?? 0,
                reason: item.adjustmentReason ?? undefined,
            });
            item.difference = result.difference;
            toast.success(`Updated ${item.product?.name}`);
        } catch (error) {
            toast.error("Failed to update item");
        }
    }

    updateItemDifference(item: OpnameItem) {
        item.difference = (item.physicalStock || 0) - item.systemStock;
    }

    async handleFinalize() {
        if (
            !confirm(
                "Are you sure you want to finalize this session? This will update system stock levels.",
            )
        )
            return;

        this.isSaving = true;
        try {
            await OpnameService.finalizeOpnameSession(this.sessionId);
            toast.success("Session finalized successfully");
            await this.fetchSession();
        } catch (error) {
            toast.error("Failed to finalize session");
        } finally {
            this.isSaving = false;
        }
    }

    async handleCancel() {
        if (!confirm("Cancel this session? All counts will be lost.")) return;

        try {
            await OpnameService.cancelOpnameSession(this.sessionId);
            toast.success("Session cancelled");
            goto("/inventory/opname");
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    }

    handleBack() {
        goto("/inventory/opname");
    }

    handlePrint() {
        // TODO: Implement print functionality
        toast.info("Print report coming soon");
    }
}
