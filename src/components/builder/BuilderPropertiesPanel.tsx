import { BuilderElement } from "@/types/builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface Props {
  element: BuilderElement | null;
  onUpdate: (updates: Partial<BuilderElement>) => void;
  /** When true, skip the wrapper div sizing (used inside Sheet) */
  embedded?: boolean;
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

      {/* Text-based elements */}
      {(element.type === "text" || element.type === "note") && (
        <>
          <div>
            <Label className="text-[10px]">Text</Label>
            <Textarea
              className="text-xs min-h-[60px] mt-1"
              value={element.content.text || ""}
              onChange={(e) => updateContent("text", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px]">Font Family</Label>
            <Select value={element.content.fontFamily || "sans"} onValueChange={(v) => updateContent("fontFamily", v)}>
              <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sans">Sans (Inter)</SelectItem>
                <SelectItem value="serif">Serif (Merriweather)</SelectItem>
                <SelectItem value="mono">Mono (JetBrains)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Font Size ({element.content.fontSize || 14}px)</Label>
            <Slider className="mt-1" min={8} max={72} step={1} value={[element.content.fontSize || 14]} onValueChange={([v]) => updateContent("fontSize", v)} />
          </div>
          <div>
            <Label className="text-[10px]">Font Weight</Label>
            <Select value={String(element.content.fontWeight || (element.content.bold ? 700 : 400))} onValueChange={(v) => { updateContent("fontWeight", Number(v)); updateContent("bold", Number(v) >= 600); }}>
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
              <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!element.content.bold || (element.content.fontWeight || 0) >= 600} onPressedChange={(v) => { updateContent("bold", v); updateContent("fontWeight", v ? 700 : 400); }}>
                <Bold className="h-3 w-3" />
              </Toggle>
              <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!element.content.italic} onPressedChange={(v) => updateContent("italic", v)}>
                <Italic className="h-3 w-3" />
              </Toggle>
              <Toggle size="sm" className="h-7 w-7 p-0" pressed={!!element.content.underline} onPressedChange={(v) => updateContent("underline", v)}>
                <Underline className="h-3 w-3" />
              </Toggle>
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Alignment</Label>
            <div className="flex gap-1 mt-1">
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const).map(([align, Icon]) => (
                <Toggle key={align} size="sm" className="h-7 w-7 p-0" pressed={(element.content.textAlign || "left") === align} onPressedChange={(pressed) => { if (pressed) updateContent("textAlign", align); }}>
                  <Icon className="h-3 w-3" />
                </Toggle>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" className="w-7 h-7 rounded border cursor-pointer" value={element.content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
              <Input className="h-7 text-xs flex-1" value={element.content.color || "#000000"} onChange={(e) => updateContent("color", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Line Height ({element.content.lineHeight || 1.4})</Label>
            <Slider className="mt-1" min={0.8} max={3} step={0.1} value={[element.content.lineHeight || 1.4]} onValueChange={([v]) => updateContent("lineHeight", v)} />
          </div>
          <div>
            <Label className="text-[10px]">Letter Spacing ({element.content.letterSpacing || 0}px)</Label>
            <Slider className="mt-1" min={-2} max={10} step={0.5} value={[element.content.letterSpacing || 0]} onValueChange={([v]) => updateContent("letterSpacing", v)} />
          </div>
          <div>
            <Label className="text-[10px]">Transform</Label>
            <Select value={element.content.textTransform || "none"} onValueChange={(v) => updateContent("textTransform", v)}>
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
              <input type="color" className="w-7 h-7 rounded border cursor-pointer" value={element.content.backgroundColor || "#ffffff"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
              <Input className="h-7 text-xs flex-1" value={element.content.backgroundColor || "transparent"} onChange={(e) => updateContent("backgroundColor", e.target.value)} />
              <button className="text-[9px] text-muted-foreground hover:text-foreground" onClick={() => updateContent("backgroundColor", "transparent")}>Clear</button>
            </div>
          </div>
        </>
      )}

      {element.type === "signature" && (
        <div>
          <Label className="text-[10px]">Label</Label>
          <Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} />
        </div>
      )}

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

      {element.type === "items-table" && (
        <>
          <Label className="text-[10px] font-semibold">Column Headers</Label>
          <div>
            <Label className="text-[10px]">Description</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.columns?.description || "Description"} onChange={(e) => updateContent("columns", { ...element.content.columns, description: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Qty</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.columns?.qty || "Qty"} onChange={(e) => updateContent("columns", { ...element.content.columns, qty: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Price</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.columns?.price || "Price"} onChange={(e) => updateContent("columns", { ...element.content.columns, price: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Total</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.columns?.total || "Total"} onChange={(e) => updateContent("columns", { ...element.content.columns, total: e.target.value })} />
          </div>
        </>
      )}

      {element.type === "business-details" && (
        <>
          <div><Label className="text-[10px]">Business Name</Label><Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div><Label className="text-[10px]">Email</Label><Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div><Label className="text-[10px]">Phone</Label><Input className="h-7 text-xs mt-1" value={element.content.phone || ""} onChange={(e) => updateContent("phone", e.target.value)} /></div>
          <div><Label className="text-[10px]">Address</Label><Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div><Label className="text-[10px]">GST Number</Label><Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
        </>
      )}

      {element.type === "client-details" && (
        <>
          <div><Label className="text-[10px]">Name</Label><Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} /></div>
          <div><Label className="text-[10px]">Email</Label><Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} /></div>
          <div><Label className="text-[10px]">Address</Label><Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} /></div>
          <div><Label className="text-[10px]">GST</Label><Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} /></div>
        </>
      )}

      {element.type === "bank-details" && (
        <>
          <div><Label className="text-[10px]">Account Name</Label><Input className="h-7 text-xs mt-1" value={element.content.accountName || ""} onChange={(e) => updateContent("accountName", e.target.value)} /></div>
          <div><Label className="text-[10px]">Account Number</Label><Input className="h-7 text-xs mt-1" value={element.content.accountNumber || ""} onChange={(e) => updateContent("accountNumber", e.target.value)} /></div>
          <div><Label className="text-[10px]">IFSC Code</Label><Input className="h-7 text-xs mt-1" value={element.content.ifsc || ""} onChange={(e) => updateContent("ifsc", e.target.value)} /></div>
          <div><Label className="text-[10px]">Bank Name</Label><Input className="h-7 text-xs mt-1" value={element.content.bankName || ""} onChange={(e) => updateContent("bankName", e.target.value)} /></div>
          <div><Label className="text-[10px]">Branch</Label><Input className="h-7 text-xs mt-1" value={element.content.branch || ""} onChange={(e) => updateContent("branch", e.target.value)} /></div>
          <div><Label className="text-[10px]">UPI ID</Label><Input className="h-7 text-xs mt-1" placeholder="name@upi" value={element.content.upiId || ""} onChange={(e) => updateContent("upiId", e.target.value)} /></div>
        </>
      )}

      {(element.type === "logo" || element.type === "stamp") && (
        <div>
          <Label className="text-[10px]">Image URL</Label>
          <Input className="h-7 text-xs mt-1" placeholder="https://..." value={element.content.url || ""} onChange={(e) => updateContent("url", e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">Uses your profile {element.type} if left empty</p>
        </div>
      )}

      {element.type === "invoice-number" && (
        <>
          <div><Label className="text-[10px]">Label</Label><Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} /></div>
          <div>
            <Label className="text-[10px]">Value / Placeholder</Label>
            <Input className="h-7 text-xs mt-1" value={element.content.value || ""} onChange={(e) => updateContent("value", e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">Use {"{{invoice_number}}"} for auto-fill</p>
          </div>
        </>
      )}

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
        </>
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
