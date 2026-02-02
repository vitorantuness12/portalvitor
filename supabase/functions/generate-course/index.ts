import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseRequest {
  topic: string;
  level: string;
  duration: number;
  categoryId?: string;
  price?: number;
  contentDepth?: string;
  openaiModel?: string;
  additionalInstructions?: string;
  jobId?: string; // For processing existing job
  processJob?: boolean; // Flag to indicate job processing mode
}

// Tool schemas for structured output
const courseContentTool = {
  type: "function",
  function: {
    name: "create_course_content",
    description: "Create complete educational course content with extensive real teaching material. Each module MUST have comprehensive content with minimum 1500-2000 words.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Course title - clear and professional" },
        subtitle: { type: "string", description: "Catchy subtitle that complements the title and sparks interest (max 150 chars). Examples: 'Domine as técnicas essenciais', 'Do básico ao avançado na prática', 'Transforme sua carreira'" },
        description: { type: "string", description: "Full course description (2-3 paragraphs)" },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Module title" },
              content: { type: "string", description: "EXTENSIVE educational content with MINIMUM 1500-2000 words per module. Must include: detailed theoretical explanations, multiple practical examples with code/formulas/templates, real-world case studies, step-by-step tutorials, best practices, common mistakes to avoid, exercises, and reflection questions. Write like a complete textbook chapter - thorough, detailed, and comprehensive. DO NOT summarize or describe - TEACH EVERYTHING IN FULL DETAIL." }
            },
            required: ["title", "content"]
          },
          description: "Course modules (3-8 modules depending on course duration)"
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
    description: "Create practice exercises for the course",
    parameters: {
      type: "object",
      properties: {
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string", description: "Exercise question" },
              options: {
                type: "array",
                items: { type: "string" },
                description: "4 answer options"
              },
              correctAnswer: { type: "number", description: "Index of correct answer (0-3)" }
            },
            required: ["question", "options", "correctAnswer"]
          },
          description: "10 multiple choice exercises"
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
    description: "Create final exam questions for the course",
    parameters: {
      type: "object",
      properties: {
        examQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string", description: "Exam question" },
              options: {
                type: "array",
                items: { type: "string" },
                description: "4 answer options"
              },
              correctAnswer: { type: "number", description: "Index of correct answer (0-3)" }
            },
            required: ["question", "options", "correctAnswer"]
          },
          description: "15 multiple choice exam questions"
        }
      },
      required: ["examQuestions"]
    }
  }
};

// Process job in a dedicated function call (not background)
async function processJobGeneration(supabase: any, jobId: string) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const apiEndpoint = "https://api.openai.com/v1/chat/completions";

  try {
    // Fetch job details
    const { data: job, error: fetchError } = await supabase
      .from("course_generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Job não encontrado: ${jobId}`);
    }

    if (job.status === "completed") {
      return { success: true, message: "Job já foi processado", courseId: job.course_id };
    }

    if (job.status !== "pending" && job.status !== "processing") {
      throw new Error(`Job em status inválido: ${job.status}`);
    }

    const { topic, level, duration, category_id, price, content_depth, openai_model, additional_instructions } = job;
    const selectedModel = openai_model || "gpt-4o-mini";
    const isO1Model = selectedModel?.startsWith("o1") || selectedModel?.startsWith("o3");

    console.log("Processing job:", jobId, "model:", selectedModel);

    // Update job status to processing
    await supabase
      .from("course_generation_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // Generate content
    const moduleCount = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 40 ? 5 : duration <= 60 ? 6 : 8;
    
    const getDepthConfig = (model: string) => {
      const isHighTokenModel = model?.startsWith("o1") || model?.startsWith("o3");
      
      if (isHighTokenModel) {
        return {
          basico: { minWords: 500, maxTokens: 12000, description: "resumido e direto ao ponto" },
          detalhado: { minWords: 1500, maxTokens: 20000, description: "com bom nível de detalhes e exemplos" },
          extenso: { minWords: 3000, maxTokens: 35000, description: "extremamente completo como um livro didático profissional" },
          muito_extenso: { minWords: 5000, maxTokens: 50000, description: "altamente detalhado com teoria e prática aprofundadas" },
          profissional: { minWords: 7000, maxTokens: 65000, description: "conteúdo de nível profissional com cobertura completa" },
          enciclopedico: { minWords: 10000, maxTokens: 80000, description: "conteúdo enciclopédico com máximo nível de detalhamento" }
        };
      }
      
      return {
        basico: { minWords: 500, maxTokens: 8000, description: "resumido e direto ao ponto" },
        detalhado: { minWords: 1000, maxTokens: 12000, description: "com bom nível de detalhes e exemplos" },
        extenso: { minWords: 2000, maxTokens: 16000, description: "extremamente completo como um livro didático profissional" },
        muito_extenso: { minWords: 3000, maxTokens: 16000, description: "altamente detalhado com teoria e prática aprofundadas" },
        profissional: { minWords: 4000, maxTokens: 16000, description: "conteúdo de nível profissional com cobertura completa" },
        enciclopedico: { minWords: 5000, maxTokens: 16000, description: "conteúdo enciclopédico com máximo nível de detalhamento" }
      };
    };
    
    const depthConfig = getDepthConfig(selectedModel);
    const depth = depthConfig[content_depth as keyof typeof depthConfig] || depthConfig.detalhado;
    
    console.log("Using depth config:", depth);
    
    const antiTruncationNote = isO1Model ? `
⚠️ IMPORTANTE: Você tem tokens suficientes (${depth.maxTokens}) para gerar conteúdo COMPLETO.
NÃO adicione notas como "versão reduzida", "seria necessário detalhar", "em uma versão completa".
Gere o conteúdo COMPLETO e EXTENSO sem truncamento ou avisos de incompletude.
` : "";

    const contentPrompt = `Você é um professor universitário renomado criando um curso online. O curso deve ser um material didático de alta qualidade.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount}
PROFUNDIDADE DO CONTEÚDO: ${depth.description}
MÍNIMO DE PALAVRAS POR MÓDULO: ${depth.minWords}
${additional_instructions ? `INSTRUÇÕES ADICIONAIS: ${additional_instructions}` : ""}
${antiTruncationNote}

⚠️ REGRAS CRÍTICAS:

1. CADA MÓDULO DEVE TER NO MÍNIMO ${depth.minWords} PALAVRAS de conteúdo educacional real
2. NÃO ESCREVA frases como "Neste módulo vamos...", "Você aprenderá...", "Exploraremos..."
3. ESCREVA O CONTEÚDO COMPLETO como um capítulo de livro didático
4. NÃO adicione notas sobre "versão reduzida" ou "seria necessário detalhar mais"

ESTRUTURA PARA CADA MÓDULO:

## [Título do Tópico Principal]

### Introdução e Contexto
- Explique O QUE é o conceito, POR QUE é importante, COMO se aplica

### Fundamentos Teóricos
- Definições detalhadas, princípios e conceitos fundamentais
- Fórmulas, frameworks ou modelos quando aplicável

### Técnicas e Metodologias
- Passo a passo detalhado de cada técnica
- Quando usar cada abordagem

### Exemplos Práticos
- Exemplos reais com dados específicos
- Templates ou scripts quando aplicável

### Erros Comuns
- Lista de erros frequentes e como evitar

### Exercícios de Fixação
- Perguntas para reflexão

Use **negrito**, *itálico*, listas numeradas, tabelas. O aluno deve conseguir aprender tudo apenas lendo este conteúdo.`;

    const contentRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade. Nunca escreva apenas descrições do que será ensinado - escreva o conteúdo educacional completo. Use a função fornecida para estruturar o curso." }]),
        { role: "user", content: isO1Model ? `Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade. Nunca escreva apenas descrições do que será ensinado - escreva o conteúdo educacional completo.\n\n${contentPrompt}` : contentPrompt },
      ],
      tools: [courseContentTool],
      tool_choice: { type: "function", function: { name: "create_course_content" } },
    };
    
    if (isO1Model) {
      contentRequestBody.max_completion_tokens = depth.maxTokens;
    } else {
      contentRequestBody.max_tokens = depth.maxTokens;
    }

    console.log("Calling OpenAI for content generation...");
    const contentResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contentRequestBody),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("AI content error:", contentResponse.status, errorText);
      
      // Parse error for better user message
      let userFriendlyError = "Falha ao gerar conteúdo";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.code === "insufficient_quota") {
          userFriendlyError = "Créditos da API OpenAI esgotados. Verifique sua conta em platform.openai.com";
        } else if (errorJson.error?.message) {
          userFriendlyError = errorJson.error.message;
        }
      } catch (e) {
        userFriendlyError = errorText;
      }
      
      throw new Error(userFriendlyError);
    }

    const contentData = await contentResponse.json();
    let courseContent;
    
    // Function to clean LLM artifacts from content
    const cleanLLMContent = (text: string): string => {
      if (!text) return text;
      return text
        .replace(/\[CONTAGEM DE PALAVRAS APROX\.?:?\s*[\d.,]+\]/gi, "")
        .replace(/\[APPROXIMATE WORD COUNT:?\s*[\d.,]+\]/gi, "")
        .replace(/\[WORD COUNT:?\s*[\d.,]+\]/gi, "")
        .replace(/\[PALAVRAS:?\s*[\d.,]+\]/gi, "")
        .trim();
    };
    
    try {
      const toolCall = contentData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        courseContent = JSON.parse(toolCall.function.arguments);
      } else {
        const rawContent = contentData.choices[0].message.content || "";
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
        courseContent = JSON.parse(jsonMatch[1].trim());
      }
      
      // Clean all module contents
      if (courseContent.modules && Array.isArray(courseContent.modules)) {
        courseContent.modules = courseContent.modules.map((mod: any) => ({
          ...mod,
          title: cleanLLMContent(mod.title),
          content: cleanLLMContent(mod.content),
        }));
      }
      
      // Clean title and description too
      if (courseContent.title) courseContent.title = cleanLLMContent(courseContent.title);
      if (courseContent.subtitle) courseContent.subtitle = cleanLLMContent(courseContent.subtitle);
      if (courseContent.description) courseContent.description = cleanLLMContent(courseContent.description);
      
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Falha ao processar resposta da IA para conteúdo");
    }

    console.log("Course content generated:", courseContent.title);

    // Generate exercises
    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}". 
As questões devem testar a compreensão do conteúdo e ter níveis variados de dificuldade.`;

    const exercisesRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar exercícios." }]),
        { role: "user", content: isO1Model ? `Você é um especialista em avaliação educacional. Use a função fornecida para criar exercícios.\n\n${exercisesPrompt}` : exercisesPrompt },
      ],
      tools: [exercisesTool],
      tool_choice: { type: "function", function: { name: "create_exercises" } },
    };
    
    if (isO1Model) {
      exercisesRequestBody.max_completion_tokens = 4000;
    } else {
      exercisesRequestBody.max_tokens = 4000;
    }

    console.log("Calling OpenAI for exercises...");
    const exercisesResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exercisesRequestBody),
    });

    if (!exercisesResponse.ok) {
      console.error("AI exercises error:", exercisesResponse.status);
      throw new Error("Falha ao gerar exercícios");
    }

    const exercisesData = await exercisesResponse.json();
    let exercises;
    
    try {
      const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        exercises = JSON.parse(toolCall.function.arguments);
      } else {
        const rawExercises = exercisesData.choices[0].message.content || "";
        const jsonMatch = rawExercises.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExercises];
        exercises = JSON.parse(jsonMatch[1].trim());
      }
    } catch (e) {
      console.error("Failed to parse exercises:", e);
      throw new Error("Falha ao processar exercícios");
    }

    console.log("Exercises generated:", exercises.exercises?.length || 0);

    // Generate final exam
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".
A prova deve cobrir todos os módulos e ter questões de diferentes níveis de dificuldade.`;

    const examRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova." }]),
        { role: "user", content: isO1Model ? `Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova.\n\n${examPrompt}` : examPrompt },
      ],
      tools: [examTool],
      tool_choice: { type: "function", function: { name: "create_exam" } },
    };
    
    if (isO1Model) {
      examRequestBody.max_completion_tokens = 6000;
    } else {
      examRequestBody.max_tokens = 6000;
    }

    console.log("Calling OpenAI for exam...");
    const examResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(examRequestBody),
    });

    if (!examResponse.ok) {
      console.error("AI exam error:", examResponse.status);
      throw new Error("Falha ao gerar prova");
    }

    const examData = await examResponse.json();
    let exam;
    
    try {
      const toolCall = examData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        exam = JSON.parse(toolCall.function.arguments);
      } else {
        const rawExam = examData.choices[0].message.content || "";
        const jsonMatch = rawExam.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExam];
        exam = JSON.parse(jsonMatch[1].trim());
      }
    } catch (e) {
      console.error("Failed to parse exam:", e);
      throw new Error("Falha ao processar prova");
    }

    console.log("Exam generated:", exam.examQuestions?.length || 0);

    // Save to database
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        short_description: courseContent.subtitle,
        category_id: category_id || null,
        price: price || 0,
        duration_hours: duration,
        level: level,
        status: "active",
        content_pdf_url: JSON.stringify(courseContent.modules),
      })
      .select()
      .single();

    if (courseError) {
      console.error("Failed to save course:", courseError);
      throw new Error(`Falha ao salvar curso: ${courseError.message}`);
    }

    console.log("Course saved with ID:", courseData.id);

    // Save exercises
    if (exercises.exercises && exercises.exercises.length > 0) {
      const exercisesInsert = exercises.exercises.map((ex: any, index: number) => ({
        course_id: courseData.id,
        question: ex.question,
        options: ex.options,
        correct_answer: ex.correctAnswer,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from("course_exercises")
        .insert(exercisesInsert);

      if (exercisesError) {
        console.error("Failed to save exercises:", exercisesError);
      }
    }

    // Save exam
    if (exam.examQuestions && exam.examQuestions.length > 0) {
      const examInsert = exam.examQuestions.map((q: any, index: number) => ({
        course_id: courseData.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        order_index: index,
      }));

      const { error: examError } = await supabase
        .from("course_exams")
        .insert(examInsert);

      if (examError) {
        console.error("Failed to save exam:", examError);
      }
    }

    // Update job as completed
    await supabase
      .from("course_generation_jobs")
      .update({ 
        status: "completed",
        course_id: courseData.id,
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);

    console.log("Job completed successfully:", jobId, "-> Course:", courseData.id);

    return {
      success: true,
      courseId: courseData.id,
      course: courseData
    };

  } catch (error: any) {
    console.error("Job processing failed:", error);
    
    // Update job as failed
    await supabase
      .from("course_generation_jobs")
      .update({ 
        status: "failed",
        error_message: error.message || "Erro desconhecido",
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);

    throw error;
  }
}

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

    const body: CourseRequest = await req.json();
    const { topic, level, duration, categoryId, price, contentDepth, openaiModel, additionalInstructions, jobId, processJob } = body;

    // Mode 1: Process existing job (called by frontend polling or cron)
    if (processJob && jobId) {
      console.log("Processing existing job:", jobId);
      
      const result = await processJobGeneration(supabase, jobId);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode 2: Create new course (requires auth)
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

    const validModels = ["gpt-4o-mini", "gpt-4o", "o1", "o1-mini", "o3-mini"];
    const selectedModel = validModels.includes(openaiModel || "") ? openaiModel : "gpt-4o-mini";
    const isO1Model = selectedModel?.startsWith("o1") || selectedModel?.startsWith("o3");

    console.log("Request received:", { topic, level, duration, price, contentDepth, model: selectedModel });

    // For O1/O3 models, create job and let frontend trigger processing
    if (isO1Model) {
      // Create a job record
      const { data: job, error: jobError } = await supabase
        .from("course_generation_jobs")
        .insert({
          user_id: user.id,
          topic,
          level,
          duration,
          category_id: categoryId || null,
          price: price || 0,
          content_depth: contentDepth || "detalhado",
          openai_model: selectedModel,
          additional_instructions: additionalInstructions,
          status: "pending"
        })
        .select()
        .single();

      if (jobError) {
        console.error("Failed to create job:", jobError);
        throw new Error("Falha ao criar job de geração");
      }

      console.log("Job created:", job.id, "- Frontend will trigger processing");

      // Return job ID - frontend will call back to process
      return new Response(
        JSON.stringify({
          success: true,
          async: true,
          jobId: job.id,
          message: "Job criado. O frontend iniciará o processamento.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For GPT-4o models, process synchronously (faster, no timeout issues)
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";

    console.log("Generating course synchronously with GPT-4o model");

    // Generate course content
    const moduleCount = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 40 ? 5 : duration <= 60 ? 6 : 8;
    
    const depthConfig = {
      basico: { minWords: 500, maxTokens: 8000, description: "resumido e direto ao ponto" },
      detalhado: { minWords: 1000, maxTokens: 12000, description: "com bom nível de detalhes e exemplos" },
      extenso: { minWords: 2000, maxTokens: 16000, description: "extremamente completo como um livro didático profissional" },
      muito_extenso: { minWords: 3000, maxTokens: 16000, description: "altamente detalhado com teoria e prática aprofundadas" },
      profissional: { minWords: 4000, maxTokens: 16000, description: "conteúdo de nível profissional com cobertura completa" },
      enciclopedico: { minWords: 5000, maxTokens: 16000, description: "conteúdo enciclopédico com máximo nível de detalhamento" }
    };
    
    const depth = depthConfig[contentDepth as keyof typeof depthConfig] || depthConfig.detalhado;

    const contentPrompt = `Você é um professor universitário renomado criando um curso online. O curso deve ser um material didático de alta qualidade.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount}
PROFUNDIDADE DO CONTEÚDO: ${depth.description}
MÍNIMO DE PALAVRAS POR MÓDULO: ${depth.minWords}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ""}

⚠️ REGRAS CRÍTICAS:

1. CADA MÓDULO DEVE TER NO MÍNIMO ${depth.minWords} PALAVRAS de conteúdo educacional real
2. NÃO ESCREVA frases como "Neste módulo vamos...", "Você aprenderá...", "Exploraremos..."
3. ESCREVA O CONTEÚDO COMPLETO como um capítulo de livro didático

ESTRUTURA PARA CADA MÓDULO:

## [Título do Tópico Principal]

### Introdução e Contexto
### Fundamentos Teóricos
### Técnicas e Metodologias
### Exemplos Práticos
### Erros Comuns
### Exercícios de Fixação

Use **negrito**, *itálico*, listas numeradas, tabelas.`;

    const contentResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade." },
          { role: "user", content: contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
        max_tokens: depth.maxTokens,
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("AI content generation error:", contentResponse.status, errorText);
      throw new Error("Falha ao gerar conteúdo do curso: " + errorText);
    }

    const contentData = await contentResponse.json();
    let courseContent;
    
    // Function to clean LLM artifacts from content
    const cleanLLMContent = (text: string): string => {
      if (!text) return text;
      return text
        .replace(/\[CONTAGEM DE PALAVRAS APROX\.?:?\s*[\d.,]+\]/gi, "")
        .replace(/\[APPROXIMATE WORD COUNT:?\s*[\d.,]+\]/gi, "")
        .replace(/\[WORD COUNT:?\s*[\d.,]+\]/gi, "")
        .replace(/\[PALAVRAS:?\s*[\d.,]+\]/gi, "")
        .trim();
    };
    
    try {
      const toolCall = contentData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        courseContent = JSON.parse(toolCall.function.arguments);
      } else {
        const rawContent = contentData.choices[0].message.content || "";
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
        courseContent = JSON.parse(jsonMatch[1].trim());
      }
      
      // Clean all module contents
      if (courseContent.modules && Array.isArray(courseContent.modules)) {
        courseContent.modules = courseContent.modules.map((mod: any) => ({
          ...mod,
          title: cleanLLMContent(mod.title),
          content: cleanLLMContent(mod.content),
        }));
      }
      
      // Clean title and description too
      if (courseContent.title) courseContent.title = cleanLLMContent(courseContent.title);
      if (courseContent.subtitle) courseContent.subtitle = cleanLLMContent(courseContent.subtitle);
      if (courseContent.description) courseContent.description = cleanLLMContent(courseContent.description);
      
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Failed to parse AI response for course content");
    }

    console.log("Course content generated:", courseContent.title);

    // Generate exercises
    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".`;

    const exercisesResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
        max_tokens: 4000,
      }),
    });

    if (!exercisesResponse.ok) {
      throw new Error("Failed to generate exercises");
    }

    const exercisesData = await exercisesResponse.json();
    let exercises;
    
    try {
      const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        exercises = JSON.parse(toolCall.function.arguments);
      } else {
        const rawExercises = exercisesData.choices[0].message.content || "";
        const jsonMatch = rawExercises.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExercises];
        exercises = JSON.parse(jsonMatch[1].trim());
      }
    } catch (e) {
      console.error("Failed to parse exercises:", e);
      throw new Error("Failed to parse AI response for exercises");
    }

    // Generate exam
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}".`;

    const examResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
        max_tokens: 6000,
      }),
    });

    if (!examResponse.ok) {
      throw new Error("Failed to generate exam");
    }

    const examData = await examResponse.json();
    let exam;
    
    try {
      const toolCall = examData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        exam = JSON.parse(toolCall.function.arguments);
      } else {
        const rawExam = examData.choices[0].message.content || "";
        const jsonMatch = rawExam.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExam];
        exam = JSON.parse(jsonMatch[1].trim());
      }
    } catch (e) {
      console.error("Failed to parse exam:", e);
      throw new Error("Failed to parse AI response for exam");
    }

    // Save to database
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        short_description: courseContent.subtitle,
        category_id: categoryId || null,
        price: price || 0,
        duration_hours: duration,
        level: level,
        status: "active",
        content_pdf_url: JSON.stringify(courseContent.modules),
      })
      .select()
      .single();

    if (courseError) {
      console.error("Failed to save course:", courseError);
      throw new Error(`Failed to save course: ${courseError.message}`);
    }

    // Save exercises
    if (exercises.exercises && exercises.exercises.length > 0) {
      const exercisesInsert = exercises.exercises.map((ex: any, index: number) => ({
        course_id: courseData.id,
        question: ex.question,
        options: ex.options,
        correct_answer: ex.correctAnswer,
        order_index: index,
      }));

      await supabase.from("course_exercises").insert(exercisesInsert);
    }

    // Save exam
    if (exam.examQuestions && exam.examQuestions.length > 0) {
      const examInsert = exam.examQuestions.map((q: any, index: number) => ({
        course_id: courseData.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        order_index: index,
      }));

      await supabase.from("course_exams").insert(examInsert);
    }

    console.log("Course created successfully:", courseData.id);

    return new Response(
      JSON.stringify({
        success: true,
        async: false,
        course: courseData,
        message: "Curso criado com sucesso!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in generate-course:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
