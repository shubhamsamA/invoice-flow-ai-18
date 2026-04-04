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
        <div>
          <Label className="text-[10px]">Text</Label>
          <Textarea
            className="text-xs min-h-[60px] mt-1"
            value={content[textKey] || ""}
            onChange={(e) => updateContent(textKey, e.target.value)}
          />
        </div>
      )}
      <div>
        <Label className="text-[10px]">Font Family</Label>
        <Select value={content.fontFamily || "sans"} onValueChange={(v) => updateContent("fontFamily", v)}>
          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sans">Sans (Inter)</SelectItem>
            <SelectItem value="serif">Serif (Merriweather)</SelectItem>
            <SelectItem value="mono">Mono (JetBrains)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Font Size ({content.fontSize || defaultFontSize}px)</Label>
        <Slider className="mt-1" min={8} max={72} step={1} value={[content.fontSize || defaultFontSize]} onValueChange={([v]) => updateContent("fontSize", v)} />
      </div>
      <div>
        <Label className="text-[10px]">Font Weight</Label>
        <Select value={String(content.fontWeight || (content.bold ? 700 : 400))} onValueChange={(v) => { updateContent("fontWeight", Number(v)); updateContent("bold", Number(v) >= 600); }}>
          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="300">Light</SelectItem>
            <SelectItem value="400">Regular</SelectItem>
            <SelectItem value="500">Medium</SelectItem>
            <SelectItem value="600">Semibold</SelectItem>
            <SelectItem value="700">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Style</Label>
        <div className="flex gap-1 mt-1">
          <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!content.bold || (content.fontWeight || 0) >= 600} onPressedChange={(v) => { updateContent("bold", v); updateContent("fontWeight", v ? 700 : 400); }}>
            <Bold className="h-3 w-3" />
          </Toggle>
          <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!content.italic} onPressedChange={(v) => updateContent("italic", v)}>
            <Italic className="h-3 w-3" />
          </Toggle>
          <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!content.underline} onPressedChange={(v) => updateContent("underline", v)}>
            <Underline className="h-3 w-3" />
          </Toggle>
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Alignment</Label>
        <div className="flex gap-1 mt-1">
          {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const).map(([align, Icon]) => (
            <Toggle key={align} size="sm" className="h-7 w-7 p-0" pressed={(content.textAlign || "left") === align} onPressedChange={(pressed) => { if (pressed) updateContent("textAlign", align); }}>
              <Icon className="h-3 w-3" />
            </Toggle>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <input type="color" className="w-7 h-7 rounded border cursor-pointer" value={content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
          <Input className="h-7 text-xs flex-1" value={content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Line Height ({content.lineHeight || 1.4})</Label>
        <Slider className="mt-1" min={0.8} max={3} step={0.1} value={[content.lineHeight || 1.4]} onValueChange={([v]) => updateContent("lineHeight", v)} />
      </div>
      <div>
        <Label className="text-[10px]">Letter Spacing ({content.letterSpacing || 0}px)</Label>
        <Slider className="mt-1" min={-2} max={10} step={0.5} value={[content.letterSpacing || 0]} onValueChange={([v]) => updateContent("letterSpacing", v)} />
      </div>
      <div>
        <Label className="text-[10px]">Transform</Label>
        <Select value={content.textTransform || "none"} onValueChange={(v) => updateContent("textTransform", v)}>
          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">Background</Label>
        <div className="flex items-center gap-2 mt-1">
          <input type="color" className="w-7 h-7 rounded border cursor-pointer" value={content.backgroundColor || "#ffffff"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
          <Input className="h-7 text-xs flex-1" value={content.backgroundColor || "transparent"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
          <button className="text-[9px] text-muted-foreground hover:text-foreground" onClick={() => updateContent("backgroundColor", "transparent")}>Clear</button>
        </div>
      </div>
    </>
  );
}

export function BuilderPropertiesPanel({ element, onUpdate, embedded }: Props) {
  if (!element) {
    if (embedded) return null;
    return (
      <div className="w-56 shrink-0 border-l bg-card flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">Select an element to edit its properties</p>
      </div>
    );
  }

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...element.content, [key]: value } });
  };

  const inner = (
    <div className="p-3 space-y-4 text-xs">
      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">X</Label>
          <Input type="number" className="h-7 text-xs" value={element.x} onChange={(e) => onUpdate({ x: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-[10px]">Y</Label>
          <Input type="number" className="h-7 text-xs" value={element.y} onChange={(e) => onUpdate({ y: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Width</Label>
          <Input type="number" className="h-7 text-xs" value={element.width} onChange={(e) => onUpdate({ width: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-[10px]">Height</Label>
          <Input type="number" className="h-7 text-xs" value={element.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} />
        </div>
      </div>

      {/* Text / Note — full font controls with textarea */}
      {(element.type === "text" || element.type === "note") && (
        <FontControls content={element.content} updateContent={updateContent} showTextArea defaultFontSize={element.type === "note" ? 12 : 14} />
      )}

      {/* Signature */}
      {element.type === "signature" && (
        <>
          <div>
            <Label className="text-[10px]">Label</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} />
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={10} />
        </>
      )}

      {/* Divider */}
      {element.type === "divider" && (
        <>
          <div>
            <Label className="text-[10px]">Style</Label>
            <Select value={element.content.style || "solid"} onValueChange={(v) => updateContent("style", v)}>
              <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" className="w-7 h-7 rounded border cursor-pointer" value={element.content.color || "#dddddd"} onChange={(e) => updateContent("color", e.target.value)} />
              <Input className="h-7 text-xs flex-1" value={element.content.color || "#dddddd"} onChange={(e) => updateContent("color", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Thickness ({element.content.thickness || 1}px)</Label>
            <Slider className="mt-1" min={1} max={8} step={1} value={[element.content.thickness || 1]} onValueChange={([v]) => updateContent("thickness", v)} />
          </div>
          <div>
            <Label className="text-[10px]">Spacing ({element.content.spacing || 0}px)</Label>
            <Slider className="mt-1" min={0} max={40} step={2} value={[element.content.spacing || 0]} onValueChange={([v]) => updateContent("spacing", v)} />
          </div>
        </>
      )}

      {/* Items Table */}
      {element.type === "items-table" && (
        <>
          <Label className="text-[10px] font-semibold">Show / Hide Columns</Label>
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
                <Label className="text-[10px]">{col.label}</Label>
                <Switch checked={isVisible} onCheckedChange={(v) => updateContent("visibleColumns", { ...vis, [col.key]: v })} />
              </div>
            );
          })}

          <Label className="text-[10px] font-semibold mt-3">Column Headers</Label>
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
            <div key={col.key}>
              <Label className="text-[10px]">{col.label}</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.columns?.[col.key] || col.def} onChange={(e) => updateContent("columns", { ...element.content.columns, [col.key]: e.target.value })} />
            </div>
          ))}

          <Label className="text-[10px] font-semibold mt-3">Items</Label>
          {(element.content.items || []).map((item: any, idx: number) => (
            <div key={idx} className="space-y-1 bg-muted/30 rounded-md p-2 border border-dashed">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">Item {idx + 1}</span>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const newItems = [...(element.content.items || [])];
                    newItems.splice(idx, 1);
                    updateContent("items", newItems);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <Label className="text-[9px] text-muted-foreground">Sl.No</Label>
                  <Input className="h-7 text-xs" type="number" min={1} value={item.sl_no || idx + 1} onChange={(e) => {
                    const newItems = [...(element.content.items || [])];
                    newItems[idx] = { ...newItems[idx], sl_no: parseInt(e.target.value) || 1 };
                    updateContent("items", newItems);
                  }} />
                </div>
                <div className="col-span-2">
                  <Label className="text-[9px] text-muted-foreground">Name</Label>
                  <Input className="h-7 text-xs" placeholder="Name" value={item.name || ""} onChange={(e) => {
                    const newItems = [...(element.content.items || [])];
                    newItems[idx] = { ...newItems[idx], name: e.target.value };
                    updateContent("items", newItems);
                  }} />
                </div>
              </div>
              <Input className="h-7 text-xs" placeholder="HSN/SAC Code" value={item.hsn_sac || ""} onChange={(e) => {
                const newItems = [...(element.content.items || [])];
                newItems[idx] = { ...newItems[idx], hsn_sac: e.target.value };
                updateContent("items", newItems);
              }} />
              <div className="grid grid-cols-2 gap-1">
                <Input className="h-7 text-xs" type="number" placeholder="Qty" value={item.qty || ""} onChange={(e) => {
                  const newItems = [...(element.content.items || [])];
                  newItems[idx] = { ...newItems[idx], qty: parseInt(e.target.value) || 0 };
                  updateContent("items", newItems);
                }} />
                <Input className="h-7 text-xs" type="number" placeholder="Price" value={item.price || ""} onChange={(e) => {
                  const newItems = [...(element.content.items || [])];
                  newItems[idx] = { ...newItems[idx], price: parseFloat(e.target.value) || 0 };
                  updateContent("items", newItems);
                }} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Select value={item.gst_type || "none"} onValueChange={(v) => {
                  const newItems = [...(element.content.items || [])];
                  newItems[idx] = { ...newItems[idx], gst_type: v, gst_rate: v === "none" ? 0 : (newItems[idx].gst_rate || 18) };
                  updateContent("items", newItems);
                }}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No GST</SelectItem>
                    <SelectItem value="cgst_sgst">CGST+SGST</SelectItem>
                    <SelectItem value="igst">IGST</SelectItem>
                    <SelectItem value="cgst_utgst">CGST+UTGST</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="h-7 text-xs" type="number" placeholder="GST%" value={item.gst_rate || ""} onChange={(e) => {
                  const newItems = [...(element.content.items || [])];
                  newItems[idx] = { ...newItems[idx], gst_rate: parseFloat(e.target.value) || 0 };
                  updateContent("items", newItems);
                }} disabled={!item.gst_type || item.gst_type === "none"} />
              </div>
            </div>
          ))}
          <button
            className="w-full flex items-center justify-center gap-1 text-[10px] text-primary hover:text-primary/80 py-1.5 border border-dashed rounded-md"
            onClick={() => {
              const newItems = [...(element.content.items || []), { name: "", hsn_sac: "", qty: 1, price: 0, gst_type: "none", gst_rate: 0 }];
              updateContent("items", newItems);
            }}
          >
            <Plus className="h-3 w-3" /> Add Row
          </button>

          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Business Details */}
      {element.type === "business-details" && (
        <>
          <div><Label className="text-[10px]">Business Name</Label><Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div><Label className="text-[10px]">Email</Label><Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div><Label className="text-[10px]">Phone</Label><Input className="h-7 text-xs mt-1" value={element.content.phone || ""} onChange={(e) => updateContent("phone", e.target.value)} /></div>
          <div><Label className="text-[10px]">Address</Label><Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div><Label className="text-[10px]">GST Number</Label><Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Client Details */}
      {element.type === "client-details" && (
        <>
          <div><Label className="text-[10px]">Name</Label><Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div><Label className="text-[10px]">Email</Label><Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div><Label className="text-[10px]">Address</Label><Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div><Label className="text-[10px]">GST</Label><Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Bank Details */}
      {element.type === "bank-details" && (
        <>
          <div><Label className="text-[10px]">Account Name</Label><Input className="h-7 text-xs mt-1" value={element.content.accountName || ""} onChange={(e) => updateContent("accountName", e.target.value)} /></div>
          <div><Label className="text-[10px]">Account Number</Label><Input className="h-7 text-xs mt-1" value={element.content.accountNumber || ""} onChange={(e) => updateContent("accountNumber", e.target.value)} /></div>
          <div><Label className="text-[10px]">IFSC Code</Label><Input className="h-7 text-xs mt-1" value={element.content.ifsc || ""} onChange={(e) => updateContent("ifsc", e.target.value)} /></div>
          <div><Label className="text-[10px]">Bank Name</Label><Input className="h-7 text-xs mt-1" value={element.content.bankName || ""} onChange={(e) => updateContent("bankName", e.target.value)} /></div>
          <div><Label className="text-[10px]">Branch</Label><Input className="h-7 text-xs mt-1" value={element.content.branch || ""} onChange={(e) => updateContent("branch", e.target.value)} /></div>
          <div><Label className="text-[10px]">UPI ID</Label><Input className="h-7 text-xs mt-1" placeholder="name@upi" value={element.content.upiId || ""} onChange={(e) => updateContent("upiId", e.target.value)} /></div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Logo / Stamp */}
      {(element.type === "logo" || element.type === "stamp") && (
        <div>
          <Label className="text-[10px]">Image URL</Label>
          <Input className="h-7 text-xs mt-1" placeholder="https://..." value={element.content.url || ""} onChange={(e) => updateContent("url", e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">Uses your profile {element.type} if left empty</p>
        </div>
      )}

      {/* Invoice Number */}
      {element.type === "invoice-number" && (
        <>
          <div><Label className="text-[10px]">Label</Label><Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} /></div>
          <div>
            <Label className="text-[10px]">Value / Placeholder</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.value || ""} onChange={(e) => updateContent("value", e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">Use {"{{invoice_number}}"} for auto-fill</p>
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={14} />
        </>
      )}

      {/* Invoice Date */}
      {element.type === "invoice-date" && (
        <>
          <div><Label className="text-[10px]">Label</Label><Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} /></div>
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Show Issue Date</Label>
            <Switch checked={element.content.showIssue !== false} onCheckedChange={(v) => updateContent("showIssue", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Show Due Date</Label>
            <Switch checked={element.content.showDue !== false} onCheckedChange={(v) => updateContent("showDue", v)} />
          </div>
          <FontControls content={element.content} updateContent={updateContent} defaultFontSize={12} />
        </>
      )}

      {/* Total Summary */}
      {element.type === "total-summary" && (
        <FontControls content={element.content} updateContent={updateContent} defaultFontSize={13} />
      )}
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="w-56 shrink-0 border-l bg-card flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{element.type.replace("-", " ")}</p>
      </div>
      {inner}
    </div>
  );
}
