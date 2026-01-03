import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, url }: PushNotificationRequest = await req.json();

    console.log(`Sending push notification to user: ${userId}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Send push notification to each subscription
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const payload = JSON.stringify({
            title,
            body,
            icon: "/favicon.ico",
            url: url || "/",
            timestamp: Date.now(),
          });

          // Use web-push compatible format
          const response = await fetch(subscription.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              TTL: "86400",
            },
            body: payload,
          });

          if (!response.ok) {
            console.log(`Push failed for endpoint: ${subscription.endpoint}, status: ${response.status}`);
            // If subscription is expired, delete it
            if (response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", subscription.id);
            }
            return { success: false, endpoint: subscription.endpoint };
          }

          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error(`Error sending to subscription:`, error);
          return { success: false, endpoint: subscription.endpoint };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(`Push notifications sent: ${successCount}/${results.length}`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: results.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-push-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
