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
  return `Crie uma capa premium de curso online em formato horizontal 16:9 para o tema "${theme}".

DIREÇÃO VISUAL:
- Estética de thumbnail publicitária cinematográfica, moderna, intensa e profissional.
- Composição dividida e equilibrada: título ocupando aproximadamente 55% do lado esquerdo; cena temática ocupando aproximadamente 45% do lado direito.
- Fundo predominantemente preto ou grafite, com iluminação dramática e alto contraste.
- Paleta principal em laranja e dourado, com branco para contraste e pequenos acentos cromáticos coerentes com o tema.
- Fotografia realista e nítida de uma pessoa em contexto profissional ou educacional relacionado ao tema, acompanhada por poucos objetos que comuniquem imediatamente o assunto.
- Profundidade cinematográfica, recorte preciso, luz de contorno quente e acabamento editorial sofisticado.
- Use linhas, faixas ou pinceladas discretas apenas para organizar a hierarquia; preserve áreas de respiro.

TIPOGRAFIA E HIERARQUIA:
- Exiba SOMENTE o título exato "${title}", em português, sem alterar, resumir ou acrescentar palavras.
- Quebre o título em no máximo 3 ou 4 linhas bem equilibradas.
- Use letras grandes, fortes, condensadas e perfeitamente legíveis, combinando branco e dourado/laranja para destacar as palavras mais importantes.
- Garanta leitura imediata mesmo quando a capa estiver reduzida a uma miniatura pequena.
- Mantenha todo o texto dentro de uma margem segura, sem cortar letras nas bordas.

RESTRIÇÕES:
- Não inclua subtítulos, slogans, listas, etiquetas, selos, números, textos decorativos, marcas, logos ou marca-d'água.
- Não copie personagens, cenários ou identidade de outras marcas; use apenas a linguagem visual e a energia publicitária como referência.
- Evite texto ilegível, letras deformadas, mãos deformadas, excesso de elementos, aparência genérica, composição poluída, neon exagerado ou render 3D artificial.
- Não coloque informações importantes nos 5% externos da imagem.

Resultado final: uma capa de curso original, impactante e coerente com o tema, com qualidade de direção de arte profissional e pronta para uso como thumbnail 16:9.`;
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
