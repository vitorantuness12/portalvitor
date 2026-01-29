import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  referenceType: "student_card" | "course";
  referenceId: string;
  amount: number;
  paymentMethod: "pix" | "credit_card" | "debit_card";
  description: string;
  payerEmail: string;
  payerName: string;
  payerCpf?: string;
  // Card data (only for card payments)
  cardToken?: string;
  installments?: number;
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreatePaymentRequest = await req.json();
    const { referenceType, referenceId, amount, paymentMethod, description, payerEmail, payerName, payerCpf, cardToken, installments } = body;

    // Validate required fields
    if (!referenceType || !referenceId || !amount || !paymentMethod || !description || !payerEmail || !payerName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create local payment record first
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userData.user.id,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        payment_method: paymentMethod,
        status: "pending",
        metadata: { description, payer_email: payerEmail, payer_name: payerName },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      throw new Error("Failed to create payment record");
    }

    // Build Mercado Pago payment request
    let mpPaymentData: Record<string, unknown> = {
      transaction_amount: amount,
      description,
      external_reference: payment.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      payer: {
        email: payerEmail,
        first_name: payerName.split(" ")[0],
        last_name: payerName.split(" ").slice(1).join(" ") || payerName.split(" ")[0],
      },
    };

    if (payerCpf) {
      mpPaymentData.payer = {
        ...mpPaymentData.payer as object,
        identification: {
          type: "CPF",
          number: payerCpf.replace(/\D/g, ""),
        },
      };
    }

    // Configure payment method specific options
    if (paymentMethod === "pix") {
      mpPaymentData.payment_method_id = "pix";
    } else if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      if (!cardToken) {
        return new Response(JSON.stringify({ error: "Card token is required for card payments" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      mpPaymentData.token = cardToken;
      mpPaymentData.installments = installments || 1;
      mpPaymentData.payment_method_id = paymentMethod === "debit_card" ? "debit_card" : undefined;
    }

    console.log("Creating payment in Mercado Pago:", JSON.stringify(mpPaymentData, null, 2));

    // Call Mercado Pago API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": payment.id,
      },
      body: JSON.stringify(mpPaymentData),
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago API error:", mpResult);
      
      // Update local payment with error
      await supabase
        .from("payments")
        .update({
          status: "rejected",
          mercado_pago_status: "error",
          metadata: { ...payment.metadata, error: mpResult },
        })
        .eq("id", payment.id);

      return new Response(JSON.stringify({ error: "Payment creation failed", details: mpResult }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Mercado Pago response:", JSON.stringify(mpResult, null, 2));

    // Update local payment with Mercado Pago data
    const updateData: Record<string, unknown> = {
      mercado_pago_id: mpResult.id.toString(),
      mercado_pago_status: mpResult.status,
    };

    // Handle PIX specific data
    if (paymentMethod === "pix" && mpResult.point_of_interaction?.transaction_data) {
      const pixData = mpResult.point_of_interaction.transaction_data;
      updateData.pix_qr_code = pixData.qr_code;
      updateData.pix_qr_code_base64 = pixData.qr_code_base64;
      updateData.pix_expiration = mpResult.date_of_expiration;
    }

    // Handle card specific data
    if ((paymentMethod === "credit_card" || paymentMethod === "debit_card") && mpResult.card) {
      updateData.card_last_four = mpResult.card.last_four_digits;
      updateData.card_brand = mpResult.card.payment_method?.name || mpResult.payment_method_id;
    }

    // Update status based on MP status
    if (mpResult.status === "approved") {
      updateData.status = "approved";
      updateData.paid_at = new Date().toISOString();
    } else if (mpResult.status === "rejected") {
      updateData.status = "rejected";
    }

    await supabase
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        mercadoPagoId: mpResult.id,
        status: mpResult.status,
        statusDetail: mpResult.status_detail,
        // PIX specific
        pixQrCode: updateData.pix_qr_code,
        pixQrCodeBase64: updateData.pix_qr_code_base64,
        pixExpiration: updateData.pix_expiration,
        // Card specific
        cardLastFour: updateData.card_last_four,
        cardBrand: updateData.card_brand,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
