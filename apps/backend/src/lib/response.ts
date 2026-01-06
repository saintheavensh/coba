import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";

export const apiResponse = (c: Context, success: boolean, message: string, data: any = null, status: StatusCode = 200, meta: any = null) => {
    return c.json({
        success,
        message,
        data,
        meta,
        ...(success ? {} : { errors: data, error_code: typeof data === 'string' ? 'ERROR' : undefined })
    }, status);
};

export const apiSuccess = (c: Context, data: any, message: string = "Operation successful", meta: any = null) => {
    return apiResponse(c, true, message, data, 200, meta);
};

export const apiError = (c: Context, error: any, message: string = "An error occurred", status: StatusCode = 500) => {
    // Determine error details
    let errorDetails = null;
    if (error instanceof Error) {
        errorDetails = process.env.NODE_ENV === "development" ? error.stack : error.message;
    } else {
        errorDetails = error;
    }

    return c.json({
        success: false,
        message,
        errors: Array.isArray(errorDetails) ? errorDetails : [errorDetails],
        error_code: status === 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST"
    }, status);
};
