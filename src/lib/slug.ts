/**
 * Converte um texto em um slug seguro para URLs (sem acentos, minúsculo).
 * Usado nas páginas de categoria: /categoria/:slug
 */
export function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
