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
