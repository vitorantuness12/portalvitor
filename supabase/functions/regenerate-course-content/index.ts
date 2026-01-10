import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool schemas for structured output
const courseContentTool = {
  type: "function",
  function: {
    name: "create_course_content",
    description: "Create complete educational course content with EXTENSIVE teaching material. Each module MUST have minimum 1500-2000 words of comprehensive content.",
    parameters: {
      type: "object",
      properties: {
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Module title" },
              content: { type: "string", description: "EXTENSIVE educational content with MINIMUM 1500-2000 words per module. Include: detailed theoretical explanations, multiple practical examples, real-world case studies, step-by-step tutorials, best practices, common mistakes to avoid, exercises, and reflection questions. Write like a complete textbook chapter." }
            },
            required: ["title", "content"]
          },
          description: "Course modules (3-8 modules depending on course duration)"
        }
      },
      required: ["modules"]
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

    const { courseId }: { courseId: string } = await req.json();

    // Fetch the course data
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Regenerating content for course with OpenAI:", course.title);

    // Calculate module count based on duration
    const moduleCount = course.duration_hours <= 10 ? 3 : course.duration_hours <= 20 ? 4 : course.duration_hours <= 40 ? 5 : course.duration_hours <= 60 ? 6 : 8;

    // Step 1: Generate course content
    const contentPrompt = `Você é um professor universitário renomado criando conteúdo educacional COMPLETO E EXTENSO para um curso online. O conteúdo deve ser um material didático de alta qualidade.

CURSO: "${course.title}"
DESCRIÇÃO: ${course.description}
NÍVEL: ${course.level}
CARGA HORÁRIA: ${course.duration_hours} horas
NÚMERO DE MÓDULOS: ${moduleCount}

⚠️ REGRAS ABSOLUTAMENTE CRÍTICAS:

1. CADA MÓDULO DEVE TER NO MÍNIMO 1500-2000 PALAVRAS de conteúdo educacional real
2. NÃO ESCREVA frases como "Neste módulo vamos...", "Você aprenderá...", "Exploraremos..."
3. ESCREVA O CONTEÚDO COMPLETO como um capítulo de livro didático

ESTRUTURA OBRIGATÓRIA PARA CADA MÓDULO:

## [Título do Tópico]

### Introdução e Contexto (200+ palavras)
- O QUE é o conceito, POR QUE é importante, COMO se aplica na prática

### Fundamentos Teóricos (400+ palavras)
- Definições detalhadas de todos os termos
- Princípios e conceitos fundamentais em profundidade
- Fórmulas, frameworks ou modelos com explicação completa

### Técnicas e Metodologias (400+ palavras)
- Passo a passo detalhado de cada técnica
- Quando usar cada abordagem, variações e adaptações

### Exemplos Práticos Detalhados (300+ palavras)
- 2-3 exemplos reais com números e dados específicos
- Templates ou scripts quando aplicável

### Erros Comuns e Como Evitar (150+ palavras)
- Lista dos erros frequentes e soluções práticas

### Exercícios de Fixação (100+ palavras)
- Perguntas para reflexão e atividades práticas

Use **negrito**, *itálico*, listas numeradas, tabelas. Escreva como um LIVRO DIDÁTICO COMPLETO.
Crie ${moduleCount} módulos com este nível de profundidade.`;

    const contentResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade, como um livro didático de alta qualidade. Nunca escreva apenas descrições do que será ensinado - escreva o conteúdo educacional completo." },
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
      throw new Error("Falha ao gerar o conteúdo do curso");
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
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Failed to parse AI response for course content");
    }

    console.log("New content generated with", courseContent.modules?.length, "modules");

    // Step 2: Generate exercises based on new content
    const moduleSummary = courseContent.modules.map((m: any) => m.title).join(", ");
    const exercisesPrompt = `Crie 10 exercícios de múltipla escolha para o curso "${course.title}".

Módulos do curso: ${moduleSummary}

As questões devem:
- Testar a compreensão PRÁTICA do conteúdo
- Cobrir diferentes módulos do curso
- Ter níveis variados de dificuldade
- Ser claras e objetivas
- Ter 4 opções de resposta cada`;

    const exercisesResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Crie questões que testem conhecimento prático e aplicado." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
        max_tokens: 4000,
      }),
    });

    if (!exercisesResponse.ok) {
      console.error("OpenAI exercises generation error:", exercisesResponse.status);
      throw new Error("Falha ao gerar os exercícios");
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

    // Step 3: Generate final exam based on new content
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${course.title}".

Módulos do curso: ${moduleSummary}

A prova deve:
- Cobrir TODOS os módulos do curso
- Ter questões de diferentes níveis de dificuldade
- Incluir questões conceituais e práticas
- Ser abrangente e justa
- Ter 4 opções de resposta cada`;

    const examResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Crie uma prova final abrangente e justa." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
        max_tokens: 6000,
      }),
    });

    if (!examResponse.ok) {
      console.error("OpenAI exam generation error:", examResponse.status);
      throw new Error("Falha ao gerar a prova final");
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

    // Step 4: Update course content
    const { error: updateError } = await supabase
      .from("courses")
      .update({
        content_pdf_url: JSON.stringify(courseContent.modules),
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    if (updateError) {
      console.error("Error updating course:", updateError);
      throw new Error("Failed to update course content");
    }

    // Step 5: Delete old exercises and insert new ones
    await supabase.from("course_exercises").delete().eq("course_id", courseId);
    
    if (exercises.exercises && exercises.exercises.length > 0) {
      const exercisesToInsert = exercises.exercises.map((ex: any, index: number) => ({
        course_id: courseId,
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

    // Step 6: Delete old exam questions and insert new ones
    await supabase.from("course_exams").delete().eq("course_id", courseId);
    
    if (exam.examQuestions && exam.examQuestions.length > 0) {
      const examQuestionsToInsert = exam.examQuestions.map((q: any, index: number) => ({
        course_id: courseId,
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

    console.log("Course content, exercises, and exam updated successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        modulesCount: courseContent.modules?.length || 0,
        exercisesCount: exercises.exercises?.length || 0,
        examQuestionsCount: exam.examQuestions?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in regenerate-course-content function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
