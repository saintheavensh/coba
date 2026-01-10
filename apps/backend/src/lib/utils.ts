/**
 * Shared utility functions for the backend
 * Following DRY principles - centralized common operations
 */

import { v4 as uuidv4 } from "uuid";
import { ID_PREFIXES, type IdPrefix } from "@repo/shared";

// Re-export ID_PREFIXES for convenience
export const ID_PREFIX = ID_PREFIXES;

/**
 * Generate a unique ID with prefix
 * Format: PREFIX-XXXXXXXX (8 chars uppercase hex)
 * 
 * @param prefix - Entity type prefix from ID_PREFIX
 * @returns Formatted unique ID
 * 
 * @example
 * generateId(ID_PREFIX.CUSTOMER) // "CUST-A1B2C3D4"
 * generateId(ID_PREFIX.PRODUCT)  // "PRD-E5F6G7H8"
 */
export function generateId(prefix: IdPrefix): string {
    return `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}`;
}

/**
 * Generate service number with year
 * Format: SRV-YYYY-XXX
 * 
 * @param sequenceNumber - Sequential number for the year
 * @returns Formatted service number
 */
export function generateServiceNo(sequenceNumber: number): string {
    const year = new Date().getFullYear();
    return `${ID_PREFIX.SERVICE}-${year}-${String(sequenceNumber).padStart(3, "0")}`;
}

/**
 * Format currency to IDR
 * @param amount - Amount in smallest unit (no decimals)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Parse date string to Date object
 * Handles ISO strings and YYYY-MM-DD format
 */
export function parseDate(dateString: string): Date {
    return new Date(dateString);
}

/**
 * Get current timestamp for database
 */
export function getCurrentTimestamp(): Date {
    return new Date();
}
