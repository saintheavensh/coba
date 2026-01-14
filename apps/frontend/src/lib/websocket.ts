import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

// WebSocket connection state
export type WebSocketState = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage {
    type: string;
    data?: unknown;
    userId?: string;
    timestamp?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private messageHandlers: Set<MessageHandler> = new Set();
    private userId: string | null = null;

    state: Writable<WebSocketState> = writable("disconnected");
    lastMessage: Writable<WebSocketMessage | null> = writable(null);

    /**
     * Connect to WebSocket server
     */
    connect(userId?: string): void {
        if (!browser) return;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.userId = userId || null;
        this.state.set("connecting");

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, "") || "localhost:4000";
        const wsUrl = `${protocol}//${host}/ws${userId ? `?userId=${userId}` : ""}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log("🔌 WebSocket connected");
                this.state.set("connected");
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.lastMessage.set(message);

                    // Notify all handlers
                    this.messageHandlers.forEach((handler) => {
                        try {
                            handler(message);
                        } catch (err) {
                            console.error("Error in message handler:", err);
                        }
                    });
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err);
                }
            };

            this.ws.onclose = () => {
                console.log("🔌 WebSocket disconnected");
                this.state.set("disconnected");
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.state.set("error");
            };
        } catch (err) {
            console.error("Failed to create WebSocket:", err);
            this.state.set("error");
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.state.set("disconnected");
    }

    /**
     * Send a message through WebSocket
     */
    send(message: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not connected, cannot send message");
        }
    }

    /**
     * Subscribe to WebSocket messages
     */
    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log("Max reconnect attempts reached");
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
                this.connect(this.userId || undefined);
            }
        }, delay);
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
        send: wsClient.send.bind(wsClient),
        onMessage: wsClient.onMessage.bind(wsClient),
        disconnect: wsClient.disconnect.bind(wsClient),
    };
}
