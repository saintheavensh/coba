import { vi, describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import uploadsApp from "../routes/uploads.routes";

// Mock the shared upload utility
vi.mock("../../../shared/utils/uploads", () => ({
    uploadFile: vi.fn()
}));

describe("Uploads Routes", () => {
    let app: Hono;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = new Hono();
        app.route("/", uploadsApp);
    });

    it("should return 200 on success", async () => {
        const { uploadFile } = await import("../../../shared/utils/uploads");
        (uploadFile as any).mockResolvedValue({ url: "/uploads/file.png" });

        const formData = new FormData();
        formData.append("file", new File(["content"], "test.png", { type: "image/png" }));

        const res = await app.request("/", {
            method: "POST",
            body: formData
        });

        expect(res.status).toBe(200);
        const json = await res.json() as any;
        expect(json.data).toEqual({ url: "/uploads/file.png" });
    });

    it("should return 400 if file missing", async () => {
        const formData = new FormData();
        // No file provided

        const res = await app.request("/", {
            method: "POST",
            body: formData
        });

        expect(res.status).toBe(400);
    });

    it("should return 500 on upload error", async () => {
        const { uploadFile } = await import("../../../shared/utils/uploads");
        (uploadFile as any).mockRejectedValue(new Error("Upload failed"));

        const formData = new FormData();
        formData.append("file", new File(["content"], "test.png", { type: "image/png" }));

        const res = await app.request("/", {
            method: "POST",
            body: formData
        });

        expect(res.status).toBe(500);
    });
});
