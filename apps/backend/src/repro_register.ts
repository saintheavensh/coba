
import { accountingService } from "./modules/accounting/accounting-container";

async function test() {
    console.log("Starting Verification for register status...");
    try {
        console.log("1. Testing accountingService.getTodayRegisterProgress()...");
        const status = await accountingService.getTodayRegisterProgress();
        console.log("Status retrieved:", JSON.stringify(status, null, 2));

        if (status && typeof status.isOpen === 'boolean') {
            console.log("Verification SUCCESSFUL: isOpen is present");
        } else {
            console.error("Verification FAILED: isOpen is missing or status is null");
        }
    } catch (error: any) {
        console.error("Verification FAILED");
        console.error("Message:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

test();
