import { BuilderElement } from "@/types/builder";
import { Type, Image, Users, Table, Calculator, PenTool, Stamp, Building2, StickyNote } from "lucide-react";

interface Props {
  element: BuilderElement;
  selected: boolean;
}

export function BuilderElementRenderer({ element, selected }: Props) {
  const { type, content } = element;

  switch (type) {
    case "text":
      return (
        <div className="h-full flex items-center px-3">
          <p className="w-full outline-none" style={{ fontSize: content.fontSize || 14, fontWeight: content.bold ? 600 : 400 }}>
            {content.text || "Text"}
          </p>
        </div>
      );

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

    case "business-details":
      return (
        <div className="p-3 space-y-1 text-xs">
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

    case "note":
      return (
        <div className="h-full flex items-start px-3 py-2">
          <div className="w-full">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <StickyNote className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider font-medium">Note</span>
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontSize: content.fontSize || 12 }}>
              {content.text || "Add a note..."}
            </p>
          </div>
        </div>
      );

    case "client-details":
      return (
        <div className="p-3 space-y-1 text-xs">
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

    case "items-table":
      return (
        <div className="p-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Table className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Items</span>
          </div>
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-px bg-muted text-[10px] uppercase tracking-wider font-medium px-2 py-1.5">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-3 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
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

    case "total-summary":
      return (
        <div className="p-3 text-xs space-y-1.5">
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

    case "signature":
      return (
        <div className="h-full flex flex-col items-center justify-end p-3">
          <div className="w-full border-t border-dashed border-muted-foreground/30 pt-2">
            <div className="flex items-center gap-1.5 justify-center text-muted-foreground">
              <PenTool className="h-3 w-3" />
              <span className="text-[10px]">{content.label || "Signature"}</span>
            </div>
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="h-full flex items-center px-4">
          <div className="w-full border-t" style={{ borderStyle: content.style || "solid" }} />
        </div>
      );

    default:
      return <div className="p-2 text-xs text-muted-foreground">Unknown component</div>;
  }
}
