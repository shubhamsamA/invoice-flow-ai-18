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
  | "divider";

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
};

/** Default content for each element type */
export const DEFAULT_CONTENT: Record<BuilderElementType, Record<string, any>> = {
  note: { text: "Your text here", fontSize: 14, bold: false },
  logo: { url: "", placeholder: true },
  "client-details": { name: "Client Name", email: "client@example.com", address: "123 Main St", gst: "GSTIN" },
  "items-table": { items: [{ name: "Item 1", qty: 1, price: 0 }] },
  "total-summary": { subtotal: 0, gst: 18, discount: 0 },
  signature: { label: "Authorized Signature", signed: false },
  divider: { style: "solid" },
};
