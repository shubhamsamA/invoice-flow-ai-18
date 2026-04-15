import { BuilderElement } from "@/types/builder";
import { DEFAULT_SIZES, DEFAULT_CONTENT } from "@/types/builder";

export interface BuiltinTemplate {
  id: string;
  name: string;
  description: string;
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
      description: "Clean and simple layout",
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
      description: "Logo & formal branding",
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
      description: "Stylish personal branding",
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
      description: "HSN codes & tax breakdown",
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
      description: "Full business details & notes",
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
      description: "Bank details & payment terms",
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
      description: "Bold accents & double borders",
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
      description: "Bank, stamp & full details",
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
    // --- New templates ---
    {
      id: "retail",
      name: "Retail",
      description: "Product-focused with quantities",
      elements: [
        el("logo", 32, 32, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("text", 208, 40, 400, 48, { text: "RETAIL INVOICE", fontSize: 22, bold: true }),
        el("invoice-number", 32, 120, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 320, 120, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("divider", 32, 176, 576, 16, { style: "solid", color: "#e5e7eb", thickness: 1 }),
        el("client-details", 32, 200, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 360, 576, 280, { items: [{ name: "Product A", qty: 2, price: 500 }, { name: "Product B", qty: 1, price: 1200 }] }),
        el("total-summary", 320, 660, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("note", 32, 660, 280, 64, { text: "Exchange within 7 days with original receipt.", fontSize: 10 }),
        el("divider", 32, 740, 576, 16, { style: "solid", color: "#e5e7eb", thickness: 1 }),
      ],
    },
    {
      id: "export",
      name: "Export",
      description: "International trade & shipping",
      elements: [
        el("logo", 32, 32, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("text", 208, 40, 400, 48, { text: "EXPORT INVOICE", fontSize: 22, bold: true }),
        el("business-details", 32, 120, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("invoice-number", 400, 120, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 400, 184, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("divider", 32, 280, 576, 16, { style: "double", color: "#333333", thickness: 2 }),
        el("client-details", 32, 304, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], { ...DEFAULT_CONTENT["client-details"] }),
        el("note", 320, 304, 280, 96, { text: "Port of Loading: Mumbai\nPort of Discharge: London\nTerms: FOB", fontSize: 11 }),
        el("items-table", 32, 480, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 740, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("bank-details", 32, 740, ...Object.values(DEFAULT_SIZES["bank-details"]) as [number, number], DEFAULT_CONTENT["bank-details"]),
        el("signature", 32, 900, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
        el("stamp", 480, 870, ...Object.values(DEFAULT_SIZES["stamp"]) as [number, number], DEFAULT_CONTENT["stamp"]),
      ],
    },
    {
      id: "proforma",
      name: "Proforma",
      description: "Pre-sale quotation format",
      elements: [
        el("text", 32, 32, 576, 48, { text: "PROFORMA INVOICE", fontSize: 24, bold: true, textAlign: "center" }),
        el("divider", 32, 88, 576, 16, { style: "solid", color: "#6366f1", thickness: 3 }),
        el("logo", 32, 112, ...Object.values(DEFAULT_SIZES["logo"]) as [number, number], DEFAULT_CONTENT["logo"]),
        el("business-details", 320, 112, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("invoice-number", 32, 264, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 320, 264, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("client-details", 32, 328, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 488, 576, 240, DEFAULT_CONTENT["items-table"]),
        el("total-summary", 320, 744, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("note", 32, 744, 280, 80, { text: "This is a proforma invoice and not a demand for payment. Valid for 30 days.", fontSize: 10, italic: true }),
        el("signature", 32, 850, ...Object.values(DEFAULT_SIZES["signature"]) as [number, number], DEFAULT_CONTENT["signature"]),
      ],
    },
    {
      id: "hourly",
      name: "Hourly Billing",
      description: "Time-based consulting rates",
      elements: [
        el("text", 32, 32, 400, 48, { text: "TIME & MATERIALS INVOICE", fontSize: 20, bold: true }),
        el("logo", 480, 32, 112, 64, DEFAULT_CONTENT["logo"]),
        el("divider", 32, 104, 576, 16, { style: "dashed", color: "#94a3b8", thickness: 1 }),
        el("business-details", 32, 128, ...Object.values(DEFAULT_SIZES["business-details"]) as [number, number], DEFAULT_CONTENT["business-details"]),
        el("invoice-number", 400, 128, ...Object.values(DEFAULT_SIZES["invoice-number"]) as [number, number], DEFAULT_CONTENT["invoice-number"]),
        el("invoice-date", 400, 192, ...Object.values(DEFAULT_SIZES["invoice-date"]) as [number, number], DEFAULT_CONTENT["invoice-date"]),
        el("client-details", 32, 288, ...Object.values(DEFAULT_SIZES["client-details"]) as [number, number], DEFAULT_CONTENT["client-details"]),
        el("items-table", 32, 448, 576, 240, { items: [{ name: "Consulting – 8 hrs @ ₹2,000/hr", qty: 8, price: 2000 }, { name: "Research – 4 hrs @ ₹1,500/hr", qty: 4, price: 1500 }] }),
        el("total-summary", 320, 704, ...Object.values(DEFAULT_SIZES["total-summary"]) as [number, number], DEFAULT_CONTENT["total-summary"]),
        el("bank-details", 32, 704, ...Object.values(DEFAULT_SIZES["bank-details"]) as [number, number], DEFAULT_CONTENT["bank-details"]),
        el("note", 32, 870, 576, 48, { text: "All hours logged are subject to client approval.", fontSize: 10 }),
      ],
    },
  ];
}

/** Schematic thumbnail SVG for each template type */
const TEMPLATE_THUMBNAILS: Record<string, JSX.Element> = {};

/** Returns a mini schematic SVG representing the template layout */
export function getTemplateThumbnail(templateId: string): JSX.Element | null {
  // Build thumbnails based on element types in each template
  const templates = getBuiltinTemplates();
  const template = templates.find(t => t.id === templateId);
  if (!template) return null;

  // Normalize coordinates to fit 160x120 thumbnail
  const maxX = 640, maxY = 960;
  const scale = (v: number, max: number, target: number) => (v / max) * target;

  return (
    <svg viewBox="0 0 160 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="120" rx="4" className="fill-muted/50" />
      {template.elements.map((el, i) => {
        const sx = scale(el.x, maxX, 160);
        const sy = scale(el.y, maxY, 120);
        const sw = scale(el.width, maxX, 160);
        const sh = scale(el.height, maxY, 120);

        let fill = "hsl(var(--muted-foreground) / 0.15)";
        let stroke = "none";

        switch (el.type) {
          case "text": fill = "hsl(var(--primary) / 0.3)"; break;
          case "logo": fill = "hsl(var(--primary) / 0.5)"; break;
          case "items-table": fill = "hsl(var(--muted-foreground) / 0.12)"; stroke = "hsl(var(--muted-foreground) / 0.2)"; break;
          case "total-summary": fill = "hsl(var(--primary) / 0.2)"; break;
          case "divider": fill = "hsl(var(--muted-foreground) / 0.25)"; break;
          case "signature": fill = "hsl(var(--muted-foreground) / 0.1)"; break;
          case "bank-details": fill = "hsl(var(--muted-foreground) / 0.08)"; break;
          case "stamp": fill = "hsl(var(--destructive) / 0.15)"; break;
          case "note": fill = "hsl(var(--primary) / 0.08)"; break;
        }

        return (
          <rect
            key={i}
            x={sx}
            y={sy}
            width={Math.max(sw, 2)}
            height={Math.max(sh, 1)}
            rx={1}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
}
