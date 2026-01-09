import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkCourseRequest {
  topic: string;
  categoryId?: string;
  price?: number;
  additionalInstructions?: string;
}

// Tool schemas for structured output
const courseAnalysisTool = {
  type: "function",
  function: {
    name: "analyze_course_topic",
    description: "Analyze a course topic and determine the appropriate level and duration",
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
          description: "Recommended number of modules (3-8)"
        },
        reasoning: {
          type: "string",
          description: "Brief explanation of why this level and duration were chosen"
        }
      },
      required: ["level", "duration", "moduleCount", "reasoning"]
    }
  }
};

const courseContentTool = {
  type: "function",
  function: {
    name: "create_course_content",
    description: "Create complete educational course content",
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
              content: { type: "string", description: "Educational content with minimum 500 words" }
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

    const { topic, categoryId, price, additionalInstructions }: BulkCourseRequest = await req.json();

    console.log("Bulk generating course:", { topic, price });

    // Step 1: Analyze topic to determine level and duration
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em design instrucional. Analise o tema do curso e determine o nível de dificuldade apropriado e a carga horária recomendada baseado na complexidade e profundidade necessária para ensinar o assunto." 
          },
          { 
            role: "user", 
            content: `Analise este tema de curso e determine o nível (iniciante, intermediario ou avancado) e a carga horária apropriada (5, 10, 20, 40, 60 ou 80 horas):

TEMA: "${topic}"
${additionalInstructions ? `CONTEXTO ADICIONAL: ${additionalInstructions}` : ""}

Considere:
- Temas básicos ou introdutórios = iniciante, 5-10h
- Temas que requerem conhecimento prévio = intermediario, 20-40h
- Temas especializados ou complexos = avancado, 40-80h` 
          },
        ],
        tools: [courseAnalysisTool],
        tool_choice: { type: "function", function: { name: "analyze_course_topic" } },
      }),
    });

    if (!analysisResponse.ok) {
      if (analysisResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione mais créditos para continuar." }), {
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

    const { level, duration, moduleCount } = analysis;

    // Step 2: Generate course content
    const contentPrompt = `Você é um professor especialista criando um curso online completo. O curso deve ensinar DE VERDADE, não apenas descrever o que será ensinado.

CURSO: "${topic}"
NÍVEL: ${level}
CARGA HORÁRIA: ${duration} horas
NÚMERO DE MÓDULOS: ${moduleCount || 4}
${additionalInstructions ? `INSTRUÇÕES ADICIONAIS: ${additionalInstructions}` : ""}

REGRAS CRÍTICAS PARA O CONTEÚDO DOS MÓDULOS:
1. NÃO ESCREVA "Neste módulo vamos abordar..." ou "Você aprenderá sobre..."
2. ESCREVA O CONTEÚDO EDUCACIONAL REAL - ensine o assunto diretamente
3. Cada módulo deve conter conceitos, explicações, exemplos práticos e dicas
4. Use subtítulos em markdown (##, ###) para organizar o conteúdo
5. Mínimo de 500 palavras de conteúdo REAL por módulo`;

    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um professor universitário especialista em educação online. Você cria conteúdo educacional REAL e PRÁTICO que ensina de verdade. Use a função fornecida para estruturar o curso." },
          { role: "user", content: contentPrompt },
        ],
        tools: [courseContentTool],
        tool_choice: { type: "function", function: { name: "create_course_content" } },
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

    const exercisesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar exercícios." },
          { role: "user", content: exercisesPrompt },
        ],
        tools: [exercisesTool],
        tool_choice: { type: "function", function: { name: "create_exercises" } },
      }),
    });

    let exercises = { exercises: [] };
    if (exercisesResponse.ok) {
      try {
        const exercisesData = await exercisesResponse.json();
        const toolCall = exercisesData.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.arguments) {
          exercises = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse exercises:", e);
      }
    }

    console.log("Exercises generated:", exercises.exercises?.length || 0);

    // Step 4: Generate exam
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".`;

    const examResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova." },
          { role: "user", content: examPrompt },
        ],
        tools: [examTool],
        tool_choice: { type: "function", function: { name: "create_exam" } },
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

    console.log("Bulk course generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          level: level,
          duration: duration,
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
