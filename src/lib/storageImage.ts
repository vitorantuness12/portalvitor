import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'course-thumbnails';
const SIGNED_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const STORAGE_KEY = 'formak:thumb-urls:v2';
/** Host do projeto Supabase atual — URLs de outros projetos estão mortas. */
const CURRENT_STORAGE_HOST = 'bchuchlphwykimpwotfh.supabase.co';

type CacheEntry = { url: string | null; exp: number };

/** Cache em memória + persistido (localStorage) para evitar reassinar a cada visita. */
const memCache = new Map<string, CacheEntry>();

function loadPersisted() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [path, entry] of Object.entries(parsed)) {
      if (entry && typeof entry.exp === 'number' && entry.exp > now) {
        memCache.set(path, entry);
      }
    }
  } catch {
    /* cache corrompido: ignora */
  }
}
loadPersisted();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (typeof window === 'undefined') return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const obj: Record<string, CacheEntry> = {};
      const now = Date.now();
      memCache.forEach((entry, path) => {
        if (entry.exp > now && entry.url) obj[path] = entry;
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      /* quota cheia: ignora */
    }
  }, 300);
}

function getCached(path: string): string | null | undefined {
  const entry = memCache.get(path);
  if (!entry) return undefined;
  if (entry.exp <= Date.now()) {
    memCache.delete(path);
    return undefined;
  }
  return entry.url;
}

function setCached(path: string, url: string | null) {
  memCache.set(path, {
    url,
    // falhas ficam em cache por pouco tempo, sucessos até quase expirar a assinatura
    exp: Date.now() + (url ? (SIGNED_TTL_SECONDS - 3600) * 1000 : 5 * 60 * 1000),
  });
  if (url) schedulePersist();
}

/**
 * Extrai o caminho do objeto dentro do bucket a partir de uma URL de storage.
 * Retorna `null` quando a URL não é do bucket do projeto atual.
 */
export function extractThumbnailPath(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Novos registros guardam somente o caminho permanente do objeto.
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\/+/, '') || null;
  }

  const match = trimmed.match(
    new RegExp(`^https?://([^/]+)/storage/v1/object/(?:public|sign)/${BUCKET}/([^?]+)`),
  );
  if (!match) return null;
  if (match[1] !== CURRENT_STORAGE_HOST) return null;
  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

/** Indica se a URL aponta para um storage do Supabase que não existe mais. */
function isDeadStorageUrl(url?: string | null): boolean {
  if (!url) return false;
  const match = url.match(/^https?:\/\/([^/]+)\/storage\/v1\/object\//);
  return !!match && match[1] !== CURRENT_STORAGE_HOST;
}

// ---- Assinatura em lote -----------------------------------------------------

const pending = new Map<string, ((url: string | null) => void)[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueue() {
  flushTimer = null;
  const paths = Array.from(pending.keys());
  if (!paths.length) return;
  const listeners = new Map(pending);
  pending.clear();

  const resolveAll = (path: string, url: string | null) => {
    setCached(path, url);
    listeners.get(path)?.forEach((cb) => cb(url));
  };

  // createSignedUrls aceita lotes; dividimos para não estourar limites.
  const CHUNK = 60;
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(chunk, SIGNED_TTL_SECONDS);
      if (error || !data) {
        chunk.forEach((p) => resolveAll(p, null));
        continue;
      }
      const byPath = new Map(data.map((d) => [d.path ?? '', d.signedUrl ?? null]));
      chunk.forEach((p) => resolveAll(p, byPath.get(p) ?? null));
    } catch {
      chunk.forEach((p) => resolveAll(p, null));
    }
  }
}

function requestSignedUrl(path: string): Promise<string | null> {
  const cached = getCached(path);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const list = pending.get(path);
    if (list) {
      list.push(resolve);
    } else {
      pending.set(path, [resolve]);
    }
    if (!flushTimer) flushTimer = setTimeout(flushQueue, 16);
  });
}

/** Caminho da versão leve (JPEG ~640px) gerada pela função optimize-thumbnails. */
function thumbPathFor(path: string): string {
  return `thumbs/${path.replace(/\.[a-z0-9]+$/i, '')}.jpg`;
}

/**
 * Resolve a melhor URL disponível: primeiro a miniatura leve, e só se ela não
 * existir cai para o arquivo original (bem mais pesado).
 */
async function requestBestUrl(path: string): Promise<string | null> {
  const thumb = await requestSignedUrl(thumbPathFor(path));
  if (thumb) return thumb;
  return requestSignedUrl(path);
}

function getCachedBest(path: string): string | null | undefined {
  const thumb = getCached(thumbPathFor(path));
  if (thumb) return thumb;
  if (thumb === undefined) return undefined;
  return getCached(path);
}

/**
 * Pré-assina as capas de uma lista de cursos assim que os dados chegam,
 * antes mesmo dos cards montarem — evita o "flash" de capas vazias.
 */
export function prefetchThumbnails(urls: (string | null | undefined)[]): void {
  for (const url of urls) {
    const path = extractThumbnailPath(url);
    if (path && getCachedBest(path) === undefined) void requestBestUrl(path);
  }
}

/**
 * Resolve a URL de exibição da capa de um curso.
 * O bucket é privado, então as URLs são assinadas em lote e guardadas em cache
 * (memória + localStorage). Retorna `undefined` quando não há imagem válida.
 */
export function useCourseThumbnail(url?: string | null): string | undefined {
  const path = extractThumbnailPath(url);
  const dead = !path && isDeadStorageUrl(url);

  const [resolved, setResolved] = useState<string | undefined>(() => {
    if (dead) return undefined;
    if (!path) return url ?? undefined;
    return getCachedBest(path) ?? undefined;
  });


  useEffect(() => {
    let active = true;

    if (dead) {
      setResolved(undefined);
      return;
    }

    if (!path) {
      setResolved(url ?? undefined);
      return;
    }

    const cached = getCachedBest(path);
    if (cached) {
      setResolved(cached);
      return;
    }

    requestBestUrl(path).then((signed) => {
      if (active) setResolved(signed ?? undefined);
    });


    return () => {
      active = false;
    };
  }, [path, url, dead]);

  return resolved;
}

