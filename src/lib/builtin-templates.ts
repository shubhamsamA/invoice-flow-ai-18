import { BuilderElement } from "@/types/builder";
import { DEFAULT_SIZES, DEFAULT_CONTENT } from "@/types/builder";

export interface BuiltinTemplate {
  id: string;
  name: string;
  elements: BuilderElement[];
}

/** Helper to generate fresh IDs each time templates are accessed */
function el(type: BuilderElement["type"], x: number, y: number, width: number, height: number, content: Record<string, any>): BuilderElement {
  return { id: crypto.randomUUID(), type, x, y, width, height, content };
}

export function getBuiltinTemplates(): BuiltinTemplate[] {
  return [
    {
      id: "minimal",
      name: "Minimal",
      elements: [
        el("text", 32, 32, 320, 48, { text: "INVOICE", fontSize: 24, bold: true }),
        el("client-details", 32, 96, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("divider", 32, 256, ...Object.values(DEFAULT_SIZES["divider"]) as [number, number], DEFAULT_CONTENT["divider"]),
        el("items-table", 32, 288, ...Object.values(DEFAULT_SIZES["items-table"]) as [number, number], DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 528, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("signature", 32, 736, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
      ],
    },
    {
      id: "corporate",
      name: "Corporate",
      elements: [
        el("logo", 32, 32, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("text", 208, 48, 400, 48, { text: "CORPORATE INVOICE", fontSize: 22, bold: true }),
        el("client-details", 32, 128, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 288, 576, 256, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 560, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("signature", 32, 768, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
      ],
    },
    {
      id: "freelance",
      name: "Modern Freelance",
      elements: [
        el("divider", 32, 16, 576, 16, { style: "solid" }),
        el("logo", 32, 48, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("text", 32, 144, 400, 48, { text: "Invoice", fontSize: 28, bold: true }),
        el("client-details", 32, 208, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 368, ...Object.values(DEFAULT_SIZES["items-table"]) as [number, number], DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 608, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
      ],
    },
    {
      id: "gst",
      name: "Indian GST",
      elements: [
        el("text", 160, 32, 320, 48, { text: "TAX INVOICE", fontSize: 22, bold: true }),
        el("logo", 32, 32, 112, 64, DEFAULT_CONTENT["logo"]),
        el("client-details", 32, 112, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], { ...DEFAULT_CONTENT["client-details"], gst: "07AABCU9603R1ZM" }),
        el("divider", 32, 272, 576, 16, DEFAULT_CONTENT["divider"]),
        el("items-table", 32, 304, 576, 256, { items: [{ name: "Service (HSN 998311)", qty: 1, price: 10000 }] }),
        el("total-summary", 320, 576, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], { subtotal: 10000, gst: 18, discount: 0 }),
        el("signature", 32, 768, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
      ],
    },
    {
      id: "professional",
      name: "Professional",
      elements: [
        el("logo", 32, 32, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("business-details", 320, 32, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("divider", 32, 200, 576, 16, { style: "solid", color: "#333333", thickness: 2 }),
        el("invoice-number", 32, 224, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 320, 224, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("client-details", 32, 288, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 448, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 704, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("note", 32, 704, 280, 80, { text: "Thank you for your business!", fontSize: 12 }),
        el("signature", 32, 800, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
      ],
    },
    {
      id: "consulting",
      name: "Consulting",
      elements: [
        el("text", 32, 32, 400, 48, { text: "CONSULTING INVOICE", fontSize: 22, bold: true, fontFamily: "serif" }),
        el("business-details", 32, 96, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("invoice-number", 400, 96, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 400, 160, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("divider", 32, 264, 576, 16, { style: "dashed", color: "#999999", thickness: 1 }),
        el("client-details", 32, 288, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 448, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 704, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("bank-details", 32, 704, ...Object.values(DEFAULT_SIZES["bank-details"]) as [number, number], DEFAULT_CONTENT["bank-details"]),
        el("note", 32, 870, 576, 48, { text: "Payment is due within 30 days of invoice date.", fontSize: 11, italic: true }),
      ],
    },
    {
      id: "creative",
      name: "Creative Studio",
      elements: [
        el("divider", 32, 16, 576, 16, { style: "solid", color: "#6366f1", thickness: 4 }),
        el("logo", 32, 48, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("text", 208, 56, 400, 48, { text: "STUDIO INVOICE", fontSize: 24, bold: true, letterSpacing: 2, textTransform: "uppercase" }),
        el("invoice-number", 32, 144, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 320, 144, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("divider", 32, 200, 576, 16, { style: "solid", color: "#e5e7eb", thickness: 1 }),
        el("client-details", 32, 224, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 384, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 640, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("signature", 32, 640, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
        el("divider", 32, 760, 576, 16, { style: "solid", color: "#6366f1", thickness: 4 }),
      ],
    },
    {
      id: "services",
      name: "Service Provider",
      elements: [
        el("logo", 32, 32, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("business-details", 320, 32, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("text", 32, 200, 576, 48, { text: "SERVICE INVOICE", fontSize: 20, bold: true, textAlign: "center" }),
        el("divider", 32, 256, 576, 16, { style: "double", color: "#333333", thickness: 3 }),
        el("invoice-number", 32, 280, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 320, 280, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("client-details", 32, 344, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 504, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 760, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("bank-details", 32, 760, ...Object.values(DEFAULT_SIZES["bank-details"]) as [number, number], DEFAULT_CONTENT["bank-details"]),
        el("stamp", 480, 760, ...Object.values(DEFAULT_SIZES["stamp"]) as [number, number], DEFAULT_CONTENT["stamp"]),
      ],
    },
  ];
}
