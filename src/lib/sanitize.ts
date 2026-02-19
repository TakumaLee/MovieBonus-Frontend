/**
 * Sanitization utilities
 * 
 * sanitizeJsonLd: strips HTML tags for safe JSON-LD embedding (no DOM needed)
 * sanitizeHtml: uses DOMPurify on client side only
 */

// Strip all HTML tags — safe for JSON-LD structured data
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function sanitizeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  // JSON-LD only needs script-injection prevention, strip any HTML tags
  return stripHtmlTags(json);
}

// Lazy-load DOMPurify only on client side
let purify: typeof import('dompurify') extends { default: infer T } ? T : any;

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side fallback: strip tags
    return stripHtmlTags(html);
  }
  if (!purify) {
    // Dynamic import not ideal in sync fn, so use require for client
    // eslint-disable-next-line
    purify = require('dompurify');
  }
  return purify.sanitize(html);
}
