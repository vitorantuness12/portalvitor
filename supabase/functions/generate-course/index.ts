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
  additionalInstructions?: string;
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

    const { topic, level, duration, categoryId, price, additionalInstructions }: CourseRequest = await req.json();

    console.log("Generating course with OpenAI:", { topic, level, duration, price });

    // Step 1: Generate course content using tool calling
    const moduleCount = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 40 ? 5 : duration <= 60 ? 6 : 8;
    
    const contentPrompt = `Você é um professor universitário renomado criando um curso online COMPLETO E EXTENSO. O curso deve ser um material didático de alta qualidade, como um livro-texto profissional.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ""}

⚠️ REGRAS ABSOLUTAMENTE CRÍTICAS - LEIA COM ATENÇÃO:

1. CADA MÓDULO DEVE TER NO MÍNIMO 1500-2000 PALAVRAS de conteúdo educacional real
2. NÃO ESCREVA frases como "Neste módulo vamos...", "Você aprenderá...", "Exploraremos..."
3. ESCREVA O CONTEÚDO COMPLETO como um capítulo de livro didático

ESTRUTURA OBRIGATÓRIA PARA CADA MÓDULO:

## [Título do Tópico Principal]

### Introdução e Contexto (200+ palavras)
- Explique O QUE é o conceito
- POR QUE é importante
- COMO se aplica na prática
- Contexto histórico ou de mercado quando relevante

### Fundamentos Teóricos (400+ palavras)
- Definições detalhadas de todos os termos
- Princípios e conceitos fundamentais explicados em profundidade
- Relação entre conceitos
- Fórmulas, frameworks ou modelos com explicação completa

### Técnicas e Metodologias (400+ palavras)
- Passo a passo detalhado de cada técnica
- Quando usar cada abordagem
- Variações e adaptações
- Dicas de implementação

### Exemplos Práticos Detalhados (300+ palavras)
- Pelo menos 2-3 exemplos reais e detalhados
- Casos de uso específicos com números e dados
- Templates ou scripts quando aplicável
- Análise do que funciona e por quê

### Erros Comuns e Como Evitar (150+ palavras)
- Lista dos erros mais frequentes
- Explicação de por que acontecem
- Soluções práticas

### Exercícios de Fixação (100+ palavras)
- Perguntas para reflexão
- Atividades práticas sugeridas

Use formatação rica: **negrito**, *itálico*, listas numeradas, tabelas quando apropriado, citações, e organize com subtítulos claros.

LEMBRE-SE: Você está escrevendo um LIVRO DIDÁTICO COMPLETO, não um resumo ou índice. O aluno deve conseguir APRENDER TUDO apenas lendo este conteúdo, sem precisar de material complementar.`;

    const contentResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade. Nunca escreva apenas descrições do que será ensinado - escreva o conteúdo educacional completo. Use a função fornecida para estruturar o curso." },
          { role: "user", content: contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
        max_tokens: 16000,
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("OpenAI content generation error:", contentResponse.status, errorText);
      throw new Error("Failed to generate course content");
    }

    const contentData = await contentResponse.json();
    let courseContent;
    
    try {
      const toolCall = contentData.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.arguments) {
        courseContent = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse from content
        const rawContent = contentData.choices[0].message.content || "";
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
        courseContent = JSON.parse(jsonMatch[1].trim());
      }
    } catch (e) {
      console.error("Failed to parse course content:", e);
      console.error("Raw response:", JSON.stringify(contentData));
      throw new Error("Failed to parse AI response for course content");
    }

    console.log("Course content generated:", courseContent.title);

    // Step 2: Generate exercises using tool calling
    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}". 
As questões devem testar a compreensão do conteúdo e ter níveis variados de dificuldade.`;

    const exercisesResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar exercícios." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
        max_tokens: 4000,
      }),
    });

    if (!exercisesResponse.ok) {
      console.error("OpenAI exercises generation error:", exercisesResponse.status);
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

    console.log("Exercises generated:", exercises.exercises?.length || 0);

    // Step 3: Generate final exam using tool calling
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".
A prova deve cobrir todos os módulos e ter questões de diferentes níveis de dificuldade.`;

    const examResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
        max_tokens: 6000,
      }),
    });

    if (!examResponse.ok) {
      console.error("OpenAI exam generation error:", examResponse.status);
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

    console.log("Exam generated:", exam.examQuestions?.length || 0);

    // Step 4: Save everything to database
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        short_description: (courseContent.subtitle || courseContent.shortDescription)?.substring(0, 150),
        category_id: categoryId || null,
        duration_hours: duration,
        level: level,
        price: price || 0,
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

    console.log("Course generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          subtitle: courseContent.subtitle || courseContent.shortDescription,
          exercisesCount: exercises.exercises?.length || 0,
          examQuestionsCount: exam.examQuestions?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-course function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
