interface CourseModule {
  title: string;
  content: string;
}

function isCourseModule(value: unknown): value is CourseModule {
  return typeof value === 'object' && value !== null &&
    'content' in value && typeof value.content === 'string' &&
    'title' in value && typeof value.title === 'string';
}

function plainText(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*```[^\n]*$/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*|__/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*([-*+])\s+/gm, '• ')
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Exporta apenas os módulos teóricos, sem descrição, exercícios ou prova. */
export function buildCourseTxt(title: string, rawModules: string | null): string {
  if (!rawModules) throw new Error('Este curso ainda não possui conteúdo para baixar.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawModules);
  } catch {
    throw new Error('O conteúdo deste curso está em um formato inválido.');
  }

  if (!Array.isArray(parsed) || !parsed.every(isCourseModule)) {
    throw new Error('O conteúdo deste curso está em um formato inválido.');
  }

  const modules = parsed
    .map((module, index) => ({
      title: plainText(module.title) || `Módulo ${index + 1}`,
      content: plainText(module.content),
      number: index + 1,
    }))
    .filter((module) => module.content.length > 0);

  if (modules.length === 0) throw new Error('Este curso ainda não possui conteúdo para baixar.');

  return `${title.trim()}\n\n${modules.map((module) =>
    `Módulo ${module.number}: ${module.title}\n\n${module.content}`
  ).join('\n\n────────────────────\n\n')}\n`;
}

export function saveCourseTxt(id: string, title: string, content: string): void {
  const filename = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'curso';
  const blob = new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${id.slice(0, 8)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}