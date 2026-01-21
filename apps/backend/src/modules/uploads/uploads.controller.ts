import { Hono } from "hono";
import { apiSuccess, apiError } from "../../lib/response";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { Context } from "hono";
import { Logger } from "../../lib/logger";

const app = new Hono();

app.post("/", async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];
        const folder = body["folder"]; // Optional folder path

        if (!file || !(file instanceof File)) {
            // c, error, message, status
            return apiError(c, "Request must include 'file' field", "Validation Error", 400);
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return apiError(c, "Invalid file type. Only JPEG, PNG, and WebP are allowed.", "Validation Error", 400);
        }

        const extension = file.name.split(".").pop();
        const filename = `${uuidv4()}.${extension}`;

        // Save to public/uploads
        // Ensure path logic correct relative to CWD (apps/backend)
        let uploadDir = "public/uploads";

        // If folder is provided, sanitize and append
        let relativeUrl = "/uploads";
        if (typeof folder === "string" && folder.trim().length > 0) {
            // Sanitize folder name to allow only alphanumeric, underscores, hyphens, and spaces
            const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();
            if (sanitizedFolder) {
                uploadDir = join(uploadDir, sanitizedFolder);
                relativeUrl = `/uploads/${sanitizedFolder}`;
            }
        }

        const path = join(uploadDir, filename);

        // Ensure directory exists
        const fs = await import("node:fs");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const arrayBuffer = await file.arrayBuffer();
        await Bun.write(path, arrayBuffer);

        // Env dependent URL construction could be added here preferably, 
        // but returning relative path is usually safer for frontend to handle or standard base
        // Let's return the full relative path from server root or absolute URL if we knew hostname.
        // Returning `/uploads/${filename}` is good for relative to current domain
        const url = `${relativeUrl}/${filename}`;

        return apiSuccess(c, { url }, "File uploaded successfully");
    } catch (e) {
        Logger.error("Failed to upload file", e);
        return apiError(c, e, "Failed to upload file", 500);
    }
});

export default app;
