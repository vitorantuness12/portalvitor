// Gera versões leves (JPEG ~640px) das capas dos cursos no bucket privado.
// Motivo: os originais são PNGs de ~3 MB, o que trava a aba Explorar no PWA.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { decode, Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'course-thumbnails';
const TARGET_WIDTH = 640;

export function thumbKey(path: string): string {
  return `thumbs/${path.replace(/\.[a-z0-9]+$/i, '')}.jpg`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    const admin = createClient(url, serviceKey);
    // Permite execução administrativa direta (service role) ou por um usuário admin.
    if (token && token !== serviceKey && token !== Deno.env.get('SUPABASE_ANON_KEY')) {
      const { data: userData, error: userError } = await admin.auth.getUser(token);
      if (userError || !userData?.user) return json({ error: 'Sessão inválida' }, 401);

      const { data: isAdmin } = await admin.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      if (!isAdmin) return json({ error: 'Acesso restrito a administradores' }, 403);
    }

    const { data: courses, error: coursesError } = await admin
      .from('courses')
      .select('thumbnail_url')
      .not('thumbnail_url', 'is', null);
    if (coursesError) return json({ error: coursesError.message }, 500);

    const paths = Array.from(
      new Set(
        (courses ?? [])
          .map((c) => (c.thumbnail_url ?? '').trim())
          .filter((p) => p && !/^https?:\/\//i.test(p) && !p.startsWith('thumbs/')),
      ),
    );

    let created = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const path of paths) {
      const key = thumbKey(path);
      try {
        const { data: existing } = await admin.storage
          .from(BUCKET)
          .list('thumbs', { search: key.replace('thumbs/', ''), limit: 1 });
        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const { data: file, error: dlError } = await admin.storage.from(BUCKET).download(path);
        if (dlError || !file) {
          failed.push(path);
          continue;
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const decoded = await decode(bytes);
        if (!(decoded instanceof Image)) {
          failed.push(path);
          continue;
        }
        if (decoded.width > TARGET_WIDTH) decoded.resize(TARGET_WIDTH, Image.RESIZE_AUTO);
        const jpeg = await decoded.encodeJPEG(70);

        const { error: upError } = await admin.storage
          .from(BUCKET)
          .upload(key, jpeg, { contentType: 'image/jpeg', upsert: true });
        if (upError) {
          failed.push(path);
          continue;
        }
        created++;
      } catch (_e) {
        failed.push(path);
      }
    }

    return json({ success: true, total: paths.length, created, skipped, failed });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, 500);
  }
});
