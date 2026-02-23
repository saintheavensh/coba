import { LocalStorageAdapter } from "./infrastructure/local-storage.adapter";
import { UploadFileUseCase } from "./application/use-cases/upload-file.use-case";

// Adapters
const storageService = new LocalStorageAdapter();

// Use Cases
const uploadFileUC = new UploadFileUseCase(storageService);

export {
    uploadFileUC
};
