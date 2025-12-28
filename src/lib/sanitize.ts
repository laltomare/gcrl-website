// Escape HTML to prevent XSS
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes
  let cleaned = input.replace(/\0/g, '');
  
  // Limit length (prevent DoS)
  if (cleaned.length > 10000) {
    cleaned = cleaned.substring(0, 10000);
  }
  
  // Escape HTML
  cleaned = escapeHtml(cleaned);
  
  return cleaned.trim();
}

// Validate filename (prevent path traversal)
export function sanitizeFilename(filename: string): string {
  // Remove directory separators
  const cleaned = filename.replace(/[\/\\]/g, '');
  
  // Only allow safe characters
  const safeFilename = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return safeFilename;
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
