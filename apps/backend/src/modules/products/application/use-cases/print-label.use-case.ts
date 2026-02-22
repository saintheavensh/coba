/**
 * Use case: Print a product label.
 */
import type { IPrintGateway } from "../../domain/print-gateway.port";
import type { LabelData } from "../../domain/product.entity";

export class PrintLabelUseCase {
    constructor(private readonly printGateway: IPrintGateway) { }

    async execute(data: LabelData): Promise<{ success: boolean; error?: unknown }> {
        return this.printGateway.printProductLabel(data);
    }
}
