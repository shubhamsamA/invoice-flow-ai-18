import { 
  Type, Image, Users, Table, Calculator, PenTool, Minus,
  GripVertical, Stamp, Building2, StickyNote, Hash, CalendarDays
} from "lucide-react";
import { BuilderElementType } from "@/types/builder";

interface ComponentItem {
  type: BuilderElementType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const components: ComponentItem[] = [
  { type: "text",              label: "Text Block",        icon: Type,          description: "Headings, labels, notes" },
  { type: "logo",              label: "Logo",              icon: Image,         description: "Company logo or image" },
  { type: "business-details",  label: "Business Details",  icon: Building2,     description: "Your company info" },
  { type: "client-details",    label: "Client Details",    icon: Users,         description: "Name, email, address, GST" },
  { type: "invoice-number",    label: "Invoice Number",    icon: Hash,          description: "Auto-filled invoice number" },
  { type: "invoice-date",      label: "Invoice Date",      icon: CalendarDays,  description: "Issue & due date fields" },
  { type: "items-table",       label: "Items Table",       icon: Table,         description: "Line items with qty & price" },
  { type: "total-summary",     label: "Total Summary",     icon: Calculator,    description: "Subtotal, GST, discount, total" },
  { type: "signature",         label: "Signature",         icon: PenTool,       description: "Authorized signature area" },
  { type: "stamp",             label: "Company Stamp",     icon: Stamp,         description: "Official company stamp" },
  { type: "note",              label: "Note",              icon: StickyNote,    description: "Payment terms, thank you" },
  { type: "divider",           label: "Divider",           icon: Minus,         description: "Horizontal separator line" },
];

interface BuilderSidebarProps {
  onDragStart: (type: BuilderElementType) => void;
}

/**
 * Sidebar with draggable component palette.
 * Users drag items from here onto the canvas.
 * Uses HTML5 native drag-and-drop with dataTransfer to pass the component type.
 */
export function BuilderSidebar({ onDragStart }: BuilderSidebarProps) {
  return (
    <div className="w-64 shrink-0 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Components</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">Drag onto the canvas</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {components.map((comp) => (
          <div
            key={comp.type}
            draggable
            onDragStart={(e) => {
              // Store the component type in dataTransfer so the canvas knows what was dropped
              e.dataTransfer.setData("builder/component-type", comp.type);
              e.dataTransfer.effectAllowed = "copy";
              onDragStart(comp.type);
            }}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors group"
          >
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <comp.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{comp.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{comp.description}</p>
            </div>
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
