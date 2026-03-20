import type { AppError } from '../types';

export type URLValidationResult = 
  | { valid: true; url: string }
  | { valid: false; error: AppError };

/**
 * Validates a URL input string
 * @param input - The URL string to validate
 * @returns Validation result with either the valid URL or an error
 */
export function validateURL(input: string): URLValidationResult {
  // Check for empty or whitespace-only input
  const trimmed = input.trim();
  if (trimmed === '') {
    return {
      valid: false,
      error: {
        type: 'EMPTY_URL',
        message: 'Please enter a Ponpoto URL'
      }
    };
  }
  
  // Check for valid URL format
  if (!isValidURLFormat(trimmed)) {
    return {
      valid: false,
      error: {
        type: 'INVALID_URL',
        message: 'Invalid URL format. Please enter a valid Ponpoto URL'
      }
    };
  }
  
  return {
    valid: true,
    url: trimmed
  };
}

/**
 * Checks if a string is a valid URL format
 * @param str - The string to check
 * @returns true if the string is a valid URL format
 */
function isValidURLFormat(str: string): boolean {
  // Must have a protocol (http:// or https://)
  if (!str.includes('://')) {
    return false;
  }
  
  try {
    const url = new URL(str);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Gets the error message for a given AppError
 * @param error - The error object
 * @returns Human-readable error message
 */
export function getErrorMessage(error: AppError): string {
  return error.message;
}
