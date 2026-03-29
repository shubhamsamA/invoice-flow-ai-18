import type { CSSProperties } from "react";

import type { BuilderElement } from "@/types/builder";

export type PagePresetKey = "compact" | "a4" | "letter";

export interface PagePreset {
  key: PagePresetKey;
  label: string;
  width: number;
  height: number;
  cssSize: string;
}

export interface InvoiceLayoutData {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  status: string;
  subtotal: number;
  discount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  currency: string;
  notes?: string | null;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  client_gst?: string;
  items: { name: string; description?: string; quantity: number; unit_price: number; amount: number }[];
  business_name?: string;
  business_email?: string;
  business_address?: string;
  business_gst?: string;
  logo_url?: string;
  stamp_url?: string;
  signature_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_upi_id?: string;
  layout_json?: unknown;
}

export interface BuilderLayoutMeta {
  elements: BuilderElement[];
  canvasWidth: number;
  canvasHeight: number;
  pageSize: PagePresetKey;
  pageLocked: boolean;
}

export const PAGE_PRESETS: Record<PagePresetKey, PagePreset> = {
  compact: {
    key: "compact",
    label: "Compact",
    width: 640,
    height: 900,
    cssSize: "640px 900px",
  },
  a4: {
    key: "a4",
    label: "A4",
    width: 794,
    height: 1123,
    cssSize: "210mm 297mm",
  },
  letter: {
    key: "letter",
    label: "Letter",
    width: 816,
    height: 1056,
    cssSize: "8.5in 11in",
  },
};

export const DEFAULT_PAGE_PRESET: PagePresetKey = "compact";

export const SAMPLE_INVOICE_DATA: InvoiceLayoutData = {
  invoice_number: "INV-2026-014",
  issue_date: "2026-03-24",
  due_date: "2026-04-07",
  status: "unpaid",
  subtotal: 12500,
  discount: 750,
  gst_rate: 18,
  gst_amount: 2250,
  total: 14000,
  currency: "INR",
  notes: "Payment due within 14 days. Thank you for your business.",
  client_name: "Acme Retail Pvt Ltd",
  client_email: "accounts@acmeretail.com",
  client_address: "45 Park Street, Mumbai 400001",
  client_gst: "27AACCA1234Z1ZX",
  items: [
    {
      name: "Brand Strategy Sprint",
      description: "Research, workshop, and positioning system",
      quantity: 1,
      unit_price: 8500,
      amount: 8500,
    },
    {
      name: "Design System",
      description: "Invoice layout and reusable component styling",
      quantity: 1,
      unit_price: 4000,
      amount: 4000,
    },
  ],
  business_name: "Northstar Studio",
  business_email: "hello@northstar.studio",
  business_address: "22 Residency Road, Bengaluru 560025",
  business_gst: "29AAACN7788L1ZQ",
  logo_url: "",
  stamp_url: "",
  signature_url: "",
};

const FONT_FAMILIES = {
  sans: "Inter, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
} as const;

export function getFontFamily(fontFamily?: string) {
  return FONT_FAMILIES[(fontFamily as keyof typeof FONT_FAMILIES) || "sans"] || FONT_FAMILIES.sans;
}

export function getBuilderLayoutMeta(layout: unknown, fallbackWidth?: number, fallbackHeight?: number): BuilderLayoutMeta {
  const basePreset = PAGE_PRESETS[DEFAULT_PAGE_PRESET];

  if (Array.isArray(layout)) {
    return {
      elements: layout as BuilderElement[],
      canvasWidth: fallbackWidth || basePreset.width,
      canvasHeight: fallbackHeight || basePreset.height,
      pageSize: DEFAULT_PAGE_PRESET,
      pageLocked: false,
    };
  }

  const obj = (layout || {}) as Partial<BuilderLayoutMeta> & { pageSize?: string };
  const canvasWidth = Number(obj.canvasWidth) || fallbackWidth || basePreset.width;
  const canvasHeight = Number(obj.canvasHeight) || fallbackHeight || basePreset.height;
  const preset = Object.values(PAGE_PRESETS).find(
    (item) => item.key === obj.pageSize || (item.width === canvasWidth && item.height === canvasHeight),
  );

  return {
    elements: Array.isArray(obj.elements) ? (obj.elements as BuilderElement[]) : [],
    canvasWidth,
    canvasHeight,
    pageSize: preset?.key || DEFAULT_PAGE_PRESET,
    pageLocked: Boolean(obj.pageLocked),
  };
}

export function clampElementsToCanvas(elements: BuilderElement[], canvasWidth: number, canvasHeight: number) {
  return elements.map((element) => {
    const width = Math.min(element.width, canvasWidth);
    const height = Math.min(element.height, canvasHeight);

    return {
      ...element,
      width,
      height,
      x: Math.max(0, Math.min(element.x, canvasWidth - width)),
      y: Math.max(0, Math.min(element.y, canvasHeight - height)),
    };
  });
}

export function buildSampleInvoiceData(overrides: Partial<InvoiceLayoutData> = {}): InvoiceLayoutData {
  return {
    ...SAMPLE_INVOICE_DATA,
    ...overrides,
  };
}

export function resolveInvoiceText(template: string | undefined, data: InvoiceLayoutData) {
  const value = template || "";

  return value
    .replace(/\{\{invoice_number\}\}/g, data.invoice_number || "")
    .replace(/\{\{issue_date\}\}/g, data.issue_date || "")
    .replace(/\{\{due_date\}\}/g, data.due_date || "")
    .replace(/\{\{status\}\}/g, data.status || "")
    .replace(/\{\{notes\}\}/g, data.notes || "")
    .replace(/\{\{business_name\}\}/g, data.business_name || "")
    .replace(/\{\{business_email\}\}/g, data.business_email || "")
    .replace(/\{\{business_address\}\}/g, data.business_address || "")
    .replace(/\{\{client_name\}\}/g, data.client_name || "")
    .replace(/\{\{client_email\}\}/g, data.client_email || "")
    .replace(/\{\{client_address\}\}/g, data.client_address || "")
    .replace(/\{\{client_gst\}\}/g, data.client_gst || "")
    .replace(/\{\{subtotal\}\}/g, String(data.subtotal || ""))
    .replace(/\{\{total\}\}/g, String(data.total || ""));
}

export function getTextStyle(content: Record<string, any> = {}, fallbackColor = "#111827"): CSSProperties {
  return {
    fontSize: Number(content.fontSize) || 14,
    color: content.color || fallbackColor,
    fontFamily: getFontFamily(content.fontFamily),
    fontWeight: Number(content.fontWeight) || (content.bold ? 700 : 400),
    fontStyle: content.italic ? "italic" : "normal",
    textDecoration: content.underline ? "underline" : "none",
    textAlign: content.textAlign || "left",
    lineHeight: Number(content.lineHeight) || 1.4,
    letterSpacing: typeof content.letterSpacing === "number" ? `${content.letterSpacing}px` : undefined,
    textTransform: content.textTransform || "none",
    backgroundColor: content.backgroundColor || "transparent",
  };
}

export function getLabelStyle(content: Record<string, any> = {}): CSSProperties {
  return {
    fontSize: Number(content.labelFontSize) || 10,
    color: content.labelColor || "#8899a6",
    fontFamily: getFontFamily(content.fontFamily),
    fontWeight: Number(content.labelFontWeight) || 600,
    textTransform: content.labelTransform || "uppercase",
    letterSpacing: "0.08em",
  };
}

export function getPageCssSize(layout: BuilderLayoutMeta) {
  return PAGE_PRESETS[layout.pageSize]?.cssSize || `${layout.canvasWidth}px ${layout.canvasHeight}px`;
}

export function toInlineStyle(style: CSSProperties) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}:${String(value)};`;
    })
    .join("");
}