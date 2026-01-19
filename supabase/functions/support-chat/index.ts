import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase client to fetch courses for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active courses for context
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, description, short_description, duration_hours, level, price")
      .eq("status", "active")
      .limit(20);

    const coursesContext = courses?.map(c => 
      `- ${c.title}: ${c.short_description || c.description?.substring(0, 200)}. Duração: ${c.duration_hours}h. Nível: ${c.level}. Preço: R$ ${c.price}`
    ).join("\n") || "Nenhum curso disponível no momento.";

    const systemPrompt = `Você é um assistente de suporte da Formak, plataforma de cursos online. Seja sempre educado, prestativo e objetivo.

Informações sobre a plataforma:
- Os alunos podem se matricular em cursos, estudar o conteúdo, fazer exercícios e provas
- Após aprovação na prova (nota mínima 7.0), o aluno recebe um certificado
- Os alunos podem acessar seus cursos na área "Meus Cursos"
- O progresso é salvo automaticamente
- Notas pessoais podem ser criadas durante o estudo

Cursos disponíveis na plataforma:
${coursesContext}

Instruções:
1. Responda dúvidas sobre os cursos e a plataforma de forma clara e objetiva
2. Se o aluno tiver problemas técnicos complexos ou precisar de ajuda que você não consegue resolver, sugira que ele solicite atendimento humano
3. Seja sempre cordial e profissional
4. Responda em português brasileiro

Se o aluno quiser falar com um atendente humano ou se você não conseguir ajudá-lo, diga exatamente: "Entendo. Vou transferir você para um atendente humano. Clique no botão 'Falar com Humano' para abrir um ticket de suporte."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao processar sua mensagem");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
