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
    description: "Create complete educational course content with real teaching material, not descriptions of what will be taught",
    parameters: {
      type: "object",
      properties: {
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Module title" },
              content: { type: "string", description: "ACTUAL educational content teaching the subject. Must include: concepts, definitions, step-by-step explanations, practical examples, case studies, tips and techniques. DO NOT write what will be taught, ACTUALLY TEACH IT. Minimum 500 words of real educational content." }
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    console.log("Regenerating content for course:", course.title);

    // Calculate module count based on duration
    const moduleCount = course.duration_hours <= 10 ? 3 : course.duration_hours <= 20 ? 4 : course.duration_hours <= 40 ? 5 : course.duration_hours <= 60 ? 6 : 8;

    // Step 1: Generate course content
    const contentPrompt = `Você é um professor especialista criando conteúdo educacional para um curso online. O conteúdo deve ensinar DE VERDADE, não apenas descrever o que será ensinado.

CURSO: "${course.title}"
DESCRIÇÃO: ${course.description}
NÍVEL: ${course.level}
CARGA HORÁRIA: ${course.duration_hours} horas
NÚMERO DE MÓDULOS: ${moduleCount}

REGRAS CRÍTICAS PARA O CONTEÚDO DOS MÓDULOS:
1. NÃO ESCREVA "Neste módulo vamos abordar..." ou "Você aprenderá sobre..." ou "Exploraremos..."
2. ESCREVA O CONTEÚDO EDUCACIONAL REAL - ensine o assunto diretamente como um livro didático
3. Cada módulo DEVE conter:
   - Definições e conceitos explicados de forma clara e direta
   - Explicações passo a passo de técnicas e processos
   - Exemplos práticos e casos reais detalhados
   - Dicas e melhores práticas
   - Exercícios mentais ou reflexões
4. Use subtítulos em markdown (##, ###) para organizar o conteúdo
5. Inclua listas numeradas e com marcadores para facilitar a leitura
6. Mínimo de 500 palavras de conteúdo EDUCACIONAL REAL por módulo

EXEMPLO DO QUE NÃO FAZER:
"Neste módulo, mergulharemos profundamente na arte de estruturar um conteúdo. Exploraremos diversas técnicas e você aprenderá sobre..."

EXEMPLO DO QUE FAZER:
"## O que é Estruturação de Conteúdo

Estruturação de conteúdo é o processo de organizar informações de forma lógica e progressiva para maximizar a compreensão e retenção do público.

### Os 3 Princípios Fundamentais

**1. Hierarquia Visual**
A hierarquia visual estabelece a importância relativa dos elementos. Textos maiores e em negrito indicam maior importância.

**2. Fluxo Lógico**
O fluxo lógico segue uma progressão natural:
1. Apresente o conceito básico primeiro
2. Adicione detalhes e nuances
3. Mostre aplicações práticas"

Crie ${moduleCount} módulos seguindo este padrão de ENSINAR o conteúdo diretamente.`;

    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade, como um livro didático de alta qualidade. Nunca escreva apenas descrições do que será ensinado - escreva o conteúdo educacional completo." },
          { role: "user", content: contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("AI content generation error:", errorText);
      throw new Error("Failed to generate course content");
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

    const exercisesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Crie questões que testem conhecimento prático e aplicado." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
      }),
    });

    if (!exercisesResponse.ok) {
      console.error("AI exercises generation error");
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

    // Step 3: Generate final exam based on new content
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${course.title}".

Módulos do curso: ${moduleSummary}

A prova deve:
- Cobrir TODOS os módulos do curso
- Ter questões de diferentes níveis de dificuldade
- Incluir questões conceituais e práticas
- Ser abrangente e justa
- Ter 4 opções de resposta cada`;

    const examResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Crie uma prova final abrangente e justa." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
      }),
    });

    if (!examResponse.ok) {
      console.error("AI exam generation error");
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
