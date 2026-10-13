export function normalizeOrderId(input: string): string {
  // Trim and uppercase
  let normalized = input.trim().toUpperCase();
  // Remove all whitespace
  normalized = normalized.replace(/\s+/g, '');
  
  // Try to match basic parts if it's lacking dashes, e.g. CKT2026100001 -> CKT-2026-100001
  // Regex matches CKT followed by a 4-digit year, followed by at least 1 digit
  const match = normalized.match(/^CKT-?(\d{4})-?(\d+)$/);
  if (match) {
    const year = match[1];
    const id = match[2];
    return `CKT-${year}-${id}`;
  }
  
  return normalized;
}

export function isValidOrderId(input: string): boolean {
  return /^CKT-\d{4}-\d+$/.test(normalizeOrderId(input));
}

export function normalizeQuoteId(input: string): string {
  let normalized = input.trim().toUpperCase();
  normalized = normalized.replace(/\s+/g, '');
  
  const match = normalized.match(/^QT-?(\d{4})-?(\d+)$/);
  if (match) {
    const year = match[1];
    const id = match[2];
    return `QT-${year}-${id}`;
  }
  
  return normalized;
}

export function isValidQuoteId(input: string): boolean {
  return /^QT-\d{4}-\d+$/.test(normalizeQuoteId(input));
}
