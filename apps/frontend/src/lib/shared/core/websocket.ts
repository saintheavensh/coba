import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// WebSocket connection state
export type WebSocketState = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage {
    type: string;
    data?: any;
    userId?: string;
    timestamp?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
    private channel: RealtimeChannel | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private userId: string | null = null;

    state: Writable<WebSocketState> = writable("disconnected");
    lastMessage: Writable<WebSocketMessage | null> = writable(null);

    /**
     * Connect to Supabase Realtime
     */
    connect(userId?: string): void {
        if (!browser) return;
        if (this.channel) return;

        this.userId = userId || null;
        this.state.set("connecting");

        console.log("🔌 Connecting to Supabase Realtime...");

        // Subscribe to changes in the 'notifications' table
        this.channel = supabase
            .channel("public:notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: userId ? `user_id=eq.${userId}` : undefined,
                },
                (payload) => {
                    this.handleNotification(payload.new);
                }
            )
            // Example for listening to stock updates (if we want to sync stock)
            // .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' }, ...)
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("🔌 Supabase Realtime connected");
                    this.state.set("connected");
                } else if (status === "CLOSED") {
                    console.log("🔌 Supabase Realtime disconnected");
                    this.state.set("disconnected");
                    this.channel = null;
                } else if (status === "CHANNEL_ERROR") {
                    console.error("Supabase Realtime error");
                    this.state.set("error");
                }
            });
    }

    private handleNotification(notification: any) {
        // Adapt DB notification structure to our internal WebSocket message format
        const message: WebSocketMessage = {
            type: notification.type || "notification",
            data: notification,
            userId: notification.user_id,
            timestamp: notification.created_at || new Date().toISOString(),
        };

        this.lastMessage.set(message);

        // Notify all handlers
        this.messageHandlers.forEach((handler) => {
            try {
                handler(message);
            } catch (err) {
                console.error("Error in message handler:", err);
            }
        });
    }

    /**
     * Disconnect from Supabase Realtime
     */
    disconnect(): void {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
        this.state.set("disconnected");
    }

    /**
     * Send a message
     * Note: In Supabase, we usually don't "send" messages through the socket for this use case.
     * We insert into the DB. But if we need broadcast:
     */
    async send(message: object): Promise<void> {
        // Implement Broadcast if needed, or log warning
        console.warn("Direct sending not implemented. Use DB inserts.");
    }

    /**
     * Subscribe to messages
     */
    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Convenience function for Svelte components
export function useWebSocket(userId?: string) {
    if (browser) {
        wsClient.connect(userId);
    }

    return {
        state: wsClient.state,
        lastMessage: wsClient.lastMessage,
        connect: wsClient.connect.bind(wsClient),
        send: wsClient.send.bind(wsClient),
        onMessage: wsClient.onMessage.bind(wsClient),
        disconnect: wsClient.disconnect.bind(wsClient),
    };
}
