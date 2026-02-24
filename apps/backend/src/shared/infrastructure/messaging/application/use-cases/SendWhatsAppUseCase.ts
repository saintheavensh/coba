import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IWhatsAppGateway } from "../../domain";
import { Result } from "../../../../core/Result";

export interface SendWhatsAppInput {
    to: string;
    message: string;
}

@injectable()
export class SendWhatsAppUseCase {
    constructor(
        @inject(TYPES.IWhatsAppGateway) private whatsappGateway: IWhatsAppGateway
    ) { }

    async execute(input: SendWhatsAppInput): Promise<Result<void>> {
        return await this.whatsappGateway.sendMessage(input.to, input.message);
    }
}
