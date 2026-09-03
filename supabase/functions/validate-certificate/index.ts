import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

/**
 * Validação pública de certificados.
 * Roda com service role porque `profiles` e `enrollments` não são legíveis
 * por visitantes anônimos — expõe apenas os dados necessários à validação.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { code } = await req.json().catch(() => ({ code: '' }));
    const raw = typeof code === 'string' ? code.trim().toUpperCase().replace(/\s+/g, '') : '';

    if (!raw || raw.length > 40) {
      return json({ valid: false, error: 'Código inválido' }, 400);
    }

    // Aceita o código com ou sem hífens (ex.: O77R68CQAXUC ou O77R-68CQ-AXUC)
    const compact = raw.replace(/-/g, '');
    const candidates = new Set<string>([raw, compact]);
    if (compact.length === 12) {
      candidates.add(`${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8)}`);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: matches, error } = await supabase
      .from('certificates')
      .select('id, user_id, enrollment_id, certificate_code, issued_at, courses(title, duration_hours)')
      .in('certificate_code', Array.from(candidates))
      .limit(1);

    if (error) throw error;
    const cert = matches?.[0];
    if (!cert) return json({ valid: false });


    const [{ data: profile }, { data: enrollment }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('user_id', cert.user_id).maybeSingle(),
      cert.enrollment_id
        ? supabase
            .from('enrollments')
            .select('exam_score, exam_completed_at')
            .eq('id', cert.enrollment_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return json({
      valid: true,
      certificate: {
        id: cert.id,
        certificate_code: cert.certificate_code,
        issued_at: cert.issued_at,
        courses: cert.courses,
        profiles: { full_name: profile?.full_name ?? 'Aluno(a)' },
        enrollments: enrollment ?? null,
      },
    });
  } catch (err) {
    console.error('validate-certificate error:', err);
    return json({ valid: false, error: 'Erro ao validar certificado' }, 500);
  }
});
