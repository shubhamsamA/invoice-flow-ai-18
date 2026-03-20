import { useState, useCallback } from "react";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderElement, BuilderElementType, BuilderLayout } from "@/types/builder";
import { Button } from "@/components/ui/button";
import { Save, Download, Upload, Undo2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CANVAS_W = 640;
const CANVAS_H = 900;
const STORAGE_KEY = "invoiceflow-builder-layout";

/**
 * Invoice Builder Page
 * 
 * Architecture:
 * - State lives here (single source of truth for all elements)
 * - BuilderSidebar: component palette (drag source)
 * - BuilderCanvas: drop target + positioning + resizing
 * - Layout is persisted to localStorage as JSON
 */
export default function InvoiceBuilderPage() {
  const [elements, setElements] = useState<BuilderElement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const layout: BuilderLayout = JSON.parse(saved);
        return layout.elements;
      }
    } catch {}
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BuilderElement[][]>([]);

  // Push current state to undo history before making changes
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), elements]);
  }, [elements]);

  const handleAddElement = useCallback((el: BuilderElement) => {
    pushHistory();
    setElements((prev) => [...prev, el]);
  }, [pushHistory]);

  const handleUpdateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const handleRemoveElement = useCallback((id: string) => {
    pushHistory();
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setElements(prev);
    setSelectedId(null);
  }, [history]);

  // Save layout as JSON to localStorage
  const handleSave = useCallback(() => {
    const layout: BuilderLayout = {
      id: crypto.randomUUID(),
      name: "Custom Layout",
      elements,
      canvasWidth: CANVAS_W,
      canvasHeight: CANVAS_H,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    toast.success("Layout saved");
  }, [elements]);

  // Export layout as downloadable JSON file
  const handleExportJSON = useCallback(() => {
    const layout: BuilderLayout = {
      id: crypto.randomUUID(),
      name: "Exported Layout",
      elements,
      canvasWidth: CANVAS_W,
      canvasHeight: CANVAS_H,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Layout exported as JSON");
  }, [elements]);

  // Import layout from JSON file
  const handleImportJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const layout: BuilderLayout = JSON.parse(ev.target?.result as string);
          if (layout.elements) {
            pushHistory();
            setElements(layout.elements);
            setSelectedId(null);
            toast.success("Layout loaded");
          }
        } catch {
          toast.error("Invalid layout file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [pushHistory]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-sm font-semibold">Invoice Builder</h1>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {elements.length} element{elements.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleUndo} disabled={history.length === 0}>
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleImportJSON}>
            <Upload className="h-3.5 w-3.5" /> Load
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleExportJSON}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 text-xs shadow-sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Builder area */}
      <div className="flex flex-1 overflow-hidden">
        <BuilderSidebar onDragStart={() => {}} />
        <BuilderCanvas
          elements={elements}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onRemoveElement={handleRemoveElement}
          canvasWidth={CANVAS_W}
          canvasHeight={CANVAS_H}
        />
      </div>
    </div>
  );
}
