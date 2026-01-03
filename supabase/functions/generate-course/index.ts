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
    description: "Create complete course content with title, subtitle, descriptions, and modules",
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
              content: { type: "string", description: "Detailed module content with explanations and examples (min 300 words)" }
            },
            required: ["title", "content"]
          },
          description: "Course modules (3-6 modules)"
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

    const { topic, level, duration, categoryId, price, additionalInstructions }: CourseRequest = await req.json();

    console.log("Generating course:", { topic, level, duration, price });

    // Step 1: Generate course content using tool calling
    const contentPrompt = `Crie um curso completo sobre "${topic}".
Nível: ${level}
Carga horária: ${duration} horas
${additionalInstructions ? `Instruções adicionais: ${additionalInstructions}` : ""}

IMPORTANTE:
1. Crie um título profissional e atrativo
2. Crie um subtítulo chamativo e impactante (máximo 150 caracteres) que complemente o título e desperte interesse do aluno. Exemplos de bons subtítulos: "Domine as técnicas essenciais para o sucesso", "Do zero ao profissional em semanas", "Aprenda na prática com exemplos reais"
3. Crie entre 3 e 6 módulos dependendo da carga horária
4. O conteúdo deve ser educativo, bem estruturado e adequado ao nível do aluno
5. Cada módulo deve ter pelo menos 300 palavras de conteúdo`;

    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em educação e criação de cursos. Use a função fornecida para estruturar o curso." },
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

    const exercisesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar exercícios." },
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

    // Step 3: Generate final exam using tool calling
    const examPrompt = `Crie uma prova final com 15 questões de múltipla escolha para o curso "${courseContent.title}" sobre "${topic}".
A prova deve cobrir todos os módulos e ter questões de diferentes níveis de dificuldade.`;

    const examResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Use a função fornecida para criar a prova." },
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
