import { BuilderElement } from "@/types/builder";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface Props {
  element: BuilderElement | null;
  onUpdate: (updates: Partial<BuilderElement>) => void;
  embedded?: boolean;
}

/** Reusable font style controls */
function FontControls({
  content,
  updateContent,
  showTextArea = false,
  textKey = "text",
  defaultFontSize = 14,
}: {
  content: Record<string, any>;
  updateContent: (key: string, value: any) => void;
  showTextArea?: boolean;
  textKey?: string;
  defaultFontSize?: number;
}) {
  return (
    <>
      {showTextArea && (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Content</Label>
          <Textarea
            className="text-xs min-h-[80px] font-sans rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20"
            value={content[textKey] || ""}
            onChange={(e) => updateContent(textKey, e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Typeface</Label>
        <Select value={content.fontFamily || "sans"} onValueChange={(v) => updateContent("fontFamily", v)}>
          <SelectTrigger className="h-9 text-xs font-display font-bold rounded-xl border-muted-foreground/20"><SelectValue /></SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="sans">Sans (Inter)</SelectItem>
            <SelectItem value="display">Display (Space Grotesk)</SelectItem>
            <SelectItem value="serif">Serif (Playfair Display)</SelectItem>
            <SelectItem value="mono">Mono (JetBrains Mono)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Size</Label>
          <span className="text-[10px] font-mono font-bold text-primary">{content.fontSize || defaultFontSize}px</span>
        </div>
        <Slider className="py-2" min={8} max={72} step={1} value={[content.fontSize || defaultFontSize]} onValueChange={([v]) => updateContent("fontSize", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Weight</Label>
        <Select value={String(content.fontWeight || (content.bold ? 700 : 400))} onValueChange={(v) => { updateContent("fontWeight", Number(v)); updateContent("bold", Number(v) >= 600); }}>
          <SelectTrigger className="h-9 text-xs font-display font-bold rounded-xl border-muted-foreground/20"><SelectValue /></SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="300">Light</SelectItem>
            <SelectItem value="400">Regular</SelectItem>
            <SelectItem value="500">Medium</SelectItem>
            <SelectItem value="600">Semibold</SelectItem>
            <SelectItem value="700">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Style & Alignment</Label>
        <div className="flex flex-wrap gap-1">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <Toggle size="sm" className="h-7 w-7 p-0 rounded-md" pressed={!!content.bold || (content.fontWeight || 0) >= 600} onPressedChange={(v) => { updateContent("bold", v); updateContent("fontWeight", v ? 700 : 400); }}>
              <Bold className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" className="h-7 w-7 p-0 rounded-md" pressed={!!content.italic} onPressedChange={(v) => updateContent("italic", v)}>
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" className="h-7 w-7 p-0 rounded-md" pressed={!!content.underline} onPressedChange={(v) => updateContent("underline", v)}>
              <Underline className="h-3.5 w-3.5" />
            </Toggle>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const).map(([align, Icon]) => (
              <Toggle key={align} size="sm" className="h-7 w-7 p-0 rounded-md" pressed={(content.textAlign || "left") === align} onPressedChange={(pressed) => { if (pressed) updateContent("textAlign", align); }}>
                <Icon className="h-3.5 w-3.5" />
              </Toggle>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Color</Label>
        <div className="flex items-center gap-2">
          <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-muted-foreground/20">
            <input type="color" className="absolute inset-0 w-full h-full cursor-pointer scale-150" value={content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
          </div>
          <Input className="h-9 text-xs font-mono rounded-xl border-muted-foreground/20" value={content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Line Height</Label>
          <span className="text-[10px] font-mono font-bold text-primary">{content.lineHeight || 1.4}</span>
        </div>
        <Slider className="py-2" min={0.8} max={3} step={0.1} value={[content.lineHeight || 1.4]} onValueChange={([v]) => updateContent("lineHeight", v)} />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Letter Spacing</Label>
          <span className="text-[10px] font-mono font-bold text-primary">{content.letterSpacing || 0}px</span>
        </div>
        <Slider className="py-2" min={-2} max={10} step={0.5} value={[content.letterSpacing || 0]} onValueChange={([v]) => updateContent("letterSpacing", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Transform</Label>
        <Select value={content.textTransform || "none"} onValueChange={(v) => updateContent("textTransform", v)}>
          <SelectTrigger className="h-9 text-xs font-display font-bold rounded-xl border-muted-foreground/20"><SelectValue /></SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Background</Label>
        <div className="flex items-center gap-2">
          <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-muted-foreground/20">
            <input type="color" className="absolute inset-0 w-full h-full cursor-pointer scale-150" value={content.backgroundColor || "#ffffff"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
          </div>
          <Input className="h-9 text-xs font-mono rounded-xl border-muted-foreground/20" value={content.backgroundColor || "transparent"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
          <button className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-primary transition-colors" onClick={() => updateContent("backgroundColor", "transparent")}>Clear</button>
        </div>
      </div>
    </>
  );
}

export function BuilderPropertiesPanel({ element, onUpdate, embedded }: Props) {
  if (!element) {
    if (embedded) return null;
    return (
      <div
        className="w-10 shrink-0 border-l bg-card flex flex-col items-center justify-center p-2 text-center"
        title="Select an element on the canvas to edit its properties"
      >
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
          <Plus className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>
    );
  }

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...element.content, [key]: value } });
  };

  const inner = (
    <div className="p-4 space-y-6 text-xs custom-scrollbar overflow-y-auto">
      {/* Position & Size */}
      <div className="space-y-3">
        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Layout & Geometry</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground/60">X Position</Label>
            <Input type="number" className="h-8 text-xs font-mono rounded-lg" value={element.x} onChange={(e) => onUpdate({ x: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground/60">Y Position</Label>
            <Input type="number" className="h-8 text-xs font-mono rounded-lg" value={element.y} onChange={(e) => onUpdate({ y: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground/60">Width</Label>
            <Input type="number" className="h-8 text-xs font-mono rounded-lg" value={element.width} onChange={(e) => onUpdate({ width: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-muted-foreground/60">Height</Label>
            <Input type="number" className="h-8 text-xs font-mono rounded-lg" value={element.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Text / Note — full font controls with textarea */}
      {(element.type === "text" || element.type === "note") && (
        <FontControls content={element.content} updateContent={updateContent} showTextArea defaultFontSize={element.type === "note" ? 12 : 14} />
      )}

      {/* Signature */}
      {element.type === "signature" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Label</Label>
            <Input className="h-9 text-xs rounded-xl border-muted-foreground/20" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} />
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={10} />
        </>
      )}

      {/* Divider */}
      {element.type === "divider" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Stroke Style</Label>
            <Select value={element.content.style || "solid"} onValueChange={(v) => updateContent("style", v)}>
              <SelectTrigger className="h-9 text-xs font-display font-bold rounded-xl border-muted-foreground/20"><SelectValue /></SelectTrigger>
              <SelectContent className="font-display">
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Stroke Color</Label>
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-muted-foreground/20">
                <input type="color" className="absolute inset-0 w-full h-full cursor-pointer scale-150" value={element.content.color || "#dddddd"} onChange={(e) => updateContent("color", e.target.value)} />
              </div>
              <Input className="h-9 text-xs font-mono rounded-xl border-muted-foreground/20" value={element.content.color || "#dddddd"} onChange={(e) => updateContent("color", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Thickness</Label>
              <span className="text-[10px] font-mono font-bold text-primary">{element.content.thickness || 1}px</span>
            </div>
            <Slider className="py-2" min={1} max={8} step={1} value={[element.content.thickness || 1]} onValueChange={([v]) => updateContent("thickness", v)} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Vertical Spacing</Label>
              <span className="text-[10px] font-mono font-bold text-primary">{element.content.spacing || 0}px</span>
            </div>
            <Slider className="py-2" min={0} max={40} step={2} value={[element.content.spacing || 0]} onValueChange={([v]) => updateContent("spacing", v)} />
          </div>
        </>
      )}

      {/* Items Table */}
      {element.type === "items-table" && (
        <>
          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Column Visibility</Label>
            <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-border/50">
              {[
                { key: "slNo", label: "Sl. No" },
                { key: "description", label: "Description" },
                { key: "hsnSac", label: "HSN/SAC" },
                { key: "qty", label: "Quantity" },
                { key: "price", label: "Price" },
                { key: "gstType", label: "GST Type" },
                { key: "gstRate", label: "GST Rate %" },
                { key: "gstAmt", label: "GST Amount" },
                { key: "total", label: "Total" },
              ].map(col => {
                const vis = element.content.visibleColumns || {};
                const isVisible = vis[col.key] !== false;
                return (
                  <div key={col.key} className="flex items-center justify-between">
                    <Label className="text-[10px] font-medium">{col.label}</Label>
                    <Switch className="scale-75 origin-right" checked={isVisible} onCheckedChange={(v) => updateContent("visibleColumns", { ...vis, [col.key]: v })} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Column Headers</Label>
            <div className="space-y-3">
              {[
                { key: "slNo", label: "Sl. No", def: "Sl.No" },
                { key: "description", label: "Description", def: "Description" },
                { key: "hsnSac", label: "HSN/SAC", def: "HSN/SAC" },
                { key: "qty", label: "Qty", def: "Qty" },
                { key: "price", label: "Price", def: "Price" },
                { key: "gstType", label: "GST Type", def: "GST Type" },
                { key: "gstRate", label: "GST Rate%", def: "GST%" },
                { key: "gstAmt", label: "GST Amount", def: "GST Amt" },
                { key: "total", label: "Total", def: "Total" },
              ].filter(col => (element.content.visibleColumns || {})[col.key] !== false).map(col => (
                <div key={col.key} className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">{col.label}</Label>
                  <Input className="h-8 text-xs rounded-lg" value={element.content.columns?.[col.key] || col.def} onChange={(e) => updateContent("columns", { ...element.content.columns, [col.key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-primary">Sample Items</Label>
            <div className="space-y-3">
              {(element.content.items || []).map((item: any, idx: number) => (
                <div key={idx} className="space-y-2 bg-muted/50 rounded-xl p-3 border border-border/50 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-display uppercase tracking-wider text-muted-foreground">Item {idx + 1}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        const newItems = [...(element.content.items || [])];
                        newItems.splice(idx, 1);
                        updateContent("items", newItems);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Input className="h-8 text-xs rounded-lg" placeholder="Item Name" value={item.name || ""} onChange={(e) => {
                      const newItems = [...(element.content.items || [])];
                      newItems[idx] = { ...newItems[idx], name: e.target.value };
                      updateContent("items", newItems);
                    }} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-8 text-xs rounded-lg" type="number" placeholder="Qty" value={item.qty || ""} onChange={(e) => {
                        const newItems = [...(element.content.items || [])];
                        newItems[idx] = { ...newItems[idx], qty: parseInt(e.target.value) || 0 };
                        updateContent("items", newItems);
                      }} />
                      <Input className="h-8 text-xs rounded-lg" type="number" placeholder="Price" value={item.price || ""} onChange={(e) => {
                        const newItems = [...(element.content.items || [])];
                        newItems[idx] = { ...newItems[idx], price: parseFloat(e.target.value) || 0 };
                        updateContent("items", newItems);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 py-3 border-2 border-dashed border-primary/20 rounded-xl transition-all"
                onClick={() => {
                  const newItems = [...(element.content.items || []), { name: "", hsn_sac: "", qty: 1, price: 0, gst_type: "none", gst_rate: 0 }];
                  updateContent("items", newItems);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
          </div>

          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Business Details */}
      {element.type === "business-details" && (
        <div className="space-y-4">
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Business Name</Label><Input className="h-9 text-xs rounded-xl" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Email</Label><Input className="h-9 text-xs rounded-xl" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Phone</Label><Input className="h-9 text-xs rounded-xl" value={element.content.phone || ""} onChange={(e) => updateContent("phone", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Address</Label><Input className="h-9 text-xs rounded-xl" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">GST Number</Label><Input className="h-9 text-xs font-mono rounded-xl" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </div>
      )}

      {/* Client Details */}
      {element.type === "client-details" && (
        <div className="space-y-4">
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Client Name</Label><Input className="h-9 text-xs rounded-xl" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Email</Label><Input className="h-9 text-xs rounded-xl" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Address</Label><Input className="h-9 text-xs rounded-xl" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">GST</Label><Input className="h-9 text-xs font-mono rounded-xl" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </div>
      )}

      {/* Bank Details */}
      {element.type === "bank-details" && (
        <div className="space-y-4">
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Account Name</Label><Input className="h-9 text-xs rounded-xl" value={element.content.accountName || ""} onChange={(e) => updateContent("accountName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Account Number</Label><Input className="h-9 text-xs font-mono rounded-xl" value={element.content.accountNumber || ""} onChange={(e) => updateContent("accountNumber", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">IFSC Code</Label><Input className="h-9 text-xs font-mono rounded-xl" value={element.content.ifsc || ""} onChange={(e) => updateContent("ifsc", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Bank Name</Label><Input className="h-9 text-xs rounded-xl" value={element.content.bankName || ""} onChange={(e) => updateContent("bankName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Branch</Label><Input className="h-9 text-xs rounded-xl" value={element.content.branch || ""} onChange={(e) => updateContent("branch", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">UPI ID</Label><Input className="h-9 text-xs font-mono rounded-xl" placeholder="name@upi" value={element.content.upiId || ""} onChange={(e) => updateContent("upiId", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </div>
      )}

      {/* Logo / Stamp */}
      {(element.type === "logo" || element.type === "stamp") && (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Image Source URL</Label>
          <Input className="h-9 text-xs rounded-xl border-muted-foreground/20" placeholder="https://..." value={element.content.url || ""} onChange={(e) => updateContent("url", e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1 font-serif italic">Uses your profile {element.type} if left empty</p>
        </div>
      )}

      {/* Invoice Number */}
      {element.type === "invoice-number" && (
        <div className="space-y-4">
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Label</Label><Input className="h-9 text-xs rounded-xl" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Value / Placeholder</Label>
            <Input className="h-9 text-xs font-mono rounded-xl" value={element.content.value || ""} onChange={(e) => updateContent("value", e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1 font-serif italic">Use {"{{invoice_number}}"} for auto-fill</p>
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={14} />
        </div>
      )}

      {/* Invoice Date */}
      {element.type === "invoice-date" && (
        <div className="space-y-4">
          <div className="space-y-1.5"><Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Label</Label><Input className="h-9 text-xs rounded-xl" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} /></div>
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
            <Label className="text-[10px] font-bold">Show Issue Date</Label>
            <Switch className="scale-75 origin-right" checked={element.content.showIssue !== false} onCheckedChange={(v) => updateContent("showIssue", v)} />
          </div>
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
            <Label className="text-[10px] font-bold">Show Due Date</Label>
            <Switch className="scale-75 origin-right" checked={element.content.showDue !== false} onCheckedChange={(v) => updateContent("showDue", v)} />
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </div>
      )}

      {/* Total Summary */}
      {element.type === "total-summary" && (
        <FontControls content={element.content} updateContent={updateContent} defaultFontSize={13} />
      )}
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="w-64 xl:w-72 shrink-0 border-l bg-card flex flex-col h-full overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/10">
        <h3 className="text-xs font-bold uppercase tracking-widest font-display text-primary">Properties</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-serif italic capitalize">{element.type.replace("-", " ")}</p>
      </div>
      {inner}
    </div>
  );
}
