import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { SettingsController } from "../controllers/settings.controller";
import { SettingsService } from "../services/settings.service";
import { createMockContext } from "../../../../test/factories";

describe("SettingsController", () => {
    // Spies
    let getAllSpy: any;
    let getPaymentMethodsSpy: any;
    let setPaymentMethodsSpy: any;
    let getStoreInfoSpy: any;
    let setStoreInfoSpy: any;
    let getReceiptSettingsSpy: any;
    let setReceiptSettingsSpy: any;
    let getServiceSettingsSpy: any;
    let setServiceSettingsSpy: any;
    let getWhatsAppSettingsSpy: any;
    let setWhatsAppSettingsSpy: any;
    let getCommissionSettingsSpy: any;
    let setCommissionSettingsSpy: any;
    let getAccountMappingsSpy: any;
    let setAccountMappingsSpy: any;
    let getGeneralSettingsSpy: any;
    let setGeneralSettingsSpy: any;
    let factoryResetSpy: any;
    let getByKeySpy: any;
    let setByKeySpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        getAllSpy = vi.spyOn(SettingsService.prototype, "getAll").mockResolvedValue([]);
        getPaymentMethodsSpy = vi.spyOn(SettingsService.prototype, "getPaymentMethods").mockResolvedValue({} as any);
        setPaymentMethodsSpy = vi.spyOn(SettingsService.prototype, "setPaymentMethods").mockResolvedValue({} as any);
        getStoreInfoSpy = vi.spyOn(SettingsService.prototype, "getStoreInfo").mockResolvedValue({} as any);
        setStoreInfoSpy = vi.spyOn(SettingsService.prototype, "setStoreInfo").mockResolvedValue({} as any);
        getReceiptSettingsSpy = vi.spyOn(SettingsService.prototype, "getReceiptSettings").mockResolvedValue({} as any);
        setReceiptSettingsSpy = vi.spyOn(SettingsService.prototype, "setReceiptSettings").mockResolvedValue({} as any);
        getServiceSettingsSpy = vi.spyOn(SettingsService.prototype, "getServiceSettings").mockResolvedValue({} as any);
        setServiceSettingsSpy = vi.spyOn(SettingsService.prototype, "setServiceSettings").mockResolvedValue({} as any);
        getWhatsAppSettingsSpy = vi.spyOn(SettingsService.prototype, "getWhatsAppSettings").mockResolvedValue({} as any);
        setWhatsAppSettingsSpy = vi.spyOn(SettingsService.prototype, "setWhatsAppSettings").mockResolvedValue({} as any);
        getCommissionSettingsSpy = vi.spyOn(SettingsService.prototype, "getCommissionSettings").mockResolvedValue({} as any);
        setCommissionSettingsSpy = vi.spyOn(SettingsService.prototype, "setCommissionSettings").mockResolvedValue({} as any);
        getAccountMappingsSpy = vi.spyOn(SettingsService.prototype, "getAccountMappings").mockResolvedValue([]);
        setAccountMappingsSpy = vi.spyOn(SettingsService.prototype, "setAccountMappings").mockResolvedValue({} as any);
        getGeneralSettingsSpy = vi.spyOn(SettingsService.prototype, "getGeneralSettings").mockResolvedValue({} as any);
        setGeneralSettingsSpy = vi.spyOn(SettingsService.prototype, "setGeneralSettings").mockResolvedValue({} as any);
        factoryResetSpy = vi.spyOn(SettingsService.prototype, "factoryReset").mockResolvedValue({} as any);
        getByKeySpy = vi.spyOn(SettingsService.prototype, "get").mockResolvedValue({} as any);
        setByKeySpy = vi.spyOn(SettingsService.prototype, "set").mockResolvedValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const testEndpoint = async (methodName: keyof typeof SettingsController, spy: any, mode: "get" | "set") => {
        const ctx = createMockContext();
        if (mode === "set") vi.spyOn(ctx.req, "json").mockResolvedValue({});
        if (methodName === "getByKey" || methodName === "setByKey") vi.spyOn(ctx.req, "param").mockReturnValue("key");
        const res = await SettingsController[methodName](ctx);
        expect(res.status).toBe(200);
    };

    const testError = async (methodName: keyof typeof SettingsController, spy: any) => {
        const ctx = createMockContext();
        vi.spyOn(ctx.req, "json").mockResolvedValue({});
        if (methodName === "getByKey" || methodName === "setByKey") vi.spyOn(ctx.req, "param").mockReturnValue("key");
        spy.mockRejectedValue(new Error("Err"));
        const res = await SettingsController[methodName](ctx);
        expect(res.status).toBe(500);
    };

    describe("getAll", () => {
        it("should return 200", async () => await testEndpoint("getAll", getAllSpy, "get"));
        it("should return 500", async () => await testError("getAll", getAllSpy));
    });

    describe("PaymentMethods", () => {
        it("get should return 200", async () => await testEndpoint("getPaymentMethods", getPaymentMethodsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setPaymentMethods", setPaymentMethodsSpy, "set"));
        it("get should return 500 on error", async () => await testError("getPaymentMethods", getPaymentMethodsSpy));
        it("set should return 500 on error", async () => await testError("setPaymentMethods", setPaymentMethodsSpy));
    });

    describe("StoreInfo", () => {
        it("get should return 200", async () => await testEndpoint("getStoreInfo", getStoreInfoSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setStoreInfo", setStoreInfoSpy, "set"));
    });

    describe("ReceiptSettings", () => {
        it("get should return 200", async () => await testEndpoint("getReceiptSettings", getReceiptSettingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setReceiptSettings", setReceiptSettingsSpy, "set"));
    });

    describe("ServiceSettings", () => {
        it("get should return 200", async () => await testEndpoint("getServiceSettings", getServiceSettingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setServiceSettings", setServiceSettingsSpy, "set"));
    });

    describe("WhatsAppSettings", () => {
        it("get should return 200", async () => await testEndpoint("getWhatsAppSettings", getWhatsAppSettingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setWhatsAppSettings", setWhatsAppSettingsSpy, "set"));
    });

    describe("CommissionSettings", () => {
        it("get should return 200", async () => await testEndpoint("getCommissionSettings", getCommissionSettingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setCommissionSettings", setCommissionSettingsSpy, "set"));
    });

    describe("AccountMappings", () => {
        it("get should return 200", async () => await testEndpoint("getAccountMappings", getAccountMappingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setAccountMappings", setAccountMappingsSpy, "set"));
    });

    describe("GeneralSettings", () => {
        it("get should return 200", async () => await testEndpoint("getGeneralSettings", getGeneralSettingsSpy, "get"));
        it("set should return 200", async () => await testEndpoint("setGeneralSettings", setGeneralSettingsSpy, "set"));
    });

    describe("Key/Value", () => {
        it("getByKey should return 200", async () => await testEndpoint("getByKey", getByKeySpy, "get"));
        it("setByKey should return 200", async () => await testEndpoint("setByKey", setByKeySpy, "set"));
    });

    describe("Factory Reset", () => {
        it("should return 200", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ mode: "full" });
            const res = await SettingsController.factoryReset(ctx);
            expect(res.status).toBe(200);
        });
        it("should return 400 if mode missing", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({});
            const res = await SettingsController.factoryReset(ctx);
            expect(res.status).toBe(400);
        });
        it("should return 500 on error", async () => {
            const ctx = createMockContext();
            vi.spyOn(ctx.req, "json").mockResolvedValue({ mode: "data" });
            factoryResetSpy.mockRejectedValue(new Error("Err"));
            const res = await SettingsController.factoryReset(ctx);
            expect(res.status).toBe(500);
        });
    });
});
