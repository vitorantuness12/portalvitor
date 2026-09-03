import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'course-thumbnails';
const SIGNED_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

/** Cache em memória: caminho no bucket -> URL assinada (ou null quando indisponível). */
const signedUrlCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Extrai o caminho do objeto dentro do bucket a partir de uma URL de storage
 * (funciona tanto para URLs `/object/public/...` quanto `/object/sign/...`).
 */
export function extractThumbnailPath(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    new RegExp(`/storage/v1/object/(?:public|sign)/${BUCKET}/([^?]+)`),
  );
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function signPath(path: string): Promise<string | null> {
  if (signedUrlCache.has(path)) return signedUrlCache.get(path) ?? null;

  const existing = inflight.get(path);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL_SECONDS);
      const url = error ? null : data?.signedUrl ?? null;
      signedUrlCache.set(path, url);
      return url;
    } catch {
      signedUrlCache.set(path, null);
      return null;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, promise);
  return promise;
}

/**
 * Resolve a URL de exibição da capa de um curso.
 * O bucket é privado, então URLs salvas no banco (públicas ou assinadas antigas)
 * são reassinadas sob demanda. Retorna `undefined` quando não há imagem válida.
 */
export function useCourseThumbnail(url?: string | null): string | undefined {
  const path = extractThumbnailPath(url);
  const [resolved, setResolved] = useState<string | undefined>(() => {
    if (!path) return url ?? undefined;
    return signedUrlCache.get(path) ?? undefined;
  });

  useEffect(() => {
    let active = true;

    if (!path) {
      setResolved(url ?? undefined);
      return;
    }

    const cached = signedUrlCache.get(path);
    if (cached !== undefined) {
      setResolved(cached ?? undefined);
      return;
    }

    signPath(path).then((signed) => {
      if (active) setResolved(signed ?? undefined);
    });

    return () => {
      active = false;
    };
  }, [path, url]);

  return resolved;
}
