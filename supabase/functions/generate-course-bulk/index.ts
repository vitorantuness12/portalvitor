import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BulkCourseRequest {
  topic: string;
  categoryId?: string;
  autoCategory?: boolean;
  price?: number;
  autoPrice?: boolean;
  durationRange?: string;
  contentDepth?: string;
  openaiModel?: string;
  additionalInstructions?: string;
}

// Tool schema for analysis
const createCourseAnalysisTool = (categoryNames: string[], includePrice: boolean) => ({
  type: "function",
  function: {
    name: "analyze_course_topic",
    description: "Analyze a course topic and determine the appropriate level, duration, category, and price",
    parameters: {
      type: "object",
      properties: {
        level: { 
          type: "string", 
          enum: ["iniciante", "intermediario", "avancado"],
          description: "Course difficulty level based on topic complexity" 
        },
        duration: { 
          type: "number", 
          description: "Recommended course duration in hours (5, 10, 20, 40, 60, or 80)" 
        },
        moduleCount: {
          type: "number",
          description: "Recommended number of modules based on duration: 5h=3, 10h=4, 20h=5, 40h=7, 60h=9, 80h=12"
        },
        suggestedCategory: {
          type: "string",
          enum: categoryNames,
          description: "The most appropriate category for this course"
        },
        ...(includePrice ? {
          suggestedPrice: {
            type: "number",
            description: "Suggested price in BRL following pricing rules"
          }
        } : {}),
        reasoning: {
          type: "string",
          description: "Brief explanation of choices"
        }
      },
      required: ["level", "duration", "moduleCount", "suggestedCategory", ...(includePrice ? ["suggestedPrice"] : []), "reasoning"]
    }
  }
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, categoryId, autoCategory, price, autoPrice, durationRange, contentDepth, openaiModel, additionalInstructions }: BulkCourseRequest = await req.json();

    const validModels = ["gpt-4o-mini", "gpt-4o", "o1", "o1-mini", "o3-mini"];
    const selectedModel = validModels.includes(openaiModel || "") ? openaiModel : "gpt-4o-mini";
    const isO1Model = selectedModel?.startsWith("o1") || selectedModel?.startsWith("o3");

    const apiEndpoint = "https://api.openai.com/v1/chat/completions";

    console.log("Bulk analyzing course:", { topic, autoCategory, autoPrice, durationRange, contentDepth, model: selectedModel });

    // Fetch categories if auto-category is enabled
    let categories: { id: string; name: string }[] = [];
    if (autoCategory) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      categories = catData || [];
    }

    const categoryNames = categories.map(c => c.name);
    const courseAnalysisTool = createCourseAnalysisTool(
      categoryNames.length > 0 ? categoryNames : ["Geral"],
      autoPrice || false
    );

    // Calculate duration and modules based on durationRange if provided
    let forcedDuration: number | null = null;
    let forcedModuleCount: number | null = null;
    
    if (durationRange) {
      switch (durationRange) {
        case "5-10": forcedDuration = 10; forcedModuleCount = 4; break;
        case "10-20": forcedDuration = 20; forcedModuleCount = 5; break;
        case "20-40": forcedDuration = 40; forcedModuleCount = 7; break;
        case "60": forcedDuration = 60; forcedModuleCount = 9; break;
        case "80": forcedDuration = 80; forcedModuleCount = 12; break;
      }
    }

    // Step 1: Analyze topic (quick call)
    let analysisPrompt = `Analise este tema de curso e determine:
1. O nível (iniciante, intermediario ou avancado)`;
    
    if (!forcedDuration) {
      analysisPrompt += `\n2. A carga horária apropriada (5, 10, 20, 40, 60 ou 80 horas)`;
    } else {
      analysisPrompt += `\n2. A carga horária DEVE ser ${forcedDuration} horas (já definida pelo usuário)`;
    }
    
    if (autoCategory && categoryNames.length > 0) {
      analysisPrompt += `\n3. A categoria mais apropriada dentre: ${categoryNames.join(", ")}`;
    }
    
    if (autoPrice) {
      analysisPrompt += `\n${autoCategory ? '4' : '3'}. O preço sugerido em Reais (R$) considerando:
   - Gratuito (0): cursos introdutórios básicos
   - R$ 9,90-14,90: cursos de 5-10 horas
   - R$ 19,90-29,90: cursos de 10-20 horas
   - R$ 39,90-49,90: cursos de 20-40 horas
   - R$ 59,90-69,90: cursos de 60 horas
   - R$ 89,90-99,90: cursos de 80 horas`;
    }

    analysisPrompt += `

TEMA: "${topic}"
${additionalInstructions ? `CONTEXTO ADICIONAL: ${additionalInstructions}` : ""}
${forcedDuration ? `\nIMPORTANTE: A duração DEVE ser ${forcedDuration} horas.` : ""}

REGRA DE MÓDULOS:
- 5 horas = 3 módulos
- 10 horas = 4 módulos
- 20 horas = 5-6 módulos
- 40 horas = 7-8 módulos
- 60 horas = 9-10 módulos
- 80 horas = 11-12 módulos`;

    const analysisRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em design instrucional." }]),
        { role: "user", content: isO1Model ? `Você é um especialista em design instrucional.\n\n${analysisPrompt}` : analysisPrompt },
      ],
      tools: [courseAnalysisTool],
      tool_choice: { type: "function", function: { name: "analyze_course_topic" } },
    };

    if (isO1Model) {
      analysisRequestBody.max_completion_tokens = 2000;
    } else {
      analysisRequestBody.max_tokens = 2000;
    }

    const analysisResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(analysisRequestBody),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errorText);
      if (analysisResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to analyze course topic");
    }

    const analysisData = await analysisResponse.json();
    let analysis;
    
    try {
      const toolCall = analysisData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        analysis = { level: "iniciante", duration: 10, moduleCount: 4 };
      }
    } catch (e) {
      console.error("Failed to parse analysis:", e);
      analysis = { level: "iniciante", duration: 10, moduleCount: 4 };
    }

    console.log("Course analysis:", analysis);

    const { level, suggestedCategory, suggestedPrice } = analysis;
    const finalDuration = forcedDuration || analysis.duration || 10;
    const finalModuleCount = forcedModuleCount || analysis.moduleCount || Math.max(3, Math.min(12, Math.floor(finalDuration / 6) + 2));

    // Determine final category ID
    let finalCategoryId = categoryId;
    let finalCategoryName = suggestedCategory || null;
    if (autoCategory && suggestedCategory && categories.length > 0) {
      const matchedCategory = categories.find(c => c.name === suggestedCategory);
      if (matchedCategory) {
        finalCategoryId = matchedCategory.id;
        finalCategoryName = matchedCategory.name;
      }
    }

    const finalPrice = autoPrice && suggestedPrice !== undefined ? suggestedPrice : (price || 0);

    console.log("Analysis complete:", { level, finalDuration, finalCategoryId, finalCategoryName, finalPrice });

    // Step 2: Create a job in course_generation_jobs with resolved params
    const { data: job, error: jobError } = await supabase
      .from("course_generation_jobs")
      .insert({
        user_id: user.id,
        topic,
        level,
        duration: finalDuration,
        category_id: finalCategoryId || null,
        price: finalPrice,
        content_depth: contentDepth || "detalhado",
        openai_model: selectedModel,
        additional_instructions: additionalInstructions,
        status: "pending",
        progress_detail: "Análise concluída, aguardando processamento..."
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job:", jobError);
      throw new Error("Falha ao criar job de geração");
    }

    console.log("Job created:", job.id, "for topic:", topic);

    // Return the job info + analysis results so frontend can show them
    return new Response(
      JSON.stringify({
        success: true,
        async: true,
        jobId: job.id,
        analysis: {
          level,
          duration: finalDuration,
          moduleCount: finalModuleCount,
          category: finalCategoryName,
          price: finalPrice,
          reasoning: analysis.reasoning,
        },
        message: "Análise concluída. Job criado para processamento.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in generate-course-bulk:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
