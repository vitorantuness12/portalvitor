import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Vincula um aluno recém-cadastrado ao aluno que o indicou.
 * Só pode ser chamada pelo próprio usuário autenticado e apenas uma vez.
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
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim().toUpperCase();
    if (!code || code.length < 4 || code.length > 20) {
      return json({ error: "Código inválido" }, 400);
    }

    const userId = userData.user.id;

    // Já possui indicação registrada?
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();
    if (existing) return json({ success: true, alreadyRegistered: true });

    const { data: referrer } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();

    if (!referrer) return json({ error: "Código de indicação não encontrado" }, 404);
    if (referrer.user_id === userId) return json({ error: "Você não pode se indicar" }, 400);

    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: referrer.user_id,
      referred_id: userId,
      code,
      status: "pending",
    });

    if (insertError) {
      console.error("Erro ao registrar indicação:", insertError);
      return json({ error: "Não foi possível registrar a indicação" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("referral-register error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
