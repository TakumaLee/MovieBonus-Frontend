import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function sanitizeJsonLd(data: unknown): string {
  return DOMPurify.sanitize(JSON.stringify(data), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
