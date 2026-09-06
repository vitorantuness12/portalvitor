/**
 * Gera public/sitemap.xml antes de `vite dev` e `vite build`.
 * Inclui rotas públicas estáticas, páginas de categoria e todos os cursos ativos.
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://formak.com.br';

const SUPABASE_URL = 'https://bchuchlphwykimpwotfh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaHVjaGxwaHd5a2ltcHdvdGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDI1NDAsImV4cCI6MjEwMzg3ODU0MH0.Sj56QRLbO8PZda29pAr5CkfgEXKA5Ao5XJb0MRxTFG0';

interface SitemapEntry {
  path: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: string;
}

function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string)
  );
}

async function collectEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/cursos', changefreq: 'daily', priority: '0.9' },
    { path: '/validar-certificado', changefreq: 'monthly', priority: '0.5' },
    { path: '/validar-carteirinha', changefreq: 'monthly', priority: '0.4' },
  ];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: categories } = await supabase.from('categories').select('name');
    for (const category of categories ?? []) {
      const slug = slugify(category.name as string);
      if (slug) entries.push({ path: `/categoria/${slug}`, changefreq: 'weekly', priority: '0.8' });
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('status', 'active');
    for (const course of courses ?? []) {
      entries.push({ path: `/curso/${course.id}`, changefreq: 'weekly', priority: '0.7' });
    }
  } catch (error) {
    // Sem rede/credenciais o sitemap ainda é gerado com as rotas estáticas.
    console.warn('sitemap: não foi possível buscar dados dinâmicos —', error);
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      '  <url>',
      `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n')
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

const entries = await collectEntries();
writeFileSync(resolve('public/sitemap.xml'), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
