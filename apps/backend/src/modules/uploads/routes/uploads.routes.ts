import { Hono, Context } from "hono";
import { apiSuccess, apiError } from "../../../lib/response";
import { uploadFile } from "../../../shared/utils/uploads";
import { Logger } from "../../../lib/logger";

const app = new Hono();

app.post("/", async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];
        const folder = body["folder"] as string | undefined; // Optional folder path

        if (!file || !(file instanceof File)) {
            return apiError(c, "Request must include 'file' field", "Validation Error", 400);
        }

        const result = await uploadFile(file, folder);
        return apiSuccess(c, result, "File uploaded successfully");
    } catch (e: any) {
        Logger.error("Failed to upload file", e);
        // Clean error message if it's our custom error
        const message = e.message || "Failed to upload file";
        const status = message.includes("Invalid file type") ? 400 : 500;
        return apiError(c, e, message, status);
    }
});

export default app;
