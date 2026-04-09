import { useState } from "react";
import { 
  Type, Image, Users, Table, Calculator, PenTool, Minus,
  GripVertical, Stamp, Building2, StickyNote, Hash, CalendarDays,
  ChevronLeft, ChevronRight, Landmark
} from "lucide-react";
import { BuilderElementType } from "@/types/builder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  { type: "bank-details",      label: "Bank Details",      icon: Landmark,      description: "Account, IFSC, UPI info" },
];

interface BuilderSidebarProps {
  onDragStart: (type: BuilderElementType) => void;
}

function ComponentList({ onDragStart }: { onDragStart: (type: BuilderElementType) => void }) {
  return (
    <div className="space-y-2">
      {components.map((comp) => (
        <div
          key={comp.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("builder/component-type", comp.type);
            e.dataTransfer.effectAllowed = "copy";
            onDragStart(comp.type);
          }}
          className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all duration-200 group shadow-sm hover:shadow-md"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <comp.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold font-display tracking-tight">{comp.label}</p>
            <p className="text-[10px] text-muted-foreground truncate font-serif italic">{comp.description}</p>
          </div>
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 group-hover:text-primary/40 transition-colors" />
        </div>
      ))}
    </div>
  );
}

function CollapsedSidebar({ onDragStart, onExpand }: { onDragStart: (type: BuilderElementType) => void; onExpand: () => void }) {
  return (
    <div className="w-14 shrink-0 bg-card border-r flex flex-col h-full shadow-sm">
      <div className="p-2 border-b flex justify-center">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onExpand} title="Expand sidebar">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-2 flex flex-col items-center">
        {components.map((comp) => (
          <div
            key={comp.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("builder/component-type", comp.type);
              e.dataTransfer.effectAllowed = "copy";
              onDragStart(comp.type);
            }}
            className="h-10 w-10 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:scale-110 shadow-sm"
            title={comp.label}
          >
            <comp.icon className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BuilderSidebar({ onDragStart }: BuilderSidebarProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Mobile: use a Sheet overlay
  if (isMobile) {
    return (
      <>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="fixed bottom-4 left-4 z-40 gap-2 shadow-xl text-xs font-bold font-display rounded-full px-6 border-primary/20 bg-background/80 backdrop-blur-sm">
              <ChevronRight className="h-4 w-4 text-primary" /> Components
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-6 border-b bg-muted/30">
              <SheetTitle className="text-sm font-bold uppercase tracking-widest font-display text-primary">Components</SheetTitle>
              <p className="text-[10px] text-muted-foreground font-serif italic">Drag elements to build your layout</p>
            </SheetHeader>
            <div className="p-4 overflow-y-auto h-[calc(100%-100px)] custom-scrollbar">
              <ComponentList onDragStart={(type) => { onDragStart(type); setSheetOpen(false); }} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop collapsed
  if (collapsed) {
    return <CollapsedSidebar onDragStart={onDragStart} onExpand={() => setCollapsed(false)} />;
  }

  // Desktop expanded
  return (
    <div className="w-64 xl:w-72 shrink-0 bg-card border-r flex flex-col h-full shadow-sm">
      <div className="p-4 border-b flex items-center justify-between bg-muted/10">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest font-display text-primary">Components</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-serif italic">Drag onto the canvas</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setCollapsed(true)} title="Collapse sidebar">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ComponentList onDragStart={onDragStart} />
      </div>
    </div>
  );
}
