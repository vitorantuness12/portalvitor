const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 155;

interface CourseSeoInput {
  title: string;
  category?: string | null;
  durationHours?: number | null;
  level?: string | null;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  const cleaned = cleanText(value);
  if (cleaned.length <= maxLength) return cleaned;

  const shortened = cleaned.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  const safeCut = lastSpace >= Math.floor(maxLength * 0.7) ? shortened.slice(0, lastSpace) : shortened;
  return `${safeCut.trimEnd()}…`;
}

function normalizeLevel(level?: string | null): string {
  const labels: Record<string, string> = {
    iniciante: 'iniciante',
    intermediario: 'intermediário',
    avancado: 'avançado',
  };

  return labels[level ?? ''] ?? cleanText(level ?? 'livre').toLocaleLowerCase('pt-BR');
}

export function buildCourseSeo({ title, category, durationHours, level }: CourseSeoInput) {
  const cleanTitle = cleanText(title);
  const preferredTitle = `${cleanTitle}: curso online | Formak`;
  const fallbackTitle = `${cleanTitle} | Formak`;
  const seoTitle = preferredTitle.length <= MAX_TITLE_LENGTH
    ? preferredTitle
    : fallbackTitle.length <= MAX_TITLE_LENGTH
      ? fallbackTitle
      : `${truncateAtWord(cleanTitle, MAX_TITLE_LENGTH - 9)} | Formak`;

  const details = [
    durationHours && durationHours > 0 ? `${durationHours} horas` : null,
    `nível ${normalizeLevel(level)}`,
    'certificado próprio de conclusão',
  ].filter(Boolean).join(', ');
  const categoryContext = category ? ` de ${cleanText(category)}` : '';
  const description = truncateAtWord(
    `Faça o curso online de ${cleanTitle}${categoryContext}, com ${details}. Estude no seu ritmo na Formak.`,
    MAX_DESCRIPTION_LENGTH,
  );

  return { title: seoTitle, description };
}