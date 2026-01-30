
const { fetch } = require("bun");

async function main() {
    try {
        console.log("Testing DELETE endpoint for AST-0011...");
        const response = await fetch("http://localhost:5173/api/accounting/assets/AST-0011", {
            method: "DELETE"
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.ok) {
            console.log("Response OK");
        } else {
            const text = await response.text();
            console.log("Response Body:", text);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

main();
