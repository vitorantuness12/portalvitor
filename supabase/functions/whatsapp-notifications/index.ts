import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendWhatsAppMessage(number: string, message: string) {
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
  const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME")!;

  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
  const cleanNumber = number.replace(/\D/g, "");

  const response = await fetch(
    `${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
    {
      method: "POST",
      headers: {
        apikey: EVOLUTION_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Evolution API error:", response.status, errorText);
    throw new Error(`Falha ao enviar WhatsApp: ${response.status}`);
  }

  return await response.json();
}

const notificationTemplates: Record<string, (data: Record<string, string>) => string> = {
  enrollment_confirmed: (data) =>
    `🎓 Olá, ${data.studentName}!\n\nSua matrícula no curso *${data.courseTitle}* foi confirmada com sucesso!\n\nAcesse a plataforma para começar a estudar.\n\nBons estudos! 📚\n— Equipe Formak`,

  payment_confirmed: (data) =>
    `✅ Pagamento confirmado!\n\nOlá, ${data.studentName}!\n\nSeu pagamento de R$ ${data.amount} foi processado com sucesso.\n\n${data.details || ""}\n\nObrigado! 💚\n— Equipe Formak`,

  certificate_issued: (data) =>
    `🏆 Parabéns, ${data.studentName}!\n\nSeu certificado do curso *${data.courseTitle}* foi emitido com sucesso!\n\nVocê pode acessá-lo na área "Meus Certificados" da plataforma.\n\nContinue aprendendo! 🚀\n— Equipe Formak`,

  exam_passed: (data) =>
    `🎉 Parabéns, ${data.studentName}!\n\nVocê foi aprovado(a) na prova do curso *${data.courseTitle}* com nota *${data.score}*!\n\nSeu certificado já está disponível.\n\n— Equipe Formak`,

  custom: (data) => data.message || "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error("Credenciais da Evolution API não configuradas");
    }

    const { type, number, data } = await req.json();

    if (!type || !number) {
      return new Response(
        JSON.stringify({ error: "Tipo de notificação e número são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templateFn = notificationTemplates[type];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Tipo de notificação desconhecido: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = templateFn(data || {});
    const result = await sendWhatsAppMessage(number, message);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
