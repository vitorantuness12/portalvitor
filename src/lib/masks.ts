// Format phone number to Brazilian format: (99) 99999-9999
export function formatPhoneBR(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits (DDD + 9 digits)
  const limited = digits.slice(0, 11);
  
  // Apply mask based on length
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

// Remove mask and return only digits
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

// Validate Brazilian phone (11 digits: DDD + 9 digits for mobile)
export function isValidPhoneBR(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits[2] === '9';
}
