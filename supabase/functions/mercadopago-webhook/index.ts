import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

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
          const { error: enrollmentError } = await supabase
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
