import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicsRequest {
  categoryName: string;
  categoryDescription?: string;
  quantity: number;
  level?: 'all' | 'iniciante' | 'intermediario' | 'avancado';
  existingTopics?: string[];
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

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Acesso negado. Somente administradores podem gerar temas.");
    }

    // Parse request body
    const { categoryName, categoryDescription, quantity, level = 'all', existingTopics = [] }: TopicsRequest = await req.json();

    if (!categoryName || !quantity) {
      throw new Error("Categoria e quantidade são obrigatórios");
    }

    const validQuantities = [10, 20, 30, 40];
    if (!validQuantities.includes(quantity)) {
      throw new Error("Quantidade deve ser 10, 20, 30 ou 40");
    }

    console.log(`Generating ${quantity} topics for category: ${categoryName}, level: ${level}, existing topics to avoid: ${existingTopics.length}`);

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Build level instruction
    const levelInstructions: Record<string, string> = {
      all: "Misture temas para iniciantes, intermediários e avançados de forma equilibrada.",
      iniciante: "TODOS os temas devem ser para INICIANTES - pessoas sem conhecimento prévio na área. Foque em conceitos básicos, introduções, fundamentos e primeiros passos.",
      intermediario: "TODOS os temas devem ser para nível INTERMEDIÁRIO - pessoas que já têm conhecimento básico. Foque em aprofundamento, técnicas mais elaboradas e aplicações práticas.",
      avancado: "TODOS os temas devem ser para nível AVANÇADO - profissionais experientes. Foque em especializações, técnicas avançadas, otimizações e temas de alta complexidade.",
    };

    const levelInstruction = levelInstructions[level] || levelInstructions.all;

    // Build existing topics instruction
    let existingTopicsInstruction = "";
    if (existingTopics.length > 0) {
      existingTopicsInstruction = `

ATENÇÃO - NÃO GERE NENHUM DESTES TEMAS (já existem cursos com estes títulos ou títulos similares):
${existingTopics.slice(0, 100).map(t => `- ${t}`).join('\n')}

Os temas gerados devem ser COMPLETAMENTE DIFERENTES dos listados acima. Não use títulos iguais, parecidos ou variações desses temas.`;
    }

    const prompt = `Você é um especialista em criação de cursos online. Gere exatamente ${quantity} ideias de temas para cursos na categoria "${categoryName}"${categoryDescription ? ` (${categoryDescription})` : ""}.

Regras importantes:
- Os temas devem ser específicos, práticos e comercializáveis
- Evite temas muito genéricos ou amplos demais
- Cada tema deve ser único e diferente dos outros
- Os temas devem ter potencial de atrair alunos
- Considere tendências atuais do mercado
- Inclua temas práticos e teóricos

IMPORTANTE - Sobre o nível dos temas:
${levelInstruction}
${existingTopicsInstruction}

Retorne APENAS um array JSON com exatamente ${quantity} objetos. Cada objeto deve ter:
- "topic": o nome do tema do curso
- "level": o nível do tema ("iniciante", "intermediario" ou "avancado")

Exemplo de formato:
[{"topic": "Introdução ao Excel", "level": "iniciante"}, {"topic": "Dashboards Avançados", "level": "avancado"}]

Não inclua numeração, explicações ou texto adicional. Apenas o array JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em criar temas para cursos online. Sempre responda apenas com um array JSON válido de objetos contendo topic e level.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("Raw AI response:", content);

    // Parse the JSON array from the response
    interface TopicItem {
      topic: string;
      level: string;
    }
    
    let topics: TopicItem[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Handle both old format (array of strings) and new format (array of objects)
        if (typeof parsed[0] === 'string') {
          // Old format - convert to new format with default level
          topics = parsed.map((t: string) => ({ topic: t, level: level === 'all' ? 'intermediario' : level }));
        } else {
          topics = parsed;
        }
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      throw new Error("Erro ao processar resposta da IA");
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("Nenhum tema foi gerado");
    }

    console.log(`Generated ${topics.length} topics successfully`);

    return new Response(
      JSON.stringify({ topics, count: topics.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating topics:", error);
    
    let statusCode = 500;
    if (error.message.includes("Acesso negado")) {
      statusCode = 403;
    } else if (error.message.includes("não autenticado")) {
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  }
});
