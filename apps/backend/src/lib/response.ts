import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiResponse } from "@repo/shared";
import { Logger } from "./logger";

/**
 * Generic API response helper
 */
export function apiResponse<T>(
    c: Context,
    success: boolean,
    message: string,
    data: T | null = null,
    status: ContentfulStatusCode = 200,
    meta: Record<string, unknown> | null = null
): Response {
    const response: ApiResponse<T> = {
        success,
        message,
        data: data ?? undefined,
        meta: meta ?? undefined
    };
    if (!success) {
        response.errors = data ? [data] : [];
        response.error_code = typeof data === 'string' ? 'ERROR' : undefined;
    }
    return c.json(response, status);
}

/**
 * Success response helper with generic typing
 * @param status - HTTP status code (default 200, use 201 for creates)
 */
export function apiSuccess<T>(
    c: Context,
    data: T,
    message: string = "Operation successful",
    status: ContentfulStatusCode = 200,
    meta: Record<string, unknown> | null = null
): Response {
    return apiResponse(c, true, message, data, status, meta);
}

/**
 * Error response helper
 */
export function apiError(
    c: Context,
    error: unknown,
    message: string = "An error occurred",
    status: ContentfulStatusCode = 500
): Response {
    let errorDetails: string | null = null;
    if (error instanceof Error) {
        errorDetails = process.env.NODE_ENV === "development" ? error.stack ?? error.message : error.message;
    } else if (typeof error === 'string') {
        errorDetails = error;
    }

    if (status === 500) {
        Logger.error(`[API_ERROR] ${message}`, error);
        // Here you could also stream to a log file or external service (Sentry, etc.)
    }

    return c.json({
        success: false,
        message,
        errors: errorDetails ? [errorDetails] : [],
        error_code: status === 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST"
    }, status);
}
