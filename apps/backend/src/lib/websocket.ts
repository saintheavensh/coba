import type { WSContext } from "hono/ws";
import { subscriber } from "./redis";
import { Logger } from "./logger";

// Store active WebSocket connections by user ID
const clients = new Map<string, Set<WSContext>>();

// Store all connections for broadcast
const allClients = new Set<WSContext>();

/**
 * Add a WebSocket client connection
 */
export function addClient(userId: string | null, ws: WSContext) {
    allClients.add(ws);

    if (userId) {
        if (!clients.has(userId)) {
            clients.set(userId, new Set());
        }
        clients.get(userId)!.add(ws);
    }

    Logger.info(`🔌 WebSocket connected`, { total: allClients.size, users: clients.size });
}

/**
 * Remove a WebSocket client connection
 */
export function removeClient(userId: string | null, ws: WSContext) {
    allClients.delete(ws);

    if (userId && clients.has(userId)) {
        clients.get(userId)!.delete(ws);
        if (clients.get(userId)!.size === 0) {
            clients.delete(userId);
        }
    }

    Logger.info(`🔌 WebSocket disconnected`, { total: allClients.size, users: clients.size });
}

/**
 * Send message to a specific user (all their connections)
 */
export function sendToUser(userId: string, message: object) {
    const userClients = clients.get(userId);
    if (userClients) {
        const payload = JSON.stringify(message);
        userClients.forEach((client) => {
            try {
                client.send(payload);
            } catch (err) {
                Logger.error("Error sending to user", err);
            }
        });
    }
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastToAll(message: object) {
    const payload = JSON.stringify(message);
    allClients.forEach((client) => {
        try {
            client.send(payload);
        } catch (err) {
            Logger.error("Error broadcasting", err);
        }
    });
}

/**
 * Get connection stats
 */
export function getConnectionStats() {
    return {
        totalConnections: allClients.size,
        uniqueUsers: clients.size,
    };
}

// Subscribe to Redis notifications channel
subscriber.subscribe("notifications", (err) => {
    if (err) {
        Logger.error("Redis subscribe error", err);
    } else {
        Logger.info("📡 Subscribed to Redis notifications channel");
    }
});

// Handle incoming Redis messages
subscriber.on("message", (channel, message) => {
    if (channel === "notifications") {
        try {
            const data = JSON.parse(message);

            if (data.userId) {
                // Send to specific user
                sendToUser(data.userId, data);
            } else {
                // Broadcast to all
                broadcastToAll(data);
            }
        } catch (err) {
            Logger.error("Error processing Redis message", err);
        }
    }
});

// Subscribe to real-time updates channel (for live data sync)
subscriber.subscribe("realtime", (err) => {
    if (err) {
        Logger.error("Redis realtime subscribe error", err);
    } else {
        Logger.info("📡 Subscribed to Redis realtime channel");
    }
});

subscriber.on("message", (channel, message) => {
    if (channel === "realtime") {
        try {
            const data = JSON.parse(message);
            broadcastToAll(data);
        } catch (err) {
            Logger.error("Error processing realtime message", err);
        }
    }
});
