import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANVAS = { width: 640, height: 900 }; // compact preset

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an invoice layout designer. Given a description, generate a JSON array of invoice builder elements that form a professional invoice layout.

Canvas size: ${CANVAS.width}x${CANVAS.height} pixels. All elements must fit within these bounds.
Grid snap: 16px (all x, y, width, height values must be multiples of 16).

Available element types and their purposes:
- "text": Free text block. content: { text: string, fontSize: number (10-32), bold: boolean, color: string (hex), fontFamily: "sans"|"serif"|"mono", textAlign: "left"|"center"|"right", textTransform: "none"|"uppercase"|"lowercase" }
- "logo": Company logo placeholder. content: { placeholder: true }
- "business-details": Business info block. content: { name: "Your Business", email: "info@business.com", phone: "+91 00000 00000", address: "Business Address", gst: "GSTIN" }
- "client-details": Client info block. content: { name: "Client Name", email: "client@example.com", address: "123 Main St", gst: "GSTIN" }
- "invoice-number": Invoice number field. content: { label: "Invoice #", value: "{{invoice_number}}" }
- "invoice-date": Date fields. content: { label: "Date", showIssue: true, showDue: true }
- "items-table": Line items table. content: { items: [{ name: "Item 1", hsn_sac: "", qty: 1, price: 0, gst_type: "none", gst_rate: 0 }], visibleColumns: { slNo: true, description: true, hsnSac: false, qty: true, price: true, gstType: false, gstRate: false, gstAmt: false, total: true } }
- "total-summary": Totals section. content: { subtotal: 0, gst: 18, discount: 0 }
- "divider": Horizontal line. content: { style: "solid"|"dashed"|"dotted", color: "#dddddd", thickness: 1-4, spacing: 0-16 }
- "note": Footer note. content: { text: "Thank you for your business!", fontSize: 12 }
- "signature": Signature area. content: { label: "Authorized Signature", signed: false }
- "bank-details": Bank payment info. content: { accountName: "Your Business", accountNumber: "1234567890", ifsc: "SBIN0001234", bankName: "State Bank of India", branch: "Main Branch", upiId: "" }

Each element needs: id (unique string like "el-1"), type, x, y, width, height, content.
Create a complete, well-spaced invoice layout. Position elements logically: header at top (logo, business details, invoice number/date), client details below, items table in the middle, totals, notes, and signature at the bottom.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_invoice_layout",
                description: "Create an invoice layout as an array of positioned elements",
                parameters: {
                  type: "object",
                  properties: {
                    elements: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: {
                            type: "string",
                            enum: [
                              "text", "logo", "client-details", "items-table",
                              "total-summary", "signature", "divider", "stamp",
                              "business-details", "note", "invoice-number",
                              "invoice-date", "bank-details",
                            ],
                          },
                          x: { type: "number" },
                          y: { type: "number" },
                          width: { type: "number" },
                          height: { type: "number" },
                          content: { type: "object" },
                        },
                        required: ["id", "type", "x", "y", "width", "height", "content"],
                      },
                    },
                  },
                  required: ["elements"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_invoice_layout" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No layout data returned from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Snap all positions to grid and clamp to canvas
    const elements = (parsed.elements || []).map((el: any, i: number) => {
      const snap = (v: number) => Math.round(v / 16) * 16;
      const width = Math.min(snap(el.width) || 320, CANVAS.width);
      const height = snap(el.height) || 48;
      return {
        ...el,
        id: el.id || `el-${i + 1}`,
        x: Math.max(0, Math.min(snap(el.x) || 0, CANVAS.width - width)),
        y: Math.max(0, snap(el.y) || 0),
        width,
        height,
        content: el.content || {},
      };
    });

    return new Response(
      JSON.stringify({ elements, canvasWidth: CANVAS.width, canvasHeight: CANVAS.height, pageSize: "compact", pageLocked: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-invoice-design error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
