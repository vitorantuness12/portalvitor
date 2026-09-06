import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export interface SeoProps {
  /** Título da página (será exibido com o sufixo da marca). */
  title: string;
  /** Descrição usada em buscadores e redes sociais. */
  description: string;
  /** Caminho canônico da página, iniciando com "/". */
  path: string;
  /** Imagem absoluta de compartilhamento (opcional). */
  image?: string;
  /** Impede indexação da página. */
  noIndex?: boolean;
  /** Dados estruturados JSON-LD adicionais. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BRAND = 'Formak';
const DEFAULT_IMAGE = `${SITE_URL}/og-formak.jpg`;

/**
 * Define título, descrição, canonical, tags sociais e JSON-LD por rota.
 * Observação: como o app é uma SPA, os robôs que não executam JavaScript
 * continuam lendo as tags estáticas do index.html.
 */
export function Seo({ title, description, path, image, noIndex, jsonLd }: SeoProps) {
  const fullTitle = title.toLowerCase().includes('formak') ? title : `${title} | ${BRAND}`;
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const shareImage = image || DEFAULT_IMAGE;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={shareImage} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={shareImage} />

      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
