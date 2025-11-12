import DOMPurify from 'dompurify';

/**
 * Sanitization utilities to prevent XSS attacks.
 * All user inputs should be sanitized before storing or displaying.
 */

/**
 * Sanitize a string to prevent XSS attacks.
 * Removes HTML tags and dangerous characters.
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize a name (player name, group name).
 * Allows letters, numbers, spaces, and common punctuation.
 */
export function sanitizeName(name: string): string {
  const cleaned = sanitizeString(name);
  
  // Remove any remaining special characters except: letters, numbers, spaces, hyphens, apostrophes, ampersands
  return cleaned.replace(/[^a-zA-Z0-9\s\-'&]/g, '');
}

/**
 * Sanitize notes/comments.
 * Allows basic text but removes scripts and dangerous HTML.
 */
export function sanitizeNotes(notes: string): string {
  if (!notes) return '';
  
  // Allow basic formatting but remove scripts
  const cleaned = DOMPurify.sanitize(notes, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], // Only safe formatting tags
    ALLOWED_ATTR: [], // No attributes
  });
  
  return cleaned.trim();
}

/**
 * Validate and sanitize a string with length constraints.
 */
export function sanitizeWithLength(
  input: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Input'
): string {
  const sanitized = sanitizeString(input);
  
  if (sanitized.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`${fieldName} must be no more than ${maxLength} characters`);
  }
  
  return sanitized;
}

/**
 * Sanitize an object's string properties recursively.
 * Useful for sanitizing entire form data objects.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>];
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}
