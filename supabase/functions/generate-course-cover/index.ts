import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoverRequest {
  title: string;
  theme?: string;
}

function buildPrompt(title: string, theme: string): string {
  return `Crie uma capa premium para o curso "${title}". Formato horizontal 16:9.

Represente visualmente o tema "${theme}" de forma clara, profissional e contemporânea. Use composição editorial/publicitária, fotografia realista ou elementos gráficos sofisticados adequados ao assunto, iluminação profissional, poucos elementos e excelente hierarquia visual.

Exiba somente o título "${title}", grande e perfeitamente legível, integrado ao design.

A imagem deve parecer criada por um designer profissional, não por IA. Evite visual genérico, excesso de 3D, brilhos, objetos aleatórios, composição poluída, textos extras, logos e marcas. Alta qualidade.`;
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
    const theme = (body.theme || title).trim();

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: buildPrompt(title, theme),
        size: "1536x1024",
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
