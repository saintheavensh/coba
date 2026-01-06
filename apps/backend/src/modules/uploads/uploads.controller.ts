import { Hono } from "hono";
import { apiSuccess, apiError } from "../../lib/response";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { Context } from "hono";

const app = new Hono();

app.post("/", async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];

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
        const uploadDir = "public/uploads";
        const path = join(uploadDir, filename);

        const arrayBuffer = await file.arrayBuffer();
        await Bun.write(path, arrayBuffer);

        // Env dependent URL construction could be added here preferably, 
        // but returning relative path is usually safer for frontend to handle or standard base
        // Let's return the full relative path from server root or absolute URL if we knew hostname.
        // Returning `/uploads/${filename}` is good for relative to current domain
        const url = `/uploads/${filename}`;

        return apiSuccess(c, { url }, "File uploaded successfully");
    } catch (e) {
        console.error(e);
        return apiError(c, e, "Failed to upload file", 500);
    }
});

export default app;
