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

// Format CPF to Brazilian format: 000.000.000-00
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 11);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
}

// Validate CPF
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}
