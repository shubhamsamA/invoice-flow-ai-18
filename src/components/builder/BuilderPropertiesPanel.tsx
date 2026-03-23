import { BuilderElement } from "@/types/builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Props {
  element: BuilderElement | null;
  onUpdate: (updates: Partial<BuilderElement>) => void;
}

/**
 * Properties panel for editing the selected builder element's content,
 * including text, font size, color, and type-specific fields.
 */
export function BuilderPropertiesPanel({ element, onUpdate }: Props) {
  if (!element) {
    return (
      <div className="w-56 shrink-0 border-l bg-card flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">Select an element to edit its properties</p>
      </div>
    );
  }

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...element.content, [key]: value } });
  };

  return (
    <div className="w-56 shrink-0 border-l bg-card flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{element.type.replace("-", " ")}</p>
      </div>

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
              <Label className="text-[10px]">Font Size ({element.content.fontSize || 14}px)</Label>
              <Slider
                className="mt-1"
                min={8}
                max={48}
                step={1}
                value={[element.content.fontSize || 14]}
                onValueChange={([v]) => updateContent("fontSize", v)}
              />
            </div>
            <div>
              <Label className="text-[10px]">Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  className="w-7 h-7 rounded border cursor-pointer"
                  value={element.content.color || "#000000"}
                  onChange={(e) => updateContent("color", e.target.value)}
                />
                <Input
                  className="h-7 text-xs flex-1"
                  value={element.content.color || "#000000"}
                  onChange={(e) => updateContent("color", e.target.value)}
                />
              </div>
            </div>
            {element.type === "text" && (
              <div className="flex items-center justify-between">
                <Label className="text-[10px]">Bold</Label>
                <Switch
                  checked={!!element.content.bold}
                  onCheckedChange={(v) => updateContent("bold", v)}
                />
              </div>
            )}
          </>
        )}

        {/* Signature label */}
        {element.type === "signature" && (
          <div>
            <Label className="text-[10px]">Label</Label>
            <Input
              className="h-7 text-xs mt-1"
              value={element.content.label || ""}
              onChange={(e) => updateContent("label", e.target.value)}
            />
          </div>
        )}

        {/* Divider style */}
        {element.type === "divider" && (
          <div>
            <Label className="text-[10px]">Style</Label>
            <Select value={element.content.style || "solid"} onValueChange={(v) => updateContent("style", v)}>
              <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Business details */}
        {element.type === "business-details" && (
          <>
            <div>
              <Label className="text-[10px]">Business Name</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Email</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Phone</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.phone || ""} onChange={(e) => updateContent("phone", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Address</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">GST Number</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} />
            </div>
          </>
        )}

        {/* Client details */}
        {element.type === "client-details" && (
          <>
            <div>
              <Label className="text-[10px]">Name</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.name || ""} onChange={(e) => updateContent("name", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Email</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.email || ""} onChange={(e) => updateContent("email", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Address</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.address || ""} onChange={(e) => updateContent("address", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">GST</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.gst || ""} onChange={(e) => updateContent("gst", e.target.value)} />
            </div>
          </>
        )}

        {/* Logo / Stamp URL */}
        {(element.type === "logo" || element.type === "stamp") && (
          <div>
            <Label className="text-[10px]">Image URL</Label>
            <Input
              className="h-7 text-xs mt-1"
              placeholder="https://..."
              value={element.content.url || ""}
              onChange={(e) => updateContent("url", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Uses your profile {element.type} if left empty
            </p>
          </div>
        )}

        {/* Invoice Number */}
        {element.type === "invoice-number" && (
          <>
            <div>
              <Label className="text-[10px]">Label</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px]">Value / Placeholder</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.value || ""} onChange={(e) => updateContent("value", e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Use {"{{invoice_number}}"} for auto-fill</p>
            </div>
          </>
        )}

        {/* Invoice Date */}
        {element.type === "invoice-date" && (
          <>
            <div>
              <Label className="text-[10px]">Label</Label>
              <Input className="h-7 text-xs mt-1" value={element.content.label || ""} onChange={(e) => updateContent("label", e.target.value)} />
            </div>
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
    </div>
  );
}
