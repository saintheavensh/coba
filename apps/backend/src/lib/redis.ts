import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Publisher instance for sending messages
export const publisher = new Redis(redisUrl);

// Subscriber instance (separate connection required for pub/sub)
export const subscriber = new Redis(redisUrl);

// General client for caching
export const redis = new Redis(redisUrl);

import { Logger } from "./logger";

// ... instances ... 

// Handle connection events
publisher.on("connect", () => {
    Logger.info("📨 Redis publisher connected");
});

subscriber.on("connect", () => {
    Logger.info("📩 Redis subscriber connected");
});

redis.on("connect", () => {
    Logger.info("🔴 Redis cache client connected");
});

publisher.on("error", (err) => {
    Logger.error("Redis publisher error", err);
});

subscriber.on("error", (err) => {
    Logger.error("Redis subscriber error", err);
});

redis.on("error", (err) => {
    Logger.error("Redis cache error", err);
});
