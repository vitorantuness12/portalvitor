import { get, set, del, keys, createStore } from 'idb-keyval';

/**
 * Armazenamento offline do conteúdo dos cursos.
 * Usamos IndexedDB (via idb-keyval) porque o conteúdo dos módulos pode
 * ultrapassar facilmente o limite de ~5MB do localStorage.
 */

export interface OfflineModule {
  title: string;
  content: string;
}

export interface OfflineCourse {
  courseId: string;
  title: string;
  description: string;
  level: string;
  durationHours: number;
  modules: OfflineModule[];
  savedAt: string;
  version: number;
}

export const OFFLINE_VERSION = 1;

const store = createStore('formak-offline', 'courses');

const courseKey = (courseId: string) => `course:${courseId}`;

export async function saveOfflineCourse(course: OfflineCourse): Promise<void> {
  await set(courseKey(course.courseId), course, store);
}

export async function getOfflineCourse(courseId: string): Promise<OfflineCourse | null> {
  try {
    const data = await get<OfflineCourse>(courseKey(courseId), store);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function removeOfflineCourse(courseId: string): Promise<void> {
  await del(courseKey(courseId), store);
}

export async function listOfflineCourseIds(): Promise<string[]> {
  try {
    const allKeys = await keys(store);
    return allKeys
      .filter((k): k is string => typeof k === 'string' && k.startsWith('course:'))
      .map((k) => k.replace('course:', ''));
  } catch {
    return [];
  }
}

export interface OfflineCourseSummary {
  courseId: string;
  title: string;
  savedAt: string;
  moduleCount: number;
  /** Tamanho aproximado em bytes (UTF-16 do conteúdo serializado) */
  bytes: number;
}

/** Calcula o tamanho aproximado (em bytes) de um curso salvo. */
function estimateBytes(course: OfflineCourse): number {
  try {
    return new Blob([JSON.stringify(course)]).size;
  } catch {
    return JSON.stringify(course).length * 2;
  }
}

/** Lista todos os cursos salvos com tamanho estimado, para a tela de gerenciamento. */
export async function listOfflineCourses(): Promise<OfflineCourseSummary[]> {
  const ids = await listOfflineCourseIds();
  const items = await Promise.all(
    ids.map(async (id) => {
      const course = await getOfflineCourse(id);
      if (!course) return null;
      return {
        courseId: course.courseId,
        title: course.title,
        savedAt: course.savedAt,
        moduleCount: course.modules.length,
        bytes: estimateBytes(course),
      } satisfies OfflineCourseSummary;
    })
  );
  return items
    .filter((i): i is OfflineCourseSummary => i !== null)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Remove todos os downloads offline do aparelho. */
export async function clearAllOfflineCourses(): Promise<void> {
  const ids = await listOfflineCourseIds();
  await Promise.all(ids.map((id) => removeOfflineCourse(id)));
}

/** Formata bytes em unidade legível (pt-BR). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* ------------------------------------------------------------------ */
/* Fila de progresso pendente (quando o aluno estuda sem internet)     */
/* ------------------------------------------------------------------ */

const PENDING_KEY = 'formak:pending-progress';

type PendingProgress = Record<string, number>; // enrollmentId -> progress

function readPending(): PendingProgress {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingProgress) : {};
  } catch {
    return {};
  }
}

function writePending(data: PendingProgress) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    /* storage cheio: ignorar silenciosamente */
  }
}

export function queueProgress(enrollmentId: string, progress: number) {
  const pending = readPending();
  if ((pending[enrollmentId] ?? 0) < progress) {
    pending[enrollmentId] = progress;
    writePending(pending);
  }
}

export function getPendingProgress(): PendingProgress {
  return readPending();
}

export function clearPendingProgress(enrollmentId: string) {
  const pending = readPending();
  delete pending[enrollmentId];
  writePending(pending);
}
