import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago.
 * Manifest esperado: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
async function isValidSignature(
  secret: string,
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
): Promise<boolean> {
  if (!signatureHeader || !dataId) return false;

  // Formato: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    }),
  ) as Record<string, string>;

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Rejeita notificações antigas (proteção contra replay) — tolerância de 10 minutos.
  const tsMs = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 10 * 60 * 1000) {
    console.error("Webhook signature timestamp out of tolerance:", ts);
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparação em tempo constante.
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not configured");
    }

    const WEBHOOK_SECRET = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rawBody = await req.text();
    let body: Record<string, any>;
    try {
      body = JSON.parse(rawBody || "{}");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assinatura obrigatória: sem segredo configurado a função não confia em nenhuma notificação.
    if (!WEBHOOK_SECRET) {
      console.error("MERCADO_PAGO_WEBHOOK_SECRET is not configured — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const dataId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "") || null;

    const validSignature = await isValidSignature(
      WEBHOOK_SECRET,
      req.headers.get("x-signature"),
      req.headers.get("x-request-id"),
      dataId,
    );

    if (!validSignature) {
      console.error("Invalid webhook signature — request rejected", { dataId });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received (signature ok):", JSON.stringify(body));


    // Mercado Pago sends different types of notifications
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });

      if (!mpResponse.ok) {
        console.error("Failed to fetch payment from MP:", await mpResponse.text());
        return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mpPayment = await mpResponse.json();
      console.log("MP Payment details:", JSON.stringify(mpPayment, null, 2));

      // Find local payment by mercado_pago_id or external_reference
      const { data: localPayment, error: findError } = await supabase
        .from("payments")
        .select("*")
        .or(`mercado_pago_id.eq.${mpPayment.id},id.eq.${mpPayment.external_reference}`)
        .maybeSingle();

      if (findError || !localPayment) {
        console.log("Local payment not found:", mpPayment.external_reference, findError);
        return new Response(JSON.stringify({ received: true, warning: "Payment not found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map MP status to local status
      let status = localPayment.status;
      if (mpPayment.status === "approved") {
        status = "approved";
      } else if (mpPayment.status === "rejected") {
        status = "rejected";
      } else if (mpPayment.status === "cancelled") {
        status = "cancelled";
      } else if (mpPayment.status === "refunded") {
        status = "refunded";
      }

      // Update local payment
      const updateData: Record<string, unknown> = {
        mercado_pago_status: mpPayment.status,
        status,
      };

      if (mpPayment.status === "approved" && !localPayment.paid_at) {
        updateData.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", localPayment.id);

      if (updateError) {
        console.error("Error updating payment:", updateError);
      }

      // If payment is approved, update the reference (student_card, course, etc.)
      if (status === "approved" && localPayment.reference_type && localPayment.reference_id) {
        console.log(`Updating ${localPayment.reference_type} ${localPayment.reference_id} to active`);

        if (localPayment.reference_type === "student_card") {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await supabase
            .from("student_cards")
            .update({
              status: "active",
              paid_at: new Date().toISOString(),
              issued_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            })
            .eq("id", localPayment.reference_id);
        }

        if (localPayment.reference_type === "course") {
          // Create enrollment for the course
          // Evita matrícula duplicada quando o MP reenvia a mesma notificação.
          const { data: existingEnrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", localPayment.user_id)
            .eq("course_id", localPayment.reference_id)
            .maybeSingle();

          const { error: enrollmentError } = existingEnrollment
            ? { error: null }
            : await supabase
            .from("enrollments")
            .insert({
              user_id: localPayment.user_id,
              course_id: localPayment.reference_id,
              status: "in_progress",
              progress: 0,
            });

          if (enrollmentError) {
            console.error("Error creating enrollment:", enrollmentError);
          } else {
            console.log(`Enrollment created for user ${localPayment.user_id} in course ${localPayment.reference_id}`);
          }
        }
      }

      console.log("Payment updated successfully:", localPayment.id, status);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to avoid MP retries
    return new Response(JSON.stringify({ received: true, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
