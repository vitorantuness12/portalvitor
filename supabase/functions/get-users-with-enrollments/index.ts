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

    // 1. Busca todos os enrollments com título do curso
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*, courses(title)')
      .order('created_at', { ascending: false });

    if (enrollError) throw enrollError;

    const enrollmentUserIds = [...new Set((enrollments || []).map(e => e.user_id).filter(Boolean))];

    // 2. Busca todos os profiles (com user_id)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) throw profileError;

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const allUserIds = new Set([
      ...(profiles || []).map(p => p.user_id),
      ...enrollmentUserIds,
    ]);

    // 3. Busca dados do auth.users via admin.listUsers (inclui email, phone e raw_user_meta_data)
    const authUsersMap = new Map<string, { email: string; full_name: string; whatsapp: string }>();
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (listError) break;
      const users = pageData?.users || [];
      if (users.length === 0) break;
      for (const u of users) {
        const meta = (u.user_metadata || {}) as Record<string, any>;
        const fullName =
          meta.full_name ||
          meta.name ||
          [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
          '';
        const whatsapp =
          meta.whatsapp ||
          meta.phone ||
          (u.phone && u.phone.startsWith('+55') ? u.phone.slice(3) : u.phone) ||
          '';
        authUsersMap.set(u.id, {
          email: u.email || '',
          full_name: fullName,
          whatsapp: whatsapp,
        });
      }
      if (users.length < perPage) break;
      page++;
    }

    // 4. Garante que existe profile para cada user_id; cria/atualiza a partir do auth.users
    for (const userId of allUserIds) {
      const authUser = authUsersMap.get(userId);
      const existingProfile = profileMap.get(userId);
      const desiredEmail = authUser?.email || existingProfile?.email || '';
      const desiredName = existingProfile?.full_name?.trim() || authUser?.full_name || '';
      const desiredWhatsapp =
        existingProfile?.whatsapp?.trim() ||
        authUser?.whatsapp ||
        '';

      if (!existingProfile) {
        // Cria profile caso não exista
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: desiredEmail,
            full_name: desiredName || `Aluno ${userId.slice(0, 8)}`,
            whatsapp: desiredWhatsapp || null,
            onboarding_completed: false,
          })
          .select('*')
          .maybeSingle();
        if (!insertError && inserted) {
          profileMap.set(userId, inserted);
        }
      } else {
        const needsUpdate =
          (!existingProfile.email || existingProfile.email === 'sem-email') ||
          !existingProfile.full_name?.trim() ||
          existingProfile.full_name.startsWith('Usuário ') ||
          !existingProfile.whatsapp;
        if (needsUpdate) {
          const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if ((!existingProfile.email || existingProfile.email === 'sem-email') && desiredEmail) {
            updatePayload.email = desiredEmail;
          }
          if ((!existingProfile.full_name?.trim() || existingProfile.full_name.startsWith('Usuário ')) && desiredName) {
            updatePayload.full_name = desiredName;
          }
          if (!existingProfile.whatsapp && desiredWhatsapp) {
            updatePayload.whatsapp = desiredWhatsapp;
          }
          if (Object.keys(updatePayload).length > 1) {
            const { data: updated, error: updateError } = await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('user_id', userId)
              .select('*')
              .maybeSingle();
            if (!updateError && updated) {
              profileMap.set(userId, updated);
            }
          }
        }
      }
    }

    // 5. Agrupa enrollments por user_id
    const enrollmentsByUser: Record<string, any[]> = {};
    (enrollments || []).forEach(e => {
      if (!e.user_id) return;
      if (!enrollmentsByUser[e.user_id]) enrollmentsByUser[e.user_id] = [];
      enrollmentsByUser[e.user_id].push(e);
    });

    // 6. Monta lista de usuários
    const users = Array.from(allUserIds).map(userId => {
      const profile = profileMap.get(userId);
      const authUser = authUsersMap.get(userId);
      const userEnrollments = (enrollmentsByUser[userId] || []).map(e => ({
        id: e.id,
        course_id: e.course_id,
        progress: e.progress,
        status: e.status,
        exam_score: e.exam_score,
        created_at: e.created_at,
        course: { title: (e.courses as any)?.title || 'Curso' },
      }));

      const fullName =
        profile?.full_name?.trim() ||
        authUser?.full_name ||
        `Aluno ${userId.slice(0, 8)}`;
      const email = profile?.email || authUser?.email || 'sem-email';
      const whatsapp = profile?.whatsapp || authUser?.whatsapp || null;

      return {
        id: userId,
        user_id: userId,
        full_name: fullName,
        email,
        whatsapp,
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
