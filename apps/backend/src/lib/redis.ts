import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Publisher instance for sending messages
export const publisher = new Redis(redisUrl);

// Subscriber instance (separate connection required for pub/sub)
export const subscriber = new Redis(redisUrl);

// General client for caching
export const redis = new Redis(redisUrl);

// Handle connection events
publisher.on("connect", () => {
    console.log("📨 Redis publisher connected");
});

subscriber.on("connect", () => {
    console.log("📩 Redis subscriber connected");
});

redis.on("connect", () => {
    console.log("🔴 Redis cache client connected");
});

publisher.on("error", (err) => {
    console.error("Redis publisher error:", err);
});

subscriber.on("error", (err) => {
    console.error("Redis subscriber error:", err);
});

redis.on("error", (err) => {
    console.error("Redis cache error:", err);
});
