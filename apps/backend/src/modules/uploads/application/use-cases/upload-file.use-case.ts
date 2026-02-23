import { IStorageService } from "../../domain/repositories/storage.service.port";
import { UploadResult } from "../../domain/entities/upload.entity";

export class UploadFileUseCase {
    constructor(private readonly storageService: IStorageService) { }

    async execute(file: File, folder?: string): Promise<UploadResult> {
        // Validation logic moved from utility to use case if it's business logic
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
        }

        return await this.storageService.upload(file, folder);
    }
}
