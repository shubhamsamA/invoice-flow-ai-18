import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bill, error } = await admin
      .from("restaurant_bills")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!bill) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: items } = await admin
      .from("restaurant_bill_items")
      .select("*")
      .eq("bill_id", id)
      .order("sort_order");

    const { data: profile } = await admin
      .from("profiles")
      .select("business_name,business_address,business_phone,gst_number,bank_upi_id")
      .eq("user_id", bill.user_id)
      .maybeSingle();

    return new Response(JSON.stringify({ bill, items: items ?? [], profile: profile ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});