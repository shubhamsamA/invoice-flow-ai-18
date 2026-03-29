import { motion } from "framer-motion";
import { Check, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuilderElement, DEFAULT_SIZES, DEFAULT_CONTENT } from "@/types/builder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Built-in template definitions (read-only presets) */
const builtinTemplates = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple — perfect for freelancers and small businesses.",
    color: "from-slate-100 to-slate-50",
    features: ["Simple layout", "One-column items", "Clean typography"],
    preview: (
      <div className="space-y-3">
        <div className="h-2 w-16 rounded bg-slate-800" />
        <div className="h-1 w-24 rounded bg-slate-300" />
        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full rounded bg-slate-200" />
          <div className="h-1 w-full rounded bg-slate-200" />
          <div className="h-1 w-3/4 rounded bg-slate-200" />
        </div>
        <div className="mt-3 h-1.5 w-20 rounded bg-slate-800 ml-auto" />
      </div>
    ),
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional and structured — ideal for agencies and enterprises.",
    color: "from-blue-50 to-indigo-50",
    features: ["Header banner", "Two-column layout", "Company branding"],
    preview: (
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-blue-700" />
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <div className="h-1 w-12 rounded bg-blue-300" />
            <div className="h-1 w-16 rounded bg-blue-200" />
          </div>
          <div className="flex-1 space-y-1 text-right">
            <div className="h-1 w-12 rounded bg-blue-300 ml-auto" />
            <div className="h-1 w-16 rounded bg-blue-200 ml-auto" />
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-1 w-full rounded bg-blue-100" />
          <div className="h-1 w-full rounded bg-blue-100" />
        </div>
        <div className="h-1.5 w-20 rounded bg-blue-700 ml-auto" />
      </div>
    ),
  },
  {
    id: "freelance",
    name: "Modern Freelance",
    description: "Bold and creative — showcase your work with style.",
    color: "from-amber-50 to-orange-50",
    features: ["Accent color bar", "Rounded elements", "Modern feel"],
    preview: (
      <div className="space-y-3">
        <div className="h-1 w-full rounded-full bg-amber-500" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-amber-400" />
          <div className="h-1.5 w-20 rounded bg-amber-800" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1 w-full rounded-full bg-amber-200" />
          <div className="h-1 w-full rounded-full bg-amber-200" />
          <div className="h-1 w-2/3 rounded-full bg-amber-200" />
        </div>
        <div className="mt-2 h-4 w-24 rounded-full bg-amber-600 ml-auto" />
      </div>
    ),
  },
  {
    id: "gst",
    name: "Indian GST",
    description: "GST-compliant format with CGST/SGST breakdowns and HSN codes.",
    color: "from-emerald-50 to-green-50",
    features: ["HSN/SAC codes", "CGST/SGST split", "Tax invoice format"],
    preview: (
      <div className="space-y-3">
        <div className="text-center space-y-0.5">
          <div className="h-1.5 w-16 rounded bg-emerald-800 mx-auto" />
          <div className="h-0.5 w-10 rounded bg-emerald-300 mx-auto" />
        </div>
        <div className="border border-emerald-200 rounded p-1 space-y-1">
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded bg-emerald-200" />
            <div className="h-1 w-6 rounded bg-emerald-200" />
            <div className="h-1 w-6 rounded bg-emerald-200" />
            <div className="h-1 w-6 rounded bg-emerald-200" />
          </div>
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded bg-emerald-100" />
            <div className="h-1 w-6 rounded bg-emerald-100" />
            <div className="h-1 w-6 rounded bg-emerald-100" />
            <div className="h-1 w-6 rounded bg-emerald-100" />
          </div>
        </div>
        <div className="space-y-0.5 ml-auto w-24">
          <div className="flex justify-between">
            <div className="h-0.5 w-8 rounded bg-emerald-300" />
            <div className="h-0.5 w-8 rounded bg-emerald-300" />
          </div>
          <div className="flex justify-between">
            <div className="h-1 w-10 rounded bg-emerald-700" />
            <div className="h-1 w-10 rounded bg-emerald-700" />
          </div>
        </div>
      </div>
    ),
  },
];

/** Prebuilt template layouts — maps template id to BuilderElement arrays */
const templateLayouts: Record<string, BuilderElement[]> = {
  minimal: [
    {
      id: crypto.randomUUID(),
      type: "text",
      x: 32,
      y: 32,
      width: 320,
      height: 48,
      content: { text: "INVOICE", fontSize: 24, bold: true },
    },
    {
      id: crypto.randomUUID(),
      type: "client-details",
      x: 32,
      y: 96,
      ...DEFAULT_SIZES["client-details"],
      content: DEFAULT_CONTENT["client-details"],
    },
    {
      id: crypto.randomUUID(),
      type: "divider",
      x: 32,
      y: 256,
      ...DEFAULT_SIZES["divider"],
      content: DEFAULT_CONTENT["divider"],
    },
    {
      id: crypto.randomUUID(),
      type: "items-table",
      x: 32,
      y: 288,
      ...DEFAULT_SIZES["items-table"],
      content: DEFAULT_CONTENT["items-table"],
    },
    {
      id: crypto.randomUUID(),
      type: "total-summary",
      x: 320,
      y: 528,
      ...DEFAULT_SIZES["total-summary"],
      content: DEFAULT_CONTENT["total-summary"],
    },
    {
      id: crypto.randomUUID(),
      type: "signature",
      x: 32,
      y: 736,
      ...DEFAULT_SIZES["signature"],
      content: DEFAULT_CONTENT["signature"],
    },
  ],
  corporate: [
    { id: crypto.randomUUID(), type: "logo", x: 32, y: 32, ...DEFAULT_SIZES["logo"], content: DEFAULT_CONTENT["logo"] },
    {
      id: crypto.randomUUID(),
      type: "text",
      x: 208,
      y: 48,
      width: 400,
      height: 48,
      content: { text: "CORPORATE INVOICE", fontSize: 22, bold: true },
    },
    {
      id: crypto.randomUUID(),
      type: "client-details",
      x: 32,
      y: 128,
      ...DEFAULT_SIZES["client-details"],
      content: DEFAULT_CONTENT["client-details"],
    },
    {
      id: crypto.randomUUID(),
      type: "items-table",
      x: 32,
      y: 288,
      width: 576,
      height: 256,
      content: DEFAULT_CONTENT["items-table"],
    },
    {
      id: crypto.randomUUID(),
      type: "total-summary",
      x: 320,
      y: 560,
      ...DEFAULT_SIZES["total-summary"],
      content: DEFAULT_CONTENT["total-summary"],
    },
    {
      id: crypto.randomUUID(),
      type: "signature",
      x: 32,
      y: 768,
      ...DEFAULT_SIZES["signature"],
      content: DEFAULT_CONTENT["signature"],
    },
  ],
  freelance: [
    { id: crypto.randomUUID(), type: "divider", x: 32, y: 16, width: 576, height: 16, content: { style: "solid" } },
    { id: crypto.randomUUID(), type: "logo", x: 32, y: 48, ...DEFAULT_SIZES["logo"], content: DEFAULT_CONTENT["logo"] },
    {
      id: crypto.randomUUID(),
      type: "text",
      x: 32,
      y: 144,
      width: 400,
      height: 48,
      content: { text: "Invoice", fontSize: 28, bold: true },
    },
    {
      id: crypto.randomUUID(),
      type: "client-details",
      x: 32,
      y: 208,
      ...DEFAULT_SIZES["client-details"],
      content: DEFAULT_CONTENT["client-details"],
    },
    {
      id: crypto.randomUUID(),
      type: "items-table",
      x: 32,
      y: 368,
      ...DEFAULT_SIZES["items-table"],
      content: DEFAULT_CONTENT["items-table"],
    },
    {
      id: crypto.randomUUID(),
      type: "total-summary",
      x: 320,
      y: 608,
      ...DEFAULT_SIZES["total-summary"],
      content: DEFAULT_CONTENT["total-summary"],
    },
  ],
  gst: [
    {
      id: crypto.randomUUID(),
      type: "text",
      x: 160,
      y: 32,
      width: 320,
      height: 48,
      content: { text: "TAX INVOICE", fontSize: 22, bold: true },
    },
    { id: crypto.randomUUID(), type: "logo", x: 32, y: 32, width: 112, height: 64, content: DEFAULT_CONTENT["logo"] },
    {
      id: crypto.randomUUID(),
      type: "client-details",
      x: 32,
      y: 112,
      ...DEFAULT_SIZES["client-details"],
      content: { ...DEFAULT_CONTENT["client-details"], gst: "07AABCU9603R1ZM" },
    },
    {
      id: crypto.randomUUID(),
      type: "divider",
      x: 32,
      y: 272,
      width: 576,
      height: 16,
      content: DEFAULT_CONTENT["divider"],
    },
    {
      id: crypto.randomUUID(),
      type: "items-table",
      x: 32,
      y: 304,
      width: 576,
      height: 256,
      content: { items: [{ name: "Service (HSN 998311)", qty: 1, price: 10000 }] },
    },
    {
      id: crypto.randomUUID(),
      type: "total-summary",
      x: 320,
      y: 576,
      ...DEFAULT_SIZES["total-summary"],
      content: { subtotal: 10000, gst: 18, discount: 0 },
    },
    {
      id: crypto.randomUUID(),
      type: "signature",
      x: 32,
      y: 768,
      ...DEFAULT_SIZES["signature"],
      content: DEFAULT_CONTENT["signature"],
    },
  ],
};

export default function TemplatesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Fetch user's custom templates from the database
  const { data: customTemplates = [], isLoading } = useQuery({
    queryKey: ["custom-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Delete custom template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-templates"] });
      toast.success("Template deleted");
    },
  });

  // Save current builder layout as a new template
  const saveAsTemplate = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const saved = localStorage.getItem("invoiceflow-builder-layout");
      if (!saved) throw new Error("No layout in builder");
      const layout = JSON.parse(saved);
      const { error } = await supabase.from("templates").insert({
        user_id: user!.id,
        name,
        description: description || null,
        layout_json: layout.elements,
        canvas_width: layout.canvasWidth || 640,
        canvas_height: layout.canvasHeight || 900,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-templates"] });
      setSaveDialogOpen(false);
      toast.success("Template saved");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save template"),
  });

  /** Load a builtin or custom template into the builder */
  const loadTemplate = (templateId: string) => {
    // Check builtin templates first
    const builtinLayout = templateLayouts[templateId];
    if (builtinLayout) {
      const data = {
        id: crypto.randomUUID(),
        name: builtinTemplates.find((t) => t.id === templateId)?.name || "Template",
        elements: builtinLayout,
        canvasWidth: 640,
        canvasHeight: 900,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("invoiceflow-builder-layout", JSON.stringify(data));
      toast.success("Template loaded into builder");
      navigate("/invoices/builder");
      return;
    }

    // Check custom templates
    const custom = customTemplates.find((t: any) => t.id === templateId);
    if (custom) {
      const lj = custom.layout_json as any;
      const elems = Array.isArray(lj) ? lj : lj?.elements || [];
      const data = {
        id: crypto.randomUUID(),
        name: custom.name,
        elements: elems,
        canvasWidth: lj?.canvasWidth || custom.canvas_width,
        canvasHeight: lj?.canvasHeight || custom.canvas_height,
        createdAt: new Date().toISOString(),
        pageSize: lj?.pageSize || undefined,
        pageLocked: lj?.pageLocked || false,
      };
      localStorage.setItem("invoiceflow-builder-layout", JSON.stringify(data));
      toast.success("Template loaded into builder");
      navigate("/invoices/builder");
    }
  };

  const handleSaveTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveAsTemplate.mutate({
      name: form.get("name") as string,
      description: form.get("description") as string,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Invoice Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a template or create your own.</p>
        </div>
        <Button
          className="gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
          onClick={() => setSaveDialogOpen(true)}
        >
          <Plus className="h-4 w-4" /> Save Current Layout as Template
        </Button>
      </motion.div>

      {/* Save template dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Saves the current builder layout as a reusable template.</p>
          <form onSubmit={handleSaveTemplate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template Name</Label>
              <Input name="name" placeholder="e.g. My Custom Invoice" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input name="description" placeholder="Brief description..." />
            </div>
            <Button
              type="submit"
              className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
              disabled={saveAsTemplate.isPending}
            >
              {saveAsTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Template
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Builtin Templates */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Prebuilt Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {builtinTemplates.map((t, i) => (
            <motion.div
              key={t.id}
              className={`bg-card rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all ${
                selected === t.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
              }`}
              onClick={() => setSelected(t.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`bg-gradient-to-br ${t.color} p-8`}>
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-[200px] mx-auto">{t.preview}</div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  {selected === t.id && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.features.map((f) => (
                    <span key={f} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      {(customTemplates.length > 0 || isLoading) && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Templates</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTemplates.map((t: any, i: number) => (
                <motion.div
                  key={t.id}
                  className={`bg-card rounded-xl border shadow-sm p-5 cursor-pointer transition-all ${
                    selected === t.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelected(t.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {selected === t.id && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Use Template Button */}
      {selected && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            size="lg"
            className="shadow-sm px-8 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            onClick={() => loadTemplate(selected)}
          >
            Use Template
          </Button>
        </motion.div>
      )}
    </div>
  );
}
