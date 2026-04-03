/**
 * Invoice Builder Types
 *
 * Each component on the canvas is a BuilderElement with position, size, and type-specific content.
 * The full layout is serialized as JSON for saving/loading templates.
 */

export type BuilderElementType =
  | "text"
  | "logo"
  | "client-details"
  | "items-table"
  | "total-summary"
  | "signature"
  | "divider"
  | "stamp"
  | "business-details"
  | "note"
  | "invoice-number"
  | "invoice-date"
  | "bank-details";

export interface BuilderElement {
  id: string;
  type: BuilderElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: Record<string, any>;
  locked?: boolean;
}

export interface BuilderLayout {
  id: string;
  name: string;
  elements: BuilderElement[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  pageSize?: string;
  pageLocked?: boolean;
}

/** Grid snap size in pixels */
export const GRID_SIZE = 16;

/** Snap a value to the nearest grid line */
export const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

/** Default dimensions for each element type */
export const DEFAULT_SIZES: Record<BuilderElementType, { width: number; height: number }> = {
  text: { width: 320, height: 48 },
  logo: { width: 160, height: 80 },
  "client-details": { width: 320, height: 144 },
  "items-table": { width: 544, height: 224 },
  "total-summary": { width: 288, height: 176 },
  signature: { width: 240, height: 96 },
  divider: { width: 544, height: 16 },
  stamp: { width: 120, height: 120 },
  "business-details": { width: 320, height: 160 },
  note: { width: 400, height: 80 },
  "invoice-number": { width: 280, height: 48 },
  "invoice-date": { width: 280, height: 48 },
  "bank-details": { width: 320, height: 160 },
};

/** Default content for each element type */
export const DEFAULT_CONTENT: Record<BuilderElementType, Record<string, any>> = {
  text: { text: "Your text here", fontSize: 14, bold: false },
  logo: { url: "", placeholder: true },
  "client-details": { name: "Client Name", email: "client@example.com", address: "123 Main St", gst: "GSTIN" },
  "items-table": { items: [{ name: "Item 1", hsn_sac: "", qty: 1, price: 0, gst_type: "none", gst_rate: 0 }], columns: { slNo: "Sl.No", description: "Description", hsnSac: "HSN/SAC", qty: "Qty", price: "Price", gstType: "GST Type", gstRate: "GST%", gstAmt: "GST Amt", total: "Total" }, visibleColumns: { slNo: true, description: true, hsnSac: true, qty: true, price: true, gstType: true, gstRate: true, gstAmt: true, total: true } },
  "total-summary": { subtotal: 0, gst: 18, discount: 0 },
  signature: { label: "Authorized Signature", signed: false },
  divider: { style: "solid", color: "#dddddd", thickness: 1, spacing: 0 },
  stamp: { url: "", placeholder: true },
  "business-details": { name: "Your Business", email: "info@business.com", phone: "+91 00000 00000", address: "Business Address", gst: "GSTIN" },
  note: { text: "Thank you for your business!", fontSize: 12 },
  "invoice-number": { label: "Invoice #", value: "{{invoice_number}}" },
  "invoice-date": { label: "Date", showIssue: true, showDue: true },
  "bank-details": { accountName: "Your Business Name", accountNumber: "1234567890", ifsc: "SBIN0001234", bankName: "State Bank of India", branch: "Main Branch", upiId: "" },
};
