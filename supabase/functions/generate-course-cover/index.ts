import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoverRequest {
  title: string;
}

const COMPOSITION_VARIANTS = [
  "large title on the left, active subject on the right",
  "active subject on the left, large title on the right",
  "dynamic diagonal split between typography and scene",
  "central subject with the title integrated into the composition",
  "iconic topic-related object with typography as the dominant element",
  "full-screen cinematic environment with an overlaid title",
  "technology concept combining a person and a clean interface without readable UI text",
  "premium editorial composition with bold graphic rhythm",
  "cinematic close-up with strong foreground and background separation",
  "wide perspective showing a realistic professional environment",
] as const;

function chooseCompositionVariant(): string {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % COMPOSITION_VARIANTS.length;
  return `${index + 1}: ${COMPOSITION_VARIANTS[index]}`;
}

function buildPrompt(title: string, compositionVariant: string): string {
  return `Create a premium cinematic 16:9 course cover for the Brazilian course:
"${title}"

Infer the subject, profession, environment and visual concept directly from the title. Create a striking, clearly relevant scene with realistic commercial photography or premium cinematic rendering, professional lighting, depth, high contrast and sophisticated advertising art direction. People, when appropriate, must be diverse and actively performing something related to the course.

Integrate ONLY the exact Portuguese title. Identify its 2–3 most important words and make them dominant through scale, weight, contrast and restrained professional graphic treatment. Keep every word exact, highly legible at thumbnail size and inside safe margins.

Composition variant ${compositionVariant}. Choose a distinct subject-appropriate palette, perspective, typography and lighting so the result does not resemble a repeated template.

No extra text, random words on objects or screens, subtitles, slogans, teacher or platform names, fake logos, brands, watermarks, clutter, malformed lettering, cheap templates or generic stock-photo appearance.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Acesso negado. Somente administradores podem gerar capas.");
    }

    const body = (await req.json()) as CoverRequest;
    const title = (body.title || "").trim();
    if (!title) {
      throw new Error("O título do curso é obrigatório");
    }
    const compositionVariant = chooseCompositionVariant();

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: buildPrompt(title, compositionVariant),
        size: "1280x720",
        quality: "high",
        n: 1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Erro OpenAI:", response.status, errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Falha ao gerar a capa (${response.status}). ${errText.slice(0, 300)}`,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await response.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("A resposta não retornou nenhuma imagem");
    }

    return new Response(JSON.stringify({ success: true, image: b64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("generate-course-cover:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
