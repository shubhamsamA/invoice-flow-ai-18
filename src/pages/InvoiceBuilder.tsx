import { useState, useCallback } from "react";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderLivePreview } from "@/components/builder/BuilderLivePreview";
import { BuilderElement, BuilderElementType, BuilderLayout, snapToGrid } from "@/types/builder";
import { Button } from "@/components/ui/button";
import { Save, Download, Upload, Undo2, ArrowLeft, BookmarkPlus, Lock, Unlock, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PAGE_PRESETS, PagePresetKey, DEFAULT_PAGE_PRESET } from "@/lib/invoice-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BuilderPropertiesPanel } from "@/components/builder/BuilderPropertiesPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "invoiceflow-builder-layout";

export default function InvoiceBuilderPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [pageSize, setPageSize] = useState<PagePresetKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const layout = JSON.parse(saved);
        return layout.pageSize || DEFAULT_PAGE_PRESET;
      }
    } catch {}
    return DEFAULT_PAGE_PRESET;
  });
  const [pageLocked, setPageLocked] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).pageLocked || false;
    } catch {}
    return false;
  });
  const preset = PAGE_PRESETS[pageSize];
  const canvasW = preset.width;
  const canvasH = preset.height;

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
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), elements]);
  }, [elements]);

  const handleAddElement = useCallback(
    (el: BuilderElement) => {
      pushHistory();
      setElements((prev) => [...prev, el]);
    },
    [pushHistory],
  );

  const handleUpdateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  }, []);

  const handleRemoveElement = useCallback(
    (id: string) => {
      pushHistory();
      setElements((prev) => prev.filter((el) => el.id !== id));
      setSelectedId(null);
    },
    [pushHistory],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setElements(prev);
    setSelectedId(null);
  }, [history]);

  const handleSave = useCallback(() => {
    const layout: BuilderLayout = {
      id: crypto.randomUUID(),
      name: "Custom Layout",
      elements,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
      createdAt: new Date().toISOString(),
      pageSize,
      pageLocked,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    toast.success("Layout saved");
  }, [elements, canvasW, canvasH, pageSize, pageLocked]);

  const handleExportJSON = useCallback(() => {
    const layout: BuilderLayout = {
      id: crypto.randomUUID(),
      name: "Exported Layout",
      elements,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
      createdAt: new Date().toISOString(),
      pageSize,
      pageLocked,
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Layout exported as JSON");
  }, [elements, canvasW, canvasH, pageSize, pageLocked]);

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

  const handleSaveAsTemplate = useCallback(async () => {
    if (!user || !templateName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("templates").insert({
        user_id: user.id,
        name: templateName.trim(),
        description: templateDesc.trim() || null,
        layout_json: { elements, canvasWidth: canvasW, canvasHeight: canvasH, pageSize, pageLocked } as any,
        canvas_width: canvasW,
        canvas_height: canvasH,
      });
      if (error) throw error;
      toast.success("Template saved!");
      setSaveTemplateOpen(false);
      setTemplateName("");
      setTemplateDesc("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  }, [user, templateName, templateDesc, elements, canvasW, canvasH, pageSize, pageLocked]);

  const handleSelectElement = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id && isMobile) setPropsOpen(true);
    },
    [isMobile],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-muted/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 py-3 shrink-0 gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" asChild>
            <Link to="/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold font-display tracking-tight leading-none">Invoice Builder</h1>
            <p className="text-[10px] text-muted-foreground font-serif italic">Crafting your perfect layout</p>
          </div>

          {/* Editor / Preview toggle */}
          <div className="flex items-center bg-muted/50 rounded-full p-1 ml-2">
            <button
              onClick={() => setActiveTab("editor")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-display transition-all duration-300",
                activeTab === "editor"
                  ? "bg-background shadow-md text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Editor</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold font-display transition-all duration-300",
                activeTab === "preview"
                  ? "bg-background shadow-md text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg mr-2">
            <Select
              value={pageSize}
              onValueChange={(v) => {
                if (pageLocked) {
                  toast.error("Page size is locked. Unlock to change.");
                  return;
                }
                setPageSize(v as PagePresetKey);
              }}
              disabled={pageLocked}
            >
              <SelectTrigger className="h-8 w-[90px] sm:w-[120px] text-[10px] font-bold font-display border-none bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-display">
                {Object.values(PAGE_PRESETS).map((p) => (
                  <SelectItem key={p.key} value={p.key} className="text-xs">
                    {p.label} <span className="text-[10px] text-muted-foreground ml-1">({p.width}×{p.height})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={pageLocked ? "default" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 rounded-md transition-all", pageLocked && "bg-primary text-primary-foreground shadow-sm")}
              onClick={() => setPageLocked(!pageLocked)}
              title={pageLocked ? "Unlock page size" : "Lock page size"}
            >
              {pageLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <div className="hidden lg:flex items-center gap-1 border-r pr-2 mr-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={handleUndo} 
              disabled={history.length === 0}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={handleImportJSON}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Load
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={handleExportJSON}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full gap-2 text-xs font-bold font-display hidden xl:flex border-primary/20 hover:bg-primary/5"
            onClick={() => setSaveTemplateOpen(true)}
            disabled={elements.length === 0}
          >
            <BookmarkPlus className="h-4 w-4 text-primary" /> Save Template
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-full gap-2 px-6 text-xs font-bold font-display shadow-lg transition-all hover:scale-105 active:scale-95 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" /> <span>Save Layout</span>
          </Button>
        </div>
      </div>

      {/* Builder area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "editor" ? (
          <>
            <BuilderSidebar onDragStart={() => {}} />
            <BuilderCanvas
              elements={elements}
              selectedId={selectedId}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              onAddElement={handleAddElement}
              onRemoveElement={handleRemoveElement}
              canvasWidth={canvasW}
              canvasHeight={canvasH}
            />

            {/* Desktop: inline properties panel */}
            {!isMobile && (
              <BuilderPropertiesPanel
                element={selectedElement}
                onUpdate={(updates) => {
                  if (selectedId) handleUpdateElement(selectedId, updates);
                }}
              />
            )}

            {/* Mobile: sheet-based properties panel */}
            {isMobile && (
              <>
                {selectedElement && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="fixed bottom-4 right-4 z-40 gap-1.5 shadow-lg text-xs"
                    onClick={() => setPropsOpen(true)}
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Properties
                  </Button>
                )}
                <Sheet open={propsOpen} onOpenChange={setPropsOpen}>
                  <SheetContent side="right" className="w-72 p-0">
                    <SheetHeader className="p-3 border-b">
                      <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Properties
                      </SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(100%-50px)]">
                      <BuilderPropertiesPanel
                        element={selectedElement}
                        onUpdate={(updates) => {
                          if (selectedId) handleUpdateElement(selectedId, updates);
                        }}
                        embedded
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </>
        ) : (
          <BuilderLivePreview elements={elements} canvasWidth={canvasW} canvasHeight={canvasH} />
        )}
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Professional Invoice"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of this template"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {elements.length} element{elements.length !== 1 ? "s" : ""} will be saved
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || saving}
              className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
