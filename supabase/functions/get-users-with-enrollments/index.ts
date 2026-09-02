Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca todos os profiles (com user_id)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) throw profileError;

    // 2. Busca todos os enrollments com título do curso
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*, courses(title)')
      .order('created_at', { ascending: false });

    if (enrollError) throw enrollError;

    // 3. Busca emails do auth.users para todos os user_ids únicos
    const allUserIds = [...new Set((enrollments || []).map(e => e.user_id).filter(Boolean))];
    let authEmails: Record<string, string> = {};

    if (allUserIds.length > 0) {
      const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users_email', {
        user_ids: allUserIds,
      });

      if (!authError && authUsers) {
        // authUsers é array de { id, email }
        authUsers.forEach((u: { id: string; email: string }) => {
          authEmails[u.id] = u.email;
        });
      } else {
        // Fallback: tenta buscar direto da tabela auth (pode não funcionar em todos os cenários)
        // Tenta via query na view postgres que às vezes existe
        const { data: pgData } = await supabase
          .from('pg_catalog.pg_user' as any)
          .select('*');
        // Se não funcionar, deixa email vazio para esse fallback
      }
    }

    // 4. Agrupa enrollments por user_id
    const enrollmentsByUser: Record<string, typeof enrollments> = {};
    (enrollments || []).forEach(e => {
      if (!e.user_id) return;
      if (!enrollmentsByUser[e.user_id]) enrollmentsByUser[e.user_id] = [];
      enrollmentsByUser[e.user_id].push(e);
    });

    // 5. Monta lista de usuários
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const allUserIdsSet = new Set([
      ...(profiles || []).map(p => p.user_id),
      ...allUserIds,
    ]);

    const users = Array.from(allUserIdsSet).map(userId => {
      const profile = profileMap.get(userId);
      const userEnrollments = (enrollmentsByUser[userId] || []).map(e => ({
        id: e.id,
        course_id: e.course_id,
        progress: e.progress,
        status: e.status,
        exam_score: e.exam_score,
        created_at: e.created_at,
        course: { title: (e.courses as any)?.title || 'Curso' },
      }));

      return {
        id: userId,
        user_id: userId,
        full_name: profile?.full_name || `Usuário ${userId.slice(0, 8)}`,
        email: authEmails[userId] || profile?.email || 'sem-email',
        whatsapp: profile?.whatsapp || null,
        created_at: profile?.created_at || userEnrollments[0]?.created_at || '',
        enrollments: userEnrollments,
      };
    });

    // Ordena por data (mais recentes primeiro)
    users.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return new Response(JSON.stringify({ success: true, data: users }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
