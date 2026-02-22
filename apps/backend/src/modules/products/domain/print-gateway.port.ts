/**
 * Port for label printing. Keeps use cases independent of printing infrastructure.
 */
import type { LabelData } from "./product.entity";

export interface IPrintGateway {
    printProductLabel(data: LabelData): Promise<{ success: boolean; error?: unknown }>;
}
