import { UploadResult } from "../entities/upload.entity";

export interface IStorageService {
    upload(file: File, folder?: string): Promise<UploadResult>;
    // delete(path: string): Promise<void>; // Potential future expansion
}
