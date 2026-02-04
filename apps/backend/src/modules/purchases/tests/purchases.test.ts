import { describe, it, expect, vi } from "vitest";

// Mock hono/jwt to bypass token verification
vi.mock("hono/jwt", () => ({
    verify: vi.fn().mockResolvedValue({ id: "USR-TEST", role: "admin" }),
    sign: vi.fn().mockResolvedValue("mock-token"),
    decode: vi.fn().mockReturnValue({ header: {}, payload: { id: "USR-TEST", role: "admin" }, signature: "" })
}));

// Mock hono/bun for static serving
vi.mock("hono/bun", () => ({
    serveStatic: () => async (c: any, next: any) => await next()
}));

import { app } from "../../../index";

// Mock Data
const validPurchase = {
    supplierId: "SUP-TEST-001",
    date: "2024-02-04",
    items: [
        {
            productId: "PRD-TEST-001",
            variant: "Test Variant",
            qty: 10,
            buyPrice: 50000,
            sellPrice: 100000
        }
    ]
};

describe("Purchases Module Integration Tests", () => {
    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-token"
    };

    // Test 1: Validation - Reject Missing Fields
    it("should reject purchase creation with missing supplierId", async () => {
        const invalidData = { ...validPurchase, supplierId: undefined };

        const res = await app.request("/purchases", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(invalidData),
        });

        expect(res.status).toBe(400); // Bad Request
    });

    // Test 2: Validation - Reject Negative Quantity
    it("should reject items with negative quantity", async () => {
        const invalidData = {
            ...validPurchase,
            items: [{ ...validPurchase.items[0], qty: -5 }]
        };

        const res = await app.request("/purchases", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(invalidData),
        });

        expect(res.status).toBe(400); // Validation error handled by Zod
    });

    // Test 3: Validation - Reject Negative Price
    it("should reject items with negative price", async () => {
        const invalidData = {
            ...validPurchase,
            items: [{ ...validPurchase.items[0], buyPrice: -100 }]
        };

        const res = await app.request("/purchases", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(invalidData),
        });

        expect(res.status).toBe(400);
    });
});
