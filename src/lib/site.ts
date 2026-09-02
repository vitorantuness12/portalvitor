/**
 * URL pública canônica da plataforma.
 * Usada em QR codes e links de validação para que nunca apontem
 * para domínios de preview/desenvolvimento.
 */
export const SITE_URL = 'https://formak.com.br';

/** Monta uma URL absoluta na base pública. */
export function publicUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
