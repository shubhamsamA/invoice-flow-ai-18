import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BuilderLivePreview } from "@/components/builder/BuilderLivePreview";
import { SAMPLE_INVOICE_DATA } from "@/lib/invoice-layout";
import type { BuilderElement } from "@/types/builder";

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateDescription?: string;
  elements: BuilderElement[];
  canvasWidth?: number;
  canvasHeight?: number;
  /** Called when user confirms selecting this template */
  onSelect?: () => void;
  /** Called when user wants to duplicate into builder */
  onDuplicate?: () => void;
}

export function TemplatePreviewModal({
  open,
  onOpenChange,
  templateName,
  templateDescription,
  elements,
  canvasWidth = 640,
  canvasHeight = 900,
  onSelect,
  onDuplicate,
}: TemplatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold">{templateName}</DialogTitle>
          {templateDescription && (
            <p className="text-xs text-muted-foreground mt-1">{templateDescription}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="flex items-start justify-center p-6">
            <div
              className="relative bg-white shadow-lg border rounded-sm"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                minWidth: Math.min(canvasWidth, 500),
                transform: canvasWidth > 600 ? "scale(0.75)" : undefined,
                transformOrigin: "top center",
              }}
            >
              {elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute overflow-hidden"
                  style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                >
                  <PreviewElementInline element={el} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2 sm:gap-2">
          {onDuplicate && (
            <Button variant="outline" className="gap-2" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
              Customize in Builder
            </Button>
          )}
          {onSelect && (
            <Button className="gap-2" onClick={onSelect}>
              <Check className="h-4 w-4" />
              Use Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Lightweight inline preview element renderer using sample data */
function PreviewElementInline({ element }: { element: BuilderElement }) {
  const { type, content } = element;
  const c = content || {};
  const data = SAMPLE_INVOICE_DATA;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  switch (type) {
    case "text":
      return (
        <div className="w-full h-full flex items-center px-3" style={{
          fontSize: c.fontSize || 14,
          fontWeight: c.bold ? 700 : (c.fontWeight || 400),
          color: c.color || "#111827",
          textAlign: c.textAlign || "left",
        }}>
          <p>{(c.text || "Text").replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => (data as any)[k] || k)}</p>
        </div>
      );
    case "logo":
      return (
        <div className="h-full flex items-center justify-center">
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f" }}>{data.business_name || "Company"}</div>
        </div>
      );
    case "client-details":
      return (
        <div className="p-3 space-y-1" style={{ fontSize: 12 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", fontWeight: 600 }}>Bill To</div>
          <p style={{ fontWeight: 500 }}>{data.client_name}</p>
          <p style={{ color: "#666" }}>{data.client_email}</p>
          <p style={{ color: "#666" }}>{data.client_address}</p>
        </div>
      );
    case "business-details":
      return (
        <div className="p-3 space-y-1" style={{ fontSize: 12 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", fontWeight: 600 }}>From</div>
          <p style={{ fontWeight: 500 }}>{data.business_name}</p>
          <p style={{ color: "#666" }}>{data.business_email}</p>
        </div>
      );
    case "invoice-number":
      return (
        <div className="h-full flex items-center px-3">
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", fontWeight: 600 }}>Invoice #</div>
            <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>{data.invoice_number}</p>
          </div>
        </div>
      );
    case "invoice-date":
      return (
        <div className="h-full flex items-start px-3 py-2">
          <div className="space-y-1">
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#8899a6", fontWeight: 600 }}>Date</div>
            <div style={{ fontSize: 12 }}>Issue: {data.issue_date}</div>
            <div style={{ fontSize: 12 }}>Due: {data.due_date}</div>
          </div>
        </div>
      );
    case "items-table":
      return (
        <div className="p-3" style={{ fontSize: 11 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 6px", fontSize: 9, textTransform: "uppercase", color: "#8899a6", borderBottom: "2px solid #e8edf2" }}>Description</th>
                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 9, textTransform: "uppercase", color: "#8899a6", borderBottom: "2px solid #e8edf2" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 9, textTransform: "uppercase", color: "#8899a6", borderBottom: "2px solid #e8edf2" }}>Price</th>
                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 9, textTransform: "uppercase", color: "#8899a6", borderBottom: "2px solid #e8edf2" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee" }}>{item.name}</td>
                  <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", textAlign: "right" }}>{fmt(item.unit_price)}</td>
                  <td style={{ padding: "4px 6px", borderBottom: "1px solid #eee", textAlign: "right", fontWeight: 500 }}>{fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "total-summary":
      return (
        <div className="p-3 space-y-1" style={{ fontSize: 12 }}>
          <div className="flex justify-between"><span style={{ color: "#666" }}>Subtotal</span><span>{fmt(data.subtotal)}</span></div>
          {data.gst_rate > 0 && <div className="flex justify-between"><span style={{ color: "#666" }}>GST ({data.gst_rate}%)</span><span>+{fmt(data.gst_amount)}</span></div>}
          {data.discount > 0 && <div className="flex justify-between"><span style={{ color: "#666" }}>Discount</span><span style={{ color: "#2e8b57" }}>-{fmt(data.discount)}</span></div>}
          <div className="flex justify-between pt-1" style={{ fontWeight: 700, borderTop: "2px solid #1e3a5f" }}>
            <span>Total</span><span>{fmt(data.total)}</span>
          </div>
        </div>
      );
    case "divider":
      return (
        <div className="h-full flex items-center px-4">
          <hr style={{ width: "100%", border: "none", borderTop: `${c.thickness || 1}px ${c.style || "solid"} ${c.color || "#ddd"}` }} />
        </div>
      );
    case "signature":
      return (
        <div className="h-full flex flex-col items-center justify-end p-3">
          <div style={{ height: 30, width: "100%", borderBottom: "1px solid #ccc" }} />
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>{c.label || "Authorized Signatory"}</div>
        </div>
      );
    case "bank-details":
      return (
        <div className="p-3 space-y-1" style={{ fontSize: 11 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: "#8899a6", fontWeight: 600 }}>Bank Details</div>
          <p style={{ fontWeight: 500 }}>A/C Name: Sample Account</p>
          <p style={{ fontFamily: "monospace", fontSize: 10 }}>A/C No: XXXX-XXXX-1234</p>
        </div>
      );
    case "stamp":
      return (
        <div className="h-full flex items-center justify-center">
          <div style={{ fontSize: 10, color: "#8899a6" }}>Company Stamp</div>
        </div>
      );
    case "note":
      return (
        <div className="h-full flex items-start px-3 py-2" style={{ fontSize: 11, color: "#555" }}>
          <p>{c.text || data.notes || "Note"}</p>
        </div>
      );
    default:
      return <div style={{ padding: 8, fontSize: 11, color: "#888" }}>Unknown</div>;
  }
}
