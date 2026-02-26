import { appConfig } from "./src/shared/infrastructure/config/AppConfig";

console.log("Checking JWT Secret...");
console.log("process.env.JWT_SECRET:", process.env.JWT_SECRET);
console.log("appConfig.jwtSecret:", appConfig.jwtSecret);

if (appConfig.jwtSecret === "supersecret") {
    console.log("SUCCESS: JWT Secret matches .env");
} else {
    console.error("ERROR: JWT Secret mismatch!");
}
