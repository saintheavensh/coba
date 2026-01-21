import * as cheerio from "cheerio";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs/promises";
import { Logger } from "../../lib/logger";
import { ApiError } from "../../lib/error";
import { z } from "zod";

const ScrapeUrlSchema = z.string().url();

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

export const ScraperService = {
    async scrapeGsmArena(url: string) {
        try {
            // Validation
            const validation = ScrapeUrlSchema.safeParse(url);
            if (!validation.success) {
                throw new ApiError("Invalid URL format", 400);
            }

            Logger.info(`Parsing URL: ${url}`); // Use Logger

            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) {
                if (response.status === 429) {
                    throw new ApiError("Too Many Requests - try again later", 429);
                }
                throw new ApiError(`Failed to fetch URL: ${response.statusText}`, response.status);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Extract basic info
            const title = $(".specs-phone-name-title").text();
            if (!title) throw new ApiError("Could not find device title", 422);

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

            // Colors often in "Misc" table
            const colors = specs["Colors"] || specs["Colors (USA)"] || "";
            const rawModels = specs["Models"] || "";

            // Clean up Models string (often comma separated or multiple lines)
            const modelsArray = rawModels.split(/,|\\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            const codes = modelsArray.join(", ");

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
                    colors: colors,
                    models: codes
                },
                // Raw Helpers
                specs_ram_storage: specs["Internal"] || "",
                code: codes // Use cleaned codes
            };

            return mappedData;

        } catch (error) {
            Logger.error("Scraping error", error);
            if (error instanceof ApiError) throw error;
            throw new ApiError("Failed to scrape URL", 500);
        }
    },

    async downloadImage(url: string, brand: string, modelName: string = ""): Promise<string> {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) {
                Logger.warn(`Failed to download image from ${url}: ${response.statusText}`);
                return "";
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine folder
            const safeBrand = brand.replace(/[^a-zA-Z0-9]/g, "");
            const uploadDir = join("public/uploads", safeBrand);

            // Async mkdir
            try {
                await fs.access(uploadDir);
            } catch {
                await fs.mkdir(uploadDir, { recursive: true });
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

            // Async write
            await fs.writeFile(filepath, buffer);

            return `/uploads/${safeBrand}/${filename}`;
        } catch (e) {
            Logger.error("Failed to download image", e);
            return "";
        }
    },

    async getDeviceLinks(url: string): Promise<{ name: string; url: string; }[]> {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) throw new ApiError("Failed to fetch list URL", response.status);

            const html = await response.text();
            const $ = cheerio.load(html);
            const results: { name: string; url: string; }[] = [];

            // Case 1: Brand page or Search results (div.makers)
            $(".makers ul li").each((i, el) => {
                const link = $(el).find("a");
                const href = link.attr("href");
                const name = link.find("span").html()?.replace(/<br>/g, " ").trim() || link.text().trim(); // Sometimes name has <br>

                if (href && name) {
                    // GSMArena links are relative
                    const fullUrl = href.startsWith("http") ? href : `https://www.gsmarena.com/${href}`;
                    results.push({ name, url: fullUrl });
                }
            });

            return results;
        } catch (e) {
            Logger.error("Failed to parse list", e);
            throw new ApiError("Failed to parse device list", 500);
        }
    }
};

