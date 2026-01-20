import * as cheerio from "cheerio";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs";

export const ScraperService = {
    async scrapeGsmArena(url: string) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            // Extract basic info
            const title = $(".specs-phone-name-title").text();
            const brand = title.split(" ")[0]; // Simple guess
            const model = title.replace(brand, "").trim();
            const imageUrl = $(".specs-photo-main img").attr("src");

            // Extract Spec Tables
            const specs: Record<string, any> = {};

            $("table").each((i, table) => {
                const category = $(table).find("th").text().trim(); // Network, Launch, Body, etc.

                $(table).find("tr").each((j, tr) => {
                    const label = $(tr).find(".ttl").text().trim();
                    const value = $(tr).find(".nfo").text().trim();
                    if (label && value) {
                        specs[label] = value;
                    }
                });
            });

            // Handle Image Download
            let localImagePath = "";
            if (imageUrl) {
                localImagePath = await this.downloadImage(imageUrl, brand, model);
            }

            // Map to our schema
            const mappedData = {
                brand: brand,
                model: model,
                image: localImagePath,
                chipset: specs["Chipset"] || "",
                specifications: {
                    network_technology: specs["Technology"] || "",
                    announced: specs["Announced"] || "",
                    status: specs["Status"] || "",
                    display_type: specs["Type"] || "",
                    display_size: specs["Size"] || "",
                    display_resolution: specs["Resolution"] || "",
                    os: specs["OS"] || "",
                    chipset: specs["Chipset"] || "",
                    cpu: specs["CPU"] || "",
                    gpu: specs["GPU"] || "",
                    memory_card: specs["Card slot"] || "",
                    internal_memory: specs["Internal"] || "",
                    primary_camera: specs["Single"] || specs["Dual"] || specs["Triple"] || specs["Quad"] || "",
                    secondary_camera: specs["Single"] || specs["Dual"] || "",
                    video: specs["Video"] || "",
                    wlan: specs["WLAN"] || "",
                    bluetooth: specs["Bluetooth"] || "",
                    gps: specs["Positioning"] || "",
                    nfc: specs["NFC"] || "",
                    radio: specs["Radio"] || "",
                    usb: specs["USB"] || "",
                    sensors: specs["Sensors"] || "",
                    battery: specs["Type"] || "",
                    colors: specs["Colors"] || "",
                    models: specs["Models"] || ""
                },
                // Raw Helpers
                specs_ram_storage: specs["Internal"] || "",
                code: specs["Models"] || ""
            };

            return mappedData;

        } catch (error) {
            console.error("Scraping error:", error);
            throw new Error("Failed to scrape URL");
        }
    },

    async downloadImage(url: string, brand: string, modelName: string = ""): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) return "";

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine folder
            const safeBrand = brand.replace(/[^a-zA-Z0-9]/g, "");
            const uploadDir = join("public/uploads", safeBrand);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Generate filename from Model Name
            const ext = url.split(".").pop() || "jpg";
            let filename = `${uuidv4()}.${ext}`;

            if (modelName) {
                // Sanitize model name: "Galaxy S24 Ultra" -> "Galaxy_S24_Ultra"
                const safeModel = modelName.replace(/[^a-zA-Z0-9]/g, "_");
                filename = `${safeModel}.${ext}`;
            }

            const filepath = join(uploadDir, filename);

            // Save file
            fs.writeFileSync(filepath, buffer);

            return `/uploads/${safeBrand}/${filename}`;
        } catch (e) {
            console.error("Failed to download image:", e);
            return "";
        }
    }
};
