import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Troca um prêmio de indicação por matrícula gratuita em um curso.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const courseId = String(body?.courseId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) return json({ error: "Curso inválido" }, 400);

    const { data: course } = await supabase
      .from("courses")
      .select("id, title, status")
      .eq("id", courseId)
      .maybeSingle();
    if (!course || course.status !== "active") return json({ error: "Curso indisponível" }, 400);

    const { data: alreadyEnrolled } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (alreadyEnrolled) return json({ error: "Você já tem acesso a este curso" }, 400);

    const nowIso = new Date().toISOString();
    const { data: reward } = await supabase
      .from("referral_rewards")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("status", "available")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!reward) return json({ error: "Você não possui cursos grátis disponíveis" }, 400);
    if (reward.expires_at && reward.expires_at < nowIso) {
      await supabase.from("referral_rewards").update({ status: "expired" }).eq("id", reward.id);
      return json({ error: "Seu prêmio expirou" }, 400);
    }

    // Consome o prêmio primeiro (evita uso duplicado em chamadas simultâneas)
    const { data: consumed, error: consumeError } = await supabase
      .from("referral_rewards")
      .update({ status: "used", used_course_id: courseId, used_at: nowIso })
      .eq("id", reward.id)
      .eq("status", "available")
      .select("id")
      .maybeSingle();

    if (consumeError || !consumed) return json({ error: "Prêmio indisponível" }, 400);

    const { error: enrollError } = await supabase.from("enrollments").insert({
      user_id: userId,
      course_id: courseId,
      status: "in_progress",
      progress: 0,
    });

    if (enrollError) {
      // Devolve o prêmio se a matrícula falhar
      await supabase
        .from("referral_rewards")
        .update({ status: "available", used_course_id: null, used_at: null })
        .eq("id", reward.id);
      console.error("Erro ao matricular com prêmio:", enrollError);
      return json({ error: "Não foi possível liberar o curso" }, 500);
    }

    return json({ success: true, courseTitle: course.title });
  } catch (error) {
    console.error("redeem-referral-reward error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
