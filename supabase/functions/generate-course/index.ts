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

    // Verify user is admin
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

    // Step 1: Generate course content
    const contentPrompt = `Você é um especialista em criação de cursos educacionais. Crie o conteúdo completo para um curso sobre "${topic}".

Nível: ${level}
Carga horária: ${duration} horas
${additionalInstructions ? `Instruções adicionais: ${additionalInstructions}` : ""}

Gere o conteúdo no seguinte formato JSON:
{
  "title": "Título do curso",
  "shortDescription": "Descrição curta (máximo 100 caracteres)",
  "description": "Descrição completa do curso (2-3 parágrafos)",
  "modules": [
    {
      "title": "Título do Módulo",
      "content": "Conteúdo detalhado do módulo com explicações, conceitos e exemplos práticos. Mínimo 500 palavras por módulo."
    }
  ]
}

Crie entre 3 e 6 módulos dependendo da carga horária. O conteúdo deve ser educativo, bem estruturado e adequado ao nível do aluno.`;

    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em educação e criação de cursos. Responda sempre em JSON válido." },
          { role: "user", content: contentPrompt },
        ],
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
      const rawContent = contentData.choices[0].message.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      courseContent = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse course content:", e);
      throw new Error("Failed to parse AI response for course content");
    }

    console.log("Course content generated successfully");

    // Step 2: Generate exercises
    const exercisesPrompt = `Baseado no curso "${courseContent.title}" sobre "${topic}", crie 10 exercícios de múltipla escolha para praticar o conteúdo.

Retorne no formato JSON:
{
  "exercises": [
    {
      "question": "Pergunta do exercício",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0
    }
  ]
}

O campo correctAnswer é o índice (0-3) da resposta correta. Crie perguntas que testem a compreensão do conteúdo, variando a dificuldade.`;

    const exercisesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Responda sempre em JSON válido." },
          { role: "user", content: exercisesPrompt },
        ],
      }),
    });

    if (!exercisesResponse.ok) {
      console.error("AI exercises generation error");
      throw new Error("Failed to generate exercises");
    }

    const exercisesData = await exercisesResponse.json();
    let exercises;
    try {
      const rawExercises = exercisesData.choices[0].message.content;
      const jsonMatch = rawExercises.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExercises];
      exercises = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse exercises:", e);
      throw new Error("Failed to parse AI response for exercises");
    }

    console.log("Exercises generated successfully");

    // Step 3: Generate final exam
    const examPrompt = `Baseado no curso "${courseContent.title}" sobre "${topic}", crie uma prova final com 15 questões de múltipla escolha.

Retorne no formato JSON:
{
  "examQuestions": [
    {
      "question": "Pergunta da prova",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0
    }
  ]
}

O campo correctAnswer é o índice (0-3) da resposta correta. A prova deve cobrir todos os módulos do curso e ter questões de diferentes níveis de dificuldade.`;

    const examResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em avaliação educacional. Responda sempre em JSON válido." },
          { role: "user", content: examPrompt },
        ],
      }),
    });

    if (!examResponse.ok) {
      console.error("AI exam generation error");
      throw new Error("Failed to generate exam");
    }

    const examData = await examResponse.json();
    let exam;
    try {
      const rawExam = examData.choices[0].message.content;
      const jsonMatch = rawExam.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawExam];
      exam = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse exam:", e);
      throw new Error("Failed to parse AI response for exam");
    }

    console.log("Exam generated successfully");

    // Step 4: Save everything to database
    // Create the course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseContent.title,
        description: courseContent.description,
        short_description: courseContent.shortDescription,
        category_id: categoryId || null,
        duration_hours: duration,
        level: level,
        price: price || 0,
        status: "active",
        content_pdf_url: JSON.stringify(courseContent.modules), // Store modules as JSON for now
      })
      .select()
      .single();

    if (courseError) {
      console.error("Error creating course:", courseError);
      throw new Error("Failed to save course to database");
    }

    console.log("Course saved:", course.id);

    // Insert exercises
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

    // Insert exam questions
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

    console.log("Course generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          exercisesCount: exercises.exercises.length,
          examQuestionsCount: exam.examQuestions.length,
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
