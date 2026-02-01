import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkCourseRequest {
  topic: string;
  categoryId?: string;
  autoCategory?: boolean;
  price?: number;
  autoPrice?: boolean;
  durationRange?: string; // "5-10", "10-20", "20-40", "60", "80"
  contentDepth?: string; // "basico", "detalhado", "extenso"
  openaiModel?: string; // "gpt-4o-mini" or "gpt-4o"
  additionalInstructions?: string;
}

// Tool schemas for structured output - will be updated dynamically with categories
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
          description: "Recommended number of modules based on duration: 5h=3 modules, 10h=4 modules, 20h=5 modules, 40h=7 modules, 60h=9 modules, 80h=12 modules. More hours = more modules for complete coverage."
        },
        suggestedCategory: {
          type: "string",
          enum: categoryNames,
          description: "The most appropriate category for this course based on its topic"
        },
        ...(includePrice ? {
          suggestedPrice: {
            type: "number",
            description: "Suggested price in BRL (Brazilian Reais). Consider: free (0) for basic intro courses, 29-49 for short beginner courses, 79-149 for intermediate courses, 199-399 for advanced/specialized courses, 499+ for comprehensive professional courses. Base on duration, complexity, and market value."
          }
        } : {}),
        reasoning: {
          type: "string",
          description: "Brief explanation of why this level, duration, category, and price were chosen"
        }
      },
      required: ["level", "duration", "moduleCount", "suggestedCategory", ...(includePrice ? ["suggestedPrice"] : []), "reasoning"]
    }
  }
});

const courseContentTool = {
  type: "function",
  function: {
    name: "create_course_content",
    description: "Create complete educational course content with EXTENSIVE teaching material. Each module MUST have minimum 1500-2000 words of comprehensive content.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Course title - clear and professional" },
        subtitle: { type: "string", description: "Catchy subtitle (max 150 chars)" },
        description: { type: "string", description: "Full course description (2-3 paragraphs)" },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Module title" },
              content: { type: "string", description: "EXTENSIVE educational content with MINIMUM 1500-2000 words. Include: detailed theory, multiple practical examples, real case studies, step-by-step tutorials, best practices, common mistakes, and exercises. Write like a complete textbook chapter." }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["title", "subtitle", "description", "modules"]
    }
  }
};

const exercisesTool = {
  type: "function",
  function: {
    name: "create_exercises",
    description: "Create practice exercises",
    parameters: {
      type: "object",
      properties: {
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correctAnswer: { type: "number" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      },
      required: ["exercises"]
    }
  }
};

const examTool = {
  type: "function",
  function: {
    name: "create_exam",
    description: "Create final exam questions",
    parameters: {
      type: "object",
      properties: {
        examQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correctAnswer: { type: "number" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      },
      required: ["examQuestions"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    // Determine which API to use based on model
    const lovableModels = ["google/gemini-2.5-pro", "google/gemini-2.5-flash", "google/gemini-3-flash-preview", "openai/gpt-5", "openai/gpt-5-mini"];
    const openaiDirectModels = ["gpt-4o-mini", "gpt-4o"];
    
    const useLovableAI = lovableModels.includes(openaiModel || "");
    const selectedModel = useLovableAI 
      ? openaiModel 
      : (openaiDirectModels.includes(openaiModel || "") ? openaiModel : "gpt-4o-mini");

    // Check required API keys
    if (useLovableAI && !LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured for Lovable AI models");
    }
    if (!useLovableAI && !OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const apiEndpoint = useLovableAI 
      ? "https://ai.gateway.lovable.dev/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const apiKey = useLovableAI ? LOVABLE_API_KEY : OPENAI_API_KEY;

    console.log("Bulk generating course with AI:", { topic, price, autoCategory, autoPrice, durationRange, contentDepth, model: selectedModel, provider: useLovableAI ? "Lovable AI" : "OpenAI Direct" });

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
        case "5-10":
          forcedDuration = 10;
          forcedModuleCount = 4;
          break;
        case "10-20":
          forcedDuration = 20;
          forcedModuleCount = 5;
          break;
        case "20-40":
          forcedDuration = 40;
          forcedModuleCount = 7;
          break;
        case "60":
          forcedDuration = 60;
          forcedModuleCount = 9;
          break;
        case "80":
          forcedDuration = 80;
          forcedModuleCount = 12;
          break;
      }
    }

    // Step 1: Analyze topic to determine level, duration, category, and optionally price
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
   - R$ 29-49: cursos curtos para iniciantes
   - R$ 79-149: cursos intermediários
   - R$ 199-399: cursos avançados/especializados
   - R$ 499+: cursos profissionais completos`;
    }

    analysisPrompt += `

TEMA: "${topic}"
${additionalInstructions ? `CONTEXTO ADICIONAL: ${additionalInstructions}` : ""}
${forcedDuration ? `\nIMPORTANTE: A duração DEVE ser ${forcedDuration} horas. O usuário escolheu essa carga horária.` : ""}

Considere:
- Temas básicos ou introdutórios = iniciante, 5-10h, 3-4 módulos
- Temas que requerem conhecimento prévio = intermediario, 20-40h, 5-7 módulos
- Temas especializados ou complexos = avancado, 40-80h, 7-12 módulos

REGRA DE MÓDULOS (muito importante):
- 5 horas = 3 módulos
- 10 horas = 4 módulos
- 20 horas = 5-6 módulos
- 40 horas = 7-8 módulos
- 60 horas = 9-10 módulos
- 80 horas = 11-12 módulos

REGRA DE PREÇOS (OBRIGATÓRIO seguir esta tabela):
- Cursos de 5-10 horas: R$ 9,90 a R$ 14,90
- Cursos de 10-20 horas: R$ 19,90 a R$ 29,90
- Cursos de 20-40 horas: R$ 39,90 a R$ 49,90
- Cursos de 60 horas: R$ 59,90 a R$ 69,90
- Cursos de 80 horas: R$ 89,90 a R$ 99,90
Use valores quebrados como 19.90, 29.90, 39.90, etc.`;

    const analysisResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em design instrucional. Analise o tema do curso e determine o nível de dificuldade apropriado, a carga horária recomendada e a categoria mais adequada baseado na complexidade e natureza do assunto." 
          },
          { 
            role: "user", 
            content: analysisPrompt
          },
        ],
        tools: [courseAnalysisTool],
        tool_choice: { type: "function", function: { name: "analyze_course_topic" } },
      }),
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
        // Default values if analysis fails
        analysis = { level: "iniciante", duration: 10, moduleCount: 4 };
      }
    } catch (e) {
      console.error("Failed to parse analysis:", e);
      analysis = { level: "iniciante", duration: 10, moduleCount: 4 };
    }

    console.log("Course analysis:", analysis);

    const { level, suggestedCategory, suggestedPrice } = analysis;
    
    // Use forced duration/moduleCount if provided, otherwise use AI suggestion
    const finalDuration = forcedDuration || analysis.duration || 10;
    const finalModuleCount = forcedModuleCount || analysis.moduleCount || Math.max(3, Math.min(12, Math.floor(finalDuration / 6) + 2));

    // Determine final category ID
    let finalCategoryId = categoryId;
    if (autoCategory && suggestedCategory && categories.length > 0) {
      const matchedCategory = categories.find(c => c.name === suggestedCategory);
      if (matchedCategory) {
        finalCategoryId = matchedCategory.id;
        console.log("AI suggested category:", suggestedCategory, "->", finalCategoryId);
      }
    }

    // Determine final price
    const finalPrice = autoPrice && suggestedPrice !== undefined ? suggestedPrice : (price || 0);
    console.log("Final price:", finalPrice, autoPrice ? "(AI suggested)" : "(manual)");
    console.log("Final duration:", finalDuration, forcedDuration ? "(user selected)" : "(AI suggested)");
    console.log("Final module count:", finalModuleCount);
    
    // Define content depth parameters
    // If contentDepth is 'auto' or not provided, AI decides based on course complexity
    let depth;
    if (contentDepth === 'auto' || !contentDepth) {
      // AI decides depth based on level and duration
      if (level === 'avancado' || finalDuration >= 60) {
        depth = { minWords: 2000, maxTokens: 16000, description: "extremamente completo como um livro didático profissional" };
      } else if (level === 'intermediario' || finalDuration >= 20) {
        depth = { minWords: 1000, maxTokens: 12000, description: "com bom nível de detalhes e exemplos" };
      } else {
        depth = { minWords: 500, maxTokens: 8000, description: "resumido e direto ao ponto" };
      }
      console.log("AI decided content depth based on level:", level, "duration:", finalDuration);
    } else {
      // BOTH gpt-4o-mini and gpt-4o have a max of 16384 OUTPUT tokens per request
      const depthConfig = {
        basico: { minWords: 500, maxTokens: 8000, description: "resumido e direto ao ponto" },
        detalhado: { minWords: 1000, maxTokens: 12000, description: "com bom nível de detalhes e exemplos" },
        extenso: { minWords: 2000, maxTokens: 16000, description: "extremamente completo como um livro didático profissional" },
        muito_extenso: { minWords: 3000, maxTokens: 16000, description: "altamente detalhado com teoria e prática aprofundadas" },
        profissional: { minWords: 4000, maxTokens: 16000, description: "conteúdo de nível profissional com cobertura completa" },
        enciclopedico: { minWords: 5000, maxTokens: 16000, description: "conteúdo enciclopédico com máximo nível de detalhamento" }
      };
      depth = depthConfig[contentDepth as keyof typeof depthConfig] || depthConfig.detalhado;
    }
    
    // Step 2: Generate course content
    const contentPrompt = `Você é um professor universitário renomado criando um curso online. O curso deve ser um material didático de alta qualidade.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${finalDuration} horas
NÚMERO DE MÓDULOS: ${finalModuleCount} (OBRIGATÓRIO - crie EXATAMENTE ${finalModuleCount} módulos)
PROFUNDIDADE DO CONTEÚDO: ${depth.description}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ""}

⚠️ REGRAS CRÍTICAS:

1. CADA MÓDULO DEVE TER NO MÍNIMO ${depth.minWords} PALAVRAS de conteúdo educacional real
2. NÃO ESCREVA frases como "Neste módulo vamos...", "Você aprenderá...", "Exploraremos..."
3. ESCREVA O CONTEÚDO COMPLETO como um capítulo de livro didático

ESTRUTURA PARA CADA MÓDULO:

## [Título do Tópico]

### Introdução e Contexto
- O QUE é, POR QUE é importante, COMO se aplica

### Fundamentos Teóricos
- Definições detalhadas, princípios, conceitos em profundidade

### Técnicas e Metodologias
- Passo a passo detalhado, quando usar, variações

### Exemplos Práticos
- Exemplos reais e detalhados com dados específicos

### Erros Comuns
- Lista de erros frequentes e como evitar

### Exercícios
- Perguntas para reflexão e atividades práticas

Use **negrito**, *itálico*, listas, tabelas.
IMPORTANTE: Crie EXATAMENTE ${finalModuleCount} módulos para ${finalDuration}h de curso.`;

    const contentResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade. Use a função fornecida para estruturar o curso." },
          { role: "user", content: contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
        max_tokens: depth.maxTokens,
      }),
    });

    if (!contentResponse.ok) {
      if (contentResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (contentResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate course content");
    }

    const contentData = await contentResponse.json();
    let courseContent;
    
    try {
      const toolCall = contentData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        courseContent = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error("No tool call in response");
      }
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Failed to parse AI response for course content");
    }

    console.log("Course content generated:", courseContent.title);

    // Step 3: Generate exercises
    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}". 
As questões devem testar a compreensão do conteúdo e ter níveis variados de dificuldade.`;

    const exercisesResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Crie exercícios de múltipla escolha concisos e diretos. Use a função fornecida." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
        max_tokens: 8000,
      }),
    });

    let exercises = { exercises: [] };
    if (exercisesResponse.ok) {
      try {
        const exercisesData = await exercisesResponse.json();
        const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          let argsStr = toolCall.function.arguments;
          // Try to fix truncated JSON by closing arrays/objects
          if (!argsStr.endsWith('}')) {
            // Find last complete exercise and close properly
            const lastCompleteExercise = argsStr.lastIndexOf('},');
            if (lastCompleteExercise > 0) {
              argsStr = argsStr.substring(0, lastCompleteExercise + 1) + ']}';
            } else {
              argsStr = '{"exercises":[]}';
            }
          }
          exercises = JSON.parse(argsStr);
        }
      } catch (e) {
        console.error("Failed to parse exercises:", e);
        exercises = { exercises: [] };
      }
    }

    console.log("Exercises generated:", exercises.exercises?.length || 0);

    // Step 4: Generate exam
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".`;

    const examResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
        max_tokens: 6000,
      }),
    });

    let exam = { examQuestions: [] };
    if (examResponse.ok) {
      try {
        const examData = await examResponse.json();
        const toolCall = examData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exam = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exam:", e);
      }
    }

    console.log("Exam generated:", exam.examQuestions?.length || 0);

    // Step 5: Save to database
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        short_description: courseContent.subtitle?.substring(0, 150),
        category_id: finalCategoryId || null,
        duration_hours: finalDuration,
        level: level,
        price: finalPrice,
        status: "active",
        content_pdf_url: JSON.stringify(courseContent.modules),
      })
      .select()
      .single();

    if (courseError) {
      console.error("Error creating course:", courseError);
      throw new Error("Failed to save course to database");
    }

    console.log("Course saved:", course.id);

    // Insert exercises
    if (exercises.exercises && exercises.exercises.length > 0) {
      const exercisesToInsert = exercises.exercises.map((ex: any, index: number) => ({
        course_id: course.id,
        question: ex.question,
        options: ex.options,
        correct_answer: ex.correctAnswer,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from("course_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error("Error inserting exercises:", exercisesError);
      }
    }

    // Insert exam questions
    if (exam.examQuestions && exam.examQuestions.length > 0) {
      const examQuestionsToInsert = exam.examQuestions.map((q: any, index: number) => ({
        course_id: course.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        order_index: index,
      }));

      const { error: examError } = await supabase
        .from("course_exams")
        .insert(examQuestionsToInsert);

      if (examError) {
        console.error("Error inserting exam questions:", examError);
      }
    }

    console.log("Bulk course generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          level: level,
          duration: finalDuration,
          category: suggestedCategory || null,
          price: finalPrice,
          exercisesCount: exercises.exercises?.length || 0,
          examQuestionsCount: exam.examQuestions?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-course-bulk function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
