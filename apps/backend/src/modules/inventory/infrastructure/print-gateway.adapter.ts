/**
 * Adapter for label printing. Implements IPrintGateway from domain.
 * Delegates to the existing PrintService infrastructure.
 */
import type { IPrintGateway } from "../domain/print-gateway.port";
import type { LabelData } from "../domain/product.entity";
import { PrintService } from "../../../services/print.service";

export class PrintGatewayAdapter implements IPrintGateway {
    private printService = new PrintService();

    async printProductLabel(data: LabelData): Promise<{ success: boolean; error?: unknown }> {
        return this.printService.printProductLabel(data);
    }
}
