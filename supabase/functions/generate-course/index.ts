import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  jobId?: string;
  processJob?: boolean;
}

// Tool schemas for structured output
const courseStructureTool = {
  type: "function",
  function: {
    name: "create_course_structure",
    description: "Create course structure with title, description, and module outlines (without full content yet)",
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
              outline: { type: "string", description: "Brief outline of what the module will cover (2-3 sentences)" }
            },
            required: ["title", "outline"]
          },
          description: "Module titles and outlines"
        }
      },
      required: ["title", "subtitle", "description", "modules"]
    }
  }
};

const singleModuleTool = {
  type: "function",
  function: {
    name: "create_module_content",
    description: "Create complete educational content for a single module",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Module title" },
        content: { type: "string", description: "Complete educational content with detailed explanations, examples, exercises" }
      },
      required: ["title", "content"]
    }
  }
};

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

// Function to clean LLM artifacts from content
const cleanLLMContent = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\[CONTAGEM DE PALAVRAS APROX\.?:?\s*[\d.,]+\]/gi, "")
    .replace(/\[APPROXIMATE WORD COUNT:?\s*[\d.,]+\]/gi, "")
    .replace(/\[WORD COUNT:?\s*[\d.,]+\]/gi, "")
    .replace(/\[PALAVRAS:?\s*[\d.,]+\]/gi, "")
    .replace(/CONTEÚDO DO MÓDULO \d+ COM MÍNIMO DE \d+\.?\d* PALAVRAS[^\]]*\]/gi, "")
    .replace(/\[CONTEÚDO DO MÓDULO \d+[^\]]*\]/gi, "")
    .replace(/\[INSERIR CONTEÚDO[^\]]*\]/gi, "")
    .replace(/\[CONTEÚDO SERÁ ADICIONADO[^\]]*\]/gi, "")
    .trim();
};

// Placeholder detection patterns
const placeholderPatterns = [
  /CONTEÚDO DO MÓDULO \d+ COM MÍNIMO/i,
  /MODULE \d+ CONTENT WITH MINIMUM/i,
  /\[INSERIR CONTEÚDO\]/i,
  /\[CONTEÚDO SERÁ ADICIONADO\]/i,
  /^\s*\[.*PLACEHOLDER.*\]\s*$/i,
  /ESTE MÓDULO ABORDARÁ/i,
  /NESTE MÓDULO SERÃO APRESENTADOS/i,
];

function hasPlaceholder(content: string): boolean {
  if (!content || content.length < 500) return true;
  return placeholderPatterns.some(pattern => pattern.test(content));
}

// Check if we need sequential generation
function needsSequentialGeneration(model: string, contentDepth: string, moduleCount: number): boolean {
  const isO1Model = model?.startsWith("o1") || model?.startsWith("o3");
  const deepDepths = ["muito_extenso", "profissional", "enciclopedico"];
  return isO1Model && (deepDepths.includes(contentDepth) || moduleCount >= 5);
}

// Update job progress detail
async function updateJobProgress(supabase: any, jobId: string, progressDetail: string) {
  console.log(`Job ${jobId}: ${progressDetail}`);
  await supabase
    .from("course_generation_jobs")
    .update({ 
      progress_detail: progressDetail,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);
}

// Generate single module content
async function generateSingleModule(
  apiKey: string,
  model: string,
  courseTopic: string,
  courseTitle: string,
  moduleTitle: string,
  moduleOutline: string,
  moduleIndex: number,
  totalModules: number,
  minWords: number,
  maxTokens: number,
  previousModulesSummary: string
): Promise<{ title: string; content: string }> {
  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const isO1Model = model?.startsWith("o1") || model?.startsWith("o3");

  const modulePrompt = `Você é um professor universitário escrevendo um capítulo de livro didático.

CURSO: "${courseTitle}"
TEMA GERAL: "${courseTopic}"
MÓDULO ${moduleIndex + 1} DE ${totalModules}: "${moduleTitle}"
RESUMO DO MÓDULO: ${moduleOutline}

${previousModulesSummary ? `CONTEXTO DOS MÓDULOS ANTERIORES:\n${previousModulesSummary}\n` : ""}

⚠️ REQUISITOS OBRIGATÓRIOS:
- ESCREVA NO MÍNIMO ${minWords} PALAVRAS de conteúdo educacional COMPLETO
- NÃO escreva placeholders como "conteúdo será adicionado", "inserir conteúdo aqui"
- NÃO escreva descrições do que será ensinado - ENSINE DIRETAMENTE
- Use **negrito**, *itálico*, listas, tabelas
- Inclua exemplos práticos reais com dados específicos
- Inclua exercícios de fixação ao final

ESTRUTURA OBRIGATÓRIA:
## ${moduleTitle}

### Introdução e Contexto
[Explique O QUE é, POR QUE é importante, QUANDO usar]

### Fundamentos Teóricos
[Definições, conceitos, princípios detalhados]

### Técnicas e Metodologias
[Passo a passo de cada técnica]

### Exemplos Práticos
[Múltiplos exemplos com dados reais]

### Erros Comuns
[Lista de erros e como evitá-los]

### Exercícios de Fixação
[Perguntas para reflexão]

ESCREVA O CONTEÚDO COMPLETO AGORA:`;

  const requestBody: any = {
    model,
    messages: [
      ...(isO1Model ? [] : [{ role: "system", content: "Você escreve conteúdo educacional completo e detalhado. Nunca use placeholders." }]),
      { role: "user", content: isO1Model ? `Você escreve conteúdo educacional completo e detalhado. Nunca use placeholders.\n\n${modulePrompt}` : modulePrompt },
    ],
    tools: [singleModuleTool],
    tool_choice: { type: "function", function: { name: "create_module_content" } },
  };

  if (isO1Model) {
    requestBody.max_completion_tokens = maxTokens;
  } else {
    requestBody.max_tokens = maxTokens;
  }

  console.log(`Generating module ${moduleIndex + 1}/${totalModules}: "${moduleTitle}"`);

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Module ${moduleIndex + 1} generation error:`, errorText);
    throw new Error(`Falha ao gerar módulo ${moduleIndex + 1}: ${moduleTitle}`);
  }

  const data = await response.json();
  let moduleContent;

  try {
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (toolCall && toolCall.function.arguments) {
      moduleContent = JSON.parse(toolCall.function.arguments);
    } else {
      const rawContent = data.choices[0].message.content || "";
      moduleContent = {
        title: moduleTitle,
        content: rawContent
      };
    }
  } catch (e) {
    console.error(`Failed to parse module ${moduleIndex + 1}:`, e);
    throw new Error(`Falha ao processar resposta do módulo ${moduleIndex + 1}`);
  }

  // Clean and validate
  moduleContent.title = cleanLLMContent(moduleContent.title || moduleTitle);
  moduleContent.content = cleanLLMContent(moduleContent.content);

  // Check for placeholders
  if (hasPlaceholder(moduleContent.content)) {
    console.warn(`Module ${moduleIndex + 1} contains placeholder or is too short, retrying...`);
    // Retry once with stronger instructions
    const retryRequestBody = { ...requestBody };
    retryRequestBody.messages[retryRequestBody.messages.length - 1].content += 
      "\n\n⚠️ ATENÇÃO: Você DEVE escrever o conteúdo COMPLETO agora. NÃO use placeholders.";
    
    const retryResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(retryRequestBody),
    });

    if (retryResponse.ok) {
      const retryData = await retryResponse.json();
      const retryToolCall = retryData.choices[0].message.tool_calls?.[0];
      if (retryToolCall && retryToolCall.function.arguments) {
        const retryContent = JSON.parse(retryToolCall.function.arguments);
        if (!hasPlaceholder(retryContent.content)) {
          moduleContent.content = cleanLLMContent(retryContent.content);
        }
      }
    }
  }

  console.log(`Module ${moduleIndex + 1} generated: ${moduleContent.content.length} chars`);
  return moduleContent;
}

// Save partial progress to database
async function savePartialProgress(
  supabase: any,
  jobId: string,
  structure: any,
  modules: any[],
  progressDetail: string
) {
  await supabase
    .from("course_generation_jobs")
    .update({
      partial_course_data: structure,
      modules_generated: modules,
      progress_detail: progressDetail,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);
}

// Process job with sequential module generation (resumable)
async function processJobSequential(supabase: any, jobId: string) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const apiEndpoint = "https://api.openai.com/v1/chat/completions";

  try {
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

    console.log("Processing job:", jobId, "model:", selectedModel, "depth:", content_depth);

    // Check for existing partial progress
    let existingStructure = job.partial_course_data;
    let existingModules = job.modules_generated || [];
    const startModuleIndex = existingModules.length;

    console.log(`Resuming from module ${startModuleIndex + 1}, existing modules: ${existingModules.length}`);

    // Update job status
    await supabase
      .from("course_generation_jobs")
      .update({ 
        status: "processing", 
        progress_detail: startModuleIndex > 0 
          ? `Retomando geração do módulo ${startModuleIndex + 1}...` 
          : "Iniciando geração...", 
        updated_at: new Date().toISOString() 
      })
      .eq("id", jobId);

    // Calculate module count and depth config
    const moduleCount = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 40 ? 5 : duration <= 60 ? 6 : 8;
    
    const getDepthConfig = (model: string) => {
      const isHighTokenModel = model?.startsWith("o1") || model?.startsWith("o3");
      
      if (isHighTokenModel) {
        return {
          basico: { minWords: 500, maxTokens: 12000 },
          detalhado: { minWords: 1500, maxTokens: 20000 },
          extenso: { minWords: 3000, maxTokens: 35000 },
          muito_extenso: { minWords: 5000, maxTokens: 50000 },
          profissional: { minWords: 7000, maxTokens: 65000 },
          enciclopedico: { minWords: 10000, maxTokens: 80000 }
        };
      }
      return {
        basico: { minWords: 500, maxTokens: 8000 },
        detalhado: { minWords: 1000, maxTokens: 12000 },
        extenso: { minWords: 2000, maxTokens: 16000 },
        muito_extenso: { minWords: 3000, maxTokens: 16000 },
        profissional: { minWords: 4000, maxTokens: 16000 },
        enciclopedico: { minWords: 5000, maxTokens: 16000 }
      };
    };
    
    const depthConfig = getDepthConfig(selectedModel);
    const depth = depthConfig[content_depth as keyof typeof depthConfig] || depthConfig.detalhado;

    // Check if we need sequential generation
    const useSequential = needsSequentialGeneration(selectedModel, content_depth || "detalhado", moduleCount);
    console.log("Sequential generation:", useSequential);

    let courseContent: any;

    if (useSequential) {
      // ===== SEQUENTIAL GENERATION FLOW (RESUMABLE) =====
      let structure = existingStructure;

      // Step 1: Generate course structure (if not already done)
      if (!structure) {
        await updateJobProgress(supabase, jobId, "Gerando estrutura do curso...");

        const structurePrompt = `Crie a estrutura de um curso sobre "${topic}" com ${moduleCount} módulos.
Nível: ${level}
Carga horária: ${duration} horas
${additional_instructions ? `Instruções: ${additional_instructions}` : ""}

Defina título, subtítulo, descrição e os títulos de cada módulo com um breve resumo do que será abordado.`;

        const structureRequestBody: any = {
          model: selectedModel,
          messages: [
            ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em design instrucional." }]),
            { role: "user", content: isO1Model ? `Você é um especialista em design instrucional.\n\n${structurePrompt}` : structurePrompt },
          ],
          tools: [courseStructureTool],
          tool_choice: { type: "function", function: { name: "create_course_structure" } },
        };

        if (isO1Model) {
          structureRequestBody.max_completion_tokens = 8000;
        } else {
          structureRequestBody.max_tokens = 4000;
        }

        const structureResponse = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(structureRequestBody),
        });

        if (!structureResponse.ok) {
          const errorText = await structureResponse.text();
          console.error("Structure generation error:", errorText);
          throw new Error("Falha ao gerar estrutura do curso");
        }

        const structureData = await structureResponse.json();

        try {
          const toolCall = structureData.choices[0].message.tool_calls?.[0];
          if (toolCall && toolCall.function.arguments) {
            structure = JSON.parse(toolCall.function.arguments);
          } else {
            throw new Error("No tool call in response");
          }
        } catch (e) {
          console.error("Failed to parse structure:", e);
          throw new Error("Falha ao processar estrutura do curso");
        }

        // Save structure immediately
        await savePartialProgress(supabase, jobId, structure, [], "Estrutura gerada, iniciando módulos...");
      }

      console.log("Course structure:", structure.title, "with", structure.modules.length, "modules");

      // Step 2: Generate each module individually (resumable)
      const fullModules: any[] = [...existingModules];
      let previousModulesSummary = "";
      
      // Build summary from existing modules
      for (let i = 0; i < existingModules.length; i++) {
        previousModulesSummary += `Módulo ${i + 1} - ${existingModules[i].title}: concluído\n`;
      }

      // Continue from where we left off
      for (let i = startModuleIndex; i < structure.modules.length; i++) {
        const moduleInfo = structure.modules[i];
        await updateJobProgress(supabase, jobId, `Gerando módulo ${i + 1} de ${structure.modules.length}: ${moduleInfo.title}`);

        try {
          const moduleContent = await generateSingleModule(
            OPENAI_API_KEY!,
            selectedModel,
            topic,
            structure.title,
            moduleInfo.title,
            moduleInfo.outline,
            i,
            structure.modules.length,
            depth.minWords,
            depth.maxTokens,
            previousModulesSummary
          );

          fullModules.push(moduleContent);

          // Save progress after each module (crucial for resumability)
          await savePartialProgress(
            supabase, 
            jobId, 
            structure, 
            fullModules, 
            `Módulo ${i + 1} de ${structure.modules.length} concluído`
          );

          // Add to summary for context in next module
          previousModulesSummary += `Módulo ${i + 1} - ${moduleInfo.title}: abordou ${moduleInfo.outline}\n`;
        } catch (moduleError: unknown) {
          const errorMessage = moduleError instanceof Error ? moduleError.message : String(moduleError);
          console.error(`Error generating module ${i + 1}:`, errorMessage);
          // Save progress before failing
          await savePartialProgress(
            supabase, 
            jobId, 
            structure, 
            fullModules, 
            `Erro no módulo ${i + 1}: ${errorMessage}`
          );
          throw moduleError;
        }
      }

      courseContent = {
        title: cleanLLMContent(structure.title),
        subtitle: cleanLLMContent(structure.subtitle),
        description: cleanLLMContent(structure.description),
        modules: fullModules.map(m => ({
          title: cleanLLMContent(m.title),
          content: cleanLLMContent(m.content)
        }))
      };

    } else {
      // ===== SINGLE-CALL GENERATION FLOW (for simpler depths) =====
      await updateJobProgress(supabase, jobId, "Gerando conteúdo do curso...");

      const contentPrompt = `Você é um professor universitário renomado criando um curso online.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount}
MÍNIMO DE PALAVRAS POR MÓDULO: ${depth.minWords}
${additional_instructions ? `INSTRUÇÕES: ${additional_instructions}` : ""}

⚠️ CADA MÓDULO DEVE TER NO MÍNIMO ${depth.minWords} PALAVRAS de conteúdo educacional real.
NÃO use placeholders. ESCREVA o conteúdo completo.`;

      const contentRequestBody: any = {
        model: selectedModel,
        messages: [
          ...(isO1Model ? [] : [{ role: "system", content: "Você cria conteúdo educacional REAL e PRÁTICO." }]),
          { role: "user", content: isO1Model ? `Você cria conteúdo educacional REAL e PRÁTICO.\n\n${contentPrompt}` : contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
      };
      
      if (isO1Model) {
        contentRequestBody.max_completion_tokens = depth.maxTokens;
      } else {
        contentRequestBody.max_tokens = depth.maxTokens;
      }

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
      
      try {
        const toolCall = contentData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          courseContent = JSON.parse(toolCall.function.arguments);
        } else {
          const rawContent = contentData.choices[0].message.content || "";
          const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
          courseContent = JSON.parse(jsonMatch[1].trim());
        }
        
        // Clean all content
        if (courseContent.modules && Array.isArray(courseContent.modules)) {
          courseContent.modules = courseContent.modules.map((mod: any) => ({
            ...mod,
            title: cleanLLMContent(mod.title),
            content: cleanLLMContent(mod.content),
          }));
        }
        
        if (courseContent.title) courseContent.title = cleanLLMContent(courseContent.title);
        if (courseContent.subtitle) courseContent.subtitle = cleanLLMContent(courseContent.subtitle);
        if (courseContent.description) courseContent.description = cleanLLMContent(courseContent.description);
        
      } catch (e) {
        console.error("Failed to parse course content:", e);
        throw new Error("Falha ao processar resposta da IA");
      }

      // Check for placeholders in modules and regenerate if needed
      for (let i = 0; i < courseContent.modules.length; i++) {
        if (hasPlaceholder(courseContent.modules[i].content)) {
          console.log(`Module ${i + 1} has placeholder, regenerating...`);
          await updateJobProgress(supabase, jobId, `Regenerando módulo ${i + 1}...`);
          
          const moduleContent = await generateSingleModule(
            OPENAI_API_KEY!,
            selectedModel,
            topic,
            courseContent.title,
            courseContent.modules[i].title,
            `Módulo ${i + 1} do curso`,
            i,
            courseContent.modules.length,
            depth.minWords,
            depth.maxTokens,
            ""
          );
          
          courseContent.modules[i] = moduleContent;
        }
      }
    }

    console.log("Course content generated:", courseContent.title);

    // ===== GENERATE EXERCISES =====
    await updateJobProgress(supabase, jobId, "Gerando exercícios práticos...");

    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".`;

    const exercisesRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em avaliação educacional." }]),
        { role: "user", content: isO1Model ? `Você é um especialista em avaliação educacional.\n\n${exercisesPrompt}` : exercisesPrompt },
      ],
      tools: [exercisesTool],
      tool_choice: { type: "function", function: { name: "create_exercises" } },
    };
    
    if (isO1Model) {
      exercisesRequestBody.max_completion_tokens = 4000;
    } else {
      exercisesRequestBody.max_tokens = 4000;
    }

    const exercisesResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exercisesRequestBody),
    });

    let exercises = { exercises: [] };
    if (exercisesResponse.ok) {
      const exercisesData = await exercisesResponse.json();
      try {
        const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exercises = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exercises:", e);
      }
    }

    console.log("Exercises generated:", exercises.exercises?.length || 0);

    // ===== GENERATE EXAM =====
    await updateJobProgress(supabase, jobId, "Gerando prova final...");

    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}".`;

    const examRequestBody: any = {
      model: selectedModel,
      messages: [
        ...(isO1Model ? [] : [{ role: "system", content: "Você é um especialista em avaliação educacional." }]),
        { role: "user", content: isO1Model ? `Você é um especialista em avaliação educacional.\n\n${examPrompt}` : examPrompt },
      ],
      tools: [examTool],
      tool_choice: { type: "function", function: { name: "create_exam" } },
    };
    
    if (isO1Model) {
      examRequestBody.max_completion_tokens = 6000;
    } else {
      examRequestBody.max_tokens = 6000;
    }

    const examResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(examRequestBody),
    });

    let exam = { examQuestions: [] };
    if (examResponse.ok) {
      const examData = await examResponse.json();
      try {
        const toolCall = examData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exam = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exam:", e);
      }
    }

    console.log("Exam generated:", exam.examQuestions?.length || 0);

    // ===== SAVE TO DATABASE =====
    await updateJobProgress(supabase, jobId, "Salvando curso...");

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
        progress_detail: "Curso criado com sucesso!",
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
    
    await supabase
      .from("course_generation_jobs")
      .update({ 
        status: "failed",
        error_message: error.message || "Erro desconhecido",
        progress_detail: `Erro: ${error.message || "Erro desconhecido"}`,
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);

    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Mode 1: Process existing job
    if (processJob && jobId) {
      console.log("Processing existing job:", jobId);
      const result = await processJobSequential(supabase, jobId);
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

    // For O1/O3 models, create job and process asynchronously
    if (isO1Model) {
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
          status: "pending",
          progress_detail: "Aguardando início..."
        })
        .select()
        .single();

      if (jobError) {
        console.error("Failed to create job:", jobError);
        throw new Error("Falha ao criar job de geração");
      }

      console.log("Job created:", job.id);

      return new Response(
        JSON.stringify({
          success: true,
          async: true,
          jobId: job.id,
          message: "Job criado. O processamento será iniciado.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For GPT-4o models, process synchronously
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const moduleCount = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 40 ? 5 : duration <= 60 ? 6 : 8;
    
    const depthConfig = {
      basico: { minWords: 500, maxTokens: 8000 },
      detalhado: { minWords: 1000, maxTokens: 12000 },
      extenso: { minWords: 2000, maxTokens: 16000 },
      muito_extenso: { minWords: 3000, maxTokens: 16000 },
      profissional: { minWords: 4000, maxTokens: 16000 },
      enciclopedico: { minWords: 5000, maxTokens: 16000 }
    };
    
    const depth = depthConfig[contentDepth as keyof typeof depthConfig] || depthConfig.detalhado;

    const contentPrompt = `Você é um professor universitário renomado criando um curso online.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount}
MÍNIMO DE PALAVRAS POR MÓDULO: ${depth.minWords}
${additionalInstructions ? `INSTRUÇÕES: ${additionalInstructions}` : ""}

⚠️ CADA MÓDULO DEVE TER NO MÍNIMO ${depth.minWords} PALAVRAS de conteúdo educacional real.
NÃO use placeholders. ESCREVA o conteúdo completo.

ESTRUTURA PARA CADA MÓDULO:
## [Título]
### Introdução e Contexto
### Fundamentos Teóricos
### Técnicas e Metodologias
### Exemplos Práticos
### Erros Comuns
### Exercícios de Fixação`;

    const contentResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você cria conteúdo educacional REAL e PRÁTICO." },
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
    
    try {
      const toolCall = contentData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        courseContent = JSON.parse(toolCall.function.arguments);
      } else {
        const rawContent = contentData.choices[0].message.content || "";
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
        courseContent = JSON.parse(jsonMatch[1].trim());
      }
      
      if (courseContent.modules && Array.isArray(courseContent.modules)) {
        courseContent.modules = courseContent.modules.map((mod: any) => ({
          ...mod,
          title: cleanLLMContent(mod.title),
          content: cleanLLMContent(mod.content),
        }));
      }
      
      if (courseContent.title) courseContent.title = cleanLLMContent(courseContent.title);
      if (courseContent.subtitle) courseContent.subtitle = cleanLLMContent(courseContent.subtitle);
      if (courseContent.description) courseContent.description = cleanLLMContent(courseContent.description);
      
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Failed to parse AI response for course content");
    }

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

    let exercises = { exercises: [] };
    if (exercisesResponse.ok) {
      const exercisesData = await exercisesResponse.json();
      try {
        const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exercises = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exercises:", e);
      }
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

    let exam = { examQuestions: [] };
    if (examResponse.ok) {
      const examData = await examResponse.json();
      try {
        const toolCall = examData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exam = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exam:", e);
      }
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
