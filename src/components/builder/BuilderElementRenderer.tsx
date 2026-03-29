import { BuilderElement } from "@/types/builder";
import { Type, Image, Users, Table, Calculator, PenTool, Stamp, Building2, StickyNote, Hash, CalendarDays, Landmark } from "lucide-react";
import { getFontFamily } from "@/lib/invoice-layout";

interface Props {
  element: BuilderElement;
  selected: boolean;
}

/** Build inline styles from content font props */
function fontStyle(c: Record<string, any>, defaults: { fontSize?: number; fontWeight?: number; color?: string } = {}) {
  const style: React.CSSProperties = {
    fontFamily: getFontFamily(c.fontFamily),
    fontSize: c.fontSize || defaults.fontSize,
    fontWeight: c.fontWeight || (c.bold ? 700 : defaults.fontWeight || 400),
    color: c.color || defaults.color,
    fontStyle: c.italic ? "italic" : undefined,
    textDecoration: c.underline ? "underline" : undefined,
    textAlign: c.textAlign || undefined,
    lineHeight: c.lineHeight || undefined,
    letterSpacing: typeof c.letterSpacing === "number" ? `${c.letterSpacing}px` : undefined,
    textTransform: c.textTransform || undefined,
    backgroundColor: c.backgroundColor && c.backgroundColor !== "transparent" ? c.backgroundColor : undefined,
  };
  return style;
}

export function BuilderElementRenderer({ element, selected }: Props) {
  const { type, content } = element;

  switch (type) {
    case "text": {
      const style = fontStyle(content, { fontSize: 14 });
      return (
        <div className="h-full flex items-center px-3" style={{ backgroundColor: style.backgroundColor }}>
          <p className="w-full outline-none" style={{ ...style, backgroundColor: undefined }}>
            {content.text || "Text"}
          </p>
        </div>
      );
    }

    case "logo":
      return (
        <div className="h-full flex items-center justify-center bg-muted/30 rounded-md">
          {content.url ? (
            <img src={content.url} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Image className="h-6 w-6" />
              <span className="text-[10px]">Drop logo here</span>
            </div>
          )}
        </div>
      );

    case "stamp":
      return (
        <div className="h-full flex items-center justify-center bg-muted/30 rounded-md">
          {content.url ? (
            <img src={content.url} alt="Stamp" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Stamp className="h-6 w-6" />
              <span className="text-[10px]">Company Stamp</span>
            </div>
          )}
        </div>
      );

    case "business-details": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="p-3 space-y-1" style={style}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <Building2 className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Business</span>
          </div>
          <p className="font-medium text-sm">{content.name}</p>
          <p className="text-muted-foreground">{content.email}</p>
          <p className="text-muted-foreground">{content.phone}</p>
          <p className="text-muted-foreground">{content.address}</p>
          <p className="text-muted-foreground font-mono text-[10px]">{content.gst}</p>
        </div>
      );
    }

    case "note": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="h-full flex items-start px-3 py-2">
          <div className="w-full">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <StickyNote className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Note</span>
            </div>
            <p className="text-xs" style={style}>
              {content.text || "Add a note..."}
            </p>
          </div>
        </div>
      );
    }

    case "invoice-number": {
      const style = fontStyle(content, { fontSize: 14 });
      return (
        <div className="h-full flex items-center px-3">
          <div className="w-full" style={style}>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Hash className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider font-medium">{content.label || "Invoice #"}</span>
            </div>
            <p className="text-sm font-semibold font-mono">{content.value || "{{invoice_number}}"}</p>
          </div>
        </div>
      );
    }

    case "invoice-date": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="h-full flex items-start px-3 py-2">
          <div className="w-full space-y-1.5" style={style}>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CalendarDays className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider font-medium">{content.label || "Date"}</span>
            </div>
            {content.showIssue !== false && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Issue:</span>
                <span className="font-medium font-mono">{"{{issue_date}}"}</span>
              </div>
            )}
            {content.showDue !== false && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium font-mono">{"{{due_date}}"}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    case "client-details": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="p-3 space-y-1" style={style}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <Users className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Client</span>
          </div>
          <p className="font-medium text-sm">{content.name}</p>
          <p className="text-muted-foreground">{content.email}</p>
          <p className="text-muted-foreground">{content.address}</p>
          <p className="text-muted-foreground font-mono text-[10px]">{content.gst}</p>
        </div>
      );
    }

    case "items-table": {
      const cols = content.columns || { description: "Description", qty: "Qty", price: "Price", total: "Total" };
      const style = fontStyle(content, { fontSize: 11 });
      return (
        <div className="p-3" style={style}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Table className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Items</span>
          </div>
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-px bg-muted text-[10px] uppercase tracking-wider font-medium px-2 py-1.5">
              <span className="col-span-5">{cols.description}</span>
              <span className="col-span-2 text-right">{cols.qty}</span>
              <span className="col-span-3 text-right">{cols.price}</span>
              <span className="col-span-2 text-right">{cols.total}</span>
            </div>
            {(content.items || []).map((item: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-px px-2 py-1.5 border-t text-[11px]">
                <span className="col-span-5 truncate">{item.name || "—"}</span>
                <span className="col-span-2 text-right tabular-nums">{item.qty}</span>
                <span className="col-span-3 text-right tabular-nums">₹{(item.price || 0).toLocaleString("en-IN")}</span>
                <span className="col-span-2 text-right tabular-nums font-medium">₹{((item.qty || 0) * (item.price || 0)).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "total-summary": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="p-3 space-y-1.5" style={style}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Calculator className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Summary</span>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">₹{(content.subtotal || 0).toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST ({content.gst || 0}%)</span><span className="tabular-nums">+₹{(((content.subtotal || 0) * (content.gst || 0)) / 100).toLocaleString("en-IN")}</span></div>
          {(content.discount || 0) > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Discount ({content.discount}%)</span><span className="tabular-nums text-green-600">-₹{(((content.subtotal || 0) * content.discount) / 100).toLocaleString("en-IN")}</span></div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1.5 text-sm">
            <span>Total</span>
            <span className="tabular-nums">₹{((content.subtotal || 0) + ((content.subtotal || 0) * (content.gst || 0)) / 100 - ((content.subtotal || 0) * (content.discount || 0)) / 100).toLocaleString("en-IN")}</span>
          </div>
        </div>
      );
    }

    case "signature": {
      const style = fontStyle(content, { fontSize: 10 });
      return (
        <div className="h-full flex flex-col items-center justify-end p-3">
          <div className="w-full border-t border-dashed border-muted-foreground/30 pt-2">
            <div className="flex items-center gap-1.5 justify-center text-muted-foreground" style={style}>
              <PenTool className="h-3 w-3" />
              <span className="text-[10px]">{content.label || "Signature"}</span>
            </div>
          </div>
        </div>
      );
    }

    case "divider":
      return (
        <div className="h-full flex items-center" style={{ padding: `0 16px`, marginTop: content.spacing || 0, marginBottom: content.spacing || 0 }}>
          <div className="w-full" style={{
            borderTop: `${content.thickness || 1}px ${content.style || "solid"} ${content.color || "#ddd"}`,
          }} />
        </div>
      );

    case "bank-details": {
      const style = fontStyle(content, { fontSize: 12 });
      return (
        <div className="p-3 space-y-1" style={style}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
            <Landmark className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Bank Details</span>
          </div>
          {content.accountName && <p className="text-muted-foreground">A/C: {content.accountName}</p>}
          {content.accountNumber && <p className="font-mono text-[10px]">{content.accountNumber}</p>}
          {content.ifsc && <p className="text-muted-foreground">IFSC: {content.ifsc}</p>}
          {content.bankName && <p className="text-muted-foreground">{content.bankName}{content.branch ? ` — ${content.branch}` : ""}</p>}
          {content.upiId && <p className="text-muted-foreground">UPI: {content.upiId}</p>}
        </div>
      );
    }

    default:
      return <div className="p-2 text-xs text-muted-foreground">Unknown component</div>;
  }
}
