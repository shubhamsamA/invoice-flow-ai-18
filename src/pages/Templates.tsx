import { motion } from "framer-motion";
import { Check, Plus, Trash2, Loader2, Eye, Copy } from "lucide-react";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getBuiltinTemplates } from "@/lib/builtin-templates";
import { TemplatePreviewModal } from "@/components/TemplatePreviewModal";

interface CustomTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout_json: BuilderElement[] | { elements: BuilderElement[]; canvasWidth?: number; canvasHeight?: number; pageSize?: string; pageLocked?: boolean };
  canvas_width: number;
  canvas_height: number;
  created_at: string;
}

/** Built-in template definitions (read-only presets) */
const builtinTemplates = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple — perfect for freelancers and small businesses.",
    color: "from-slate-100 to-slate-50",
    features: ["Simple layout", "One-column items", "Clean typography"],
    preview: (
      <div className="space-y-3 font-mono text-[8px] opacity-50">
        <div className="flex justify-between border-b border-foreground/20 pb-1">
          <span>ID: MNML-01</span>
          <span>V1.0</span>
        </div>
        <div className="h-2 w-16 bg-foreground" />
        <div className="space-y-1">
          <div className="h-0.5 w-full bg-foreground/20" />
          <div className="h-0.5 w-full bg-foreground/20" />
          <div className="h-0.5 w-3/4 bg-foreground/20" />
        </div>
        <div className="pt-2 flex justify-end">
          <div className="h-2 w-8 bg-foreground/40" />
        </div>
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
      <div className="space-y-3 font-mono text-[8px] opacity-50">
        <div className="h-4 w-full bg-primary flex items-center px-2 text-primary-foreground">
          CORP_SYS
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <div className="h-0.5 w-12 bg-primary/40" />
            <div className="h-0.5 w-16 bg-primary/20" />
          </div>
          <div className="flex-1 text-right">
            <div className="h-2 w-8 bg-primary/60 ml-auto" />
          </div>
        </div>
        <div className="border-t border-primary/20 pt-2 space-y-1">
          <div className="h-0.5 w-full bg-primary/10" />
          <div className="h-0.5 w-full bg-primary/10" />
        </div>
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
      <div className="space-y-3 font-mono text-[8px] opacity-50">
        <div className="flex items-center justify-between">
          <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center text-[6px]">
            FR
          </div>
          <div className="h-0.5 w-12 bg-primary" />
        </div>
        <div className="space-y-1">
          <div className="h-0.5 w-full bg-primary/20" />
          <div className="h-0.5 w-full bg-primary/20" />
          <div className="h-0.5 w-2/3 bg-primary/20" />
        </div>
        <div className="mt-4 h-6 w-full bg-primary/10 border border-primary/20" />
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
      <div className="space-y-2 font-mono text-[6px] opacity-50">
        <div className="text-center border-b border-emerald-200 pb-1">
          TAX_INVOICE_V2
        </div>
        <div className="grid grid-cols-4 gap-1">
          <div className="h-1 bg-emerald-200 col-span-2" />
          <div className="h-1 bg-emerald-100" />
          <div className="h-1 bg-emerald-100" />
        </div>
        <div className="space-y-1 py-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-1">
              <div className="h-0.5 flex-1 bg-emerald-50" />
              <div className="h-0.5 w-2 bg-emerald-100" />
              <div className="h-0.5 w-2 bg-emerald-100" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-1 border-t border-emerald-200 pt-1">
          <div className="h-1 w-4 bg-emerald-300" />
          <div className="h-1 w-4 bg-emerald-600" />
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
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const allBuiltinTemplates = getBuiltinTemplates();

  // Fetch user's custom templates from the database
  const { data: customTemplates = [], isLoading } = useQuery<CustomTemplate[]>({
    queryKey: ["custom-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CustomTemplate[];
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
    const custom = customTemplates.find((t) => t.id === templateId);
    if (custom) {
      const lj = custom.layout_json;
      let elems: BuilderElement[] = [];
      let canvasWidth = custom.canvas_width;
      let canvasHeight = custom.canvas_height;
      let pageSize: string | undefined = undefined;
      let pageLocked = false;

      if (Array.isArray(lj)) {
        elems = lj;
      } else {
        elems = lj.elements;
        canvasWidth = lj.canvasWidth || canvasWidth;
        canvasHeight = lj.canvasHeight || canvasHeight;
        pageSize = lj.pageSize;
        pageLocked = lj.pageLocked || false;
      }

      const data = {
        id: crypto.randomUUID(),
        name: custom.name,
        elements: elems,
        canvasWidth,
        canvasHeight,
        createdAt: new Date().toISOString(),
        pageSize,
        pageLocked,
      };
      localStorage.setItem("invoiceflow-builder-layout", JSON.stringify(data));
      toast.success("Template loaded into builder");
      navigate("/invoices/builder");
    }
  };



  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-16">
        {/* Header Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-12 border-b border-foreground/20 pb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-foreground/40" />
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-60">
                System / Templates / V2.4
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase leading-[0.85]">
              Visual <br />
              <span className="italic font-serif lowercase tracking-tight opacity-40">Blueprints.</span>
            </h1>
            
            <div className="flex flex-col md:flex-row gap-8 md:items-center">
              <p className="text-sm font-medium max-w-sm leading-relaxed opacity-70">              
                Select a module to initialize the design environment.
              </p>
              
           
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
      
            
            {selected && (
              <Button
                size="lg"
                className="h-16 px-12 rounded-none bg-primary text-primary-foreground hover:bg-foreground hover:text-background text-[11px] uppercase tracking-[0.4em] font-bold shadow-2xl shadow-primary/20"
                onClick={() => loadTemplate(selected)}
              >
             Use template in builder
              </Button>
            )}
          </div>
        </motion.div>

    

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-0 border border-foreground/20">
          {/* Builtin Templates Section */}
          <div className="border-r border-foreground/20">
            <div className="flex items-center justify-between p-6 border-b border-foreground/20 bg-foreground/5">
              <h2 className="text-[11px] uppercase tracking-[0.5em] font-black">
                01 / Core Presets
              </h2>
              <span className="font-mono text-[10px] opacity-40">
                {builtinTemplates.length} MODULES ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {builtinTemplates.map((t, i) => (
                <motion.div
                  key={t.id}
                  className={`group relative border-b border-r border-foreground/20 transition-all duration-300 cursor-pointer overflow-hidden ${
                    selected === t.id 
                      ? "bg-foreground text-background" 
                      : "hover:bg-foreground/5"
                  }`}
                  onClick={() => setSelected(t.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Visual Preview Container */}
                  <div className={`aspect-[16/10] p-12 flex items-center justify-center relative overflow-hidden border-b border-foreground/10 ${selected === t.id ? 'opacity-20' : ''}`}>
                    <div className="absolute inset-0 opacity-5 pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    
                    <div className="w-full max-w-[240px] bg-background shadow-2xl p-6 border border-foreground/10 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                      {t.preview}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-display font-black uppercase tracking-tighter leading-none">
                          {t.name}
                        </h3>
                        <p className={`text-xs font-medium leading-relaxed italic font-serif ${selected === t.id ? 'opacity-60' : 'opacity-40'}`}>
                          {t.description}
                        </p>
                      </div>
                      <span className="font-mono text-[9px] opacity-30 mt-1">
                        [{t.id.toUpperCase()}]
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {t.features.map((f) => (
                        <span key={f} className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 border ${selected === t.id ? 'border-background/20 text-background' : 'border-foreground/10 text-foreground/60'}`}>
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 text-[10px] uppercase tracking-wider ${selected === t.id ? 'text-background/70 hover:text-background hover:bg-background/10' : 'text-foreground/50 hover:text-foreground'}`}
                        onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(t.id); }}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 text-[10px] uppercase tracking-wider ${selected === t.id ? 'text-background/70 hover:text-background hover:bg-background/10' : 'text-foreground/50 hover:text-foreground'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const bt = allBuiltinTemplates.find(bt => bt.id === t.id);
                          if (bt) {
                            const data = {
                              id: crypto.randomUUID(),
                              name: bt.name + " (Copy)",
                              elements: bt.elements,
                              canvasWidth: 640,
                              canvasHeight: 900,
                              createdAt: new Date().toISOString(),
                            };
                            localStorage.setItem("invoiceflow-builder-layout", JSON.stringify(data));
                            toast.success("Template loaded into builder");
                            navigate("/invoices/builder");
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Customize
                      </Button>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selected === t.id && (
                    <div className="absolute top-6 right-6">
                      <div className="h-3 w-3 bg-background rounded-full animate-pulse" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Templates Sidebar */}
          <div className="bg-foreground/5">
            <div className="flex items-center justify-between p-6 border-b border-foreground/20 bg-foreground text-background">
              <h2 className="text-[11px] uppercase tracking-[0.5em] font-black">
                02 / Registry
              </h2>
           
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30">
                  Syncing_Data...
                </span>
              </div>
            ) : customTemplates.length > 0 ? (
              <div className="divide-y divide-foreground/10">
                {customTemplates.map((t, i) => (
                  <motion.div
                    key={t.id}
                    className={`group p-8 transition-all cursor-pointer relative ${
                      selected === t.id 
                        ? "bg-foreground text-background" 
                        : "hover:bg-foreground/10"
                    }`}
                    onClick={() => setSelected(t.id)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] opacity-30">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-lg font-black uppercase tracking-tight">
                            {t.name}
                          </h3>
                        </div>
                        <div className="font-mono text-[9px] opacity-40 flex gap-4">
                          <span>DATE: {new Date(t.created_at).toLocaleDateString()}</span>
                          <span>RES: {t.canvas_width}x{t.canvas_height}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-none border transition-all ${
                          selected === t.id 
                            ? 'border-background/10 hover:bg-destructive hover:text-destructive-foreground' 
                            : 'border-foreground/10 hover:bg-destructive hover:text-destructive-foreground'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {t.description && (
                      <p className={`text-xs font-medium leading-relaxed italic font-serif line-clamp-2 ${selected === t.id ? 'opacity-60' : 'opacity-40'}`}>
                        {t.description}
                      </p>
                    )}

                    {selected === t.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-background" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-12 text-center space-y-8">
                <div className="h-16 w-16 border border-foreground/10 flex items-center justify-center relative">
                  <Plus className="h-6 w-6 opacity-20" />
                  <div className="absolute -top-1 -left-1 h-2 w-2 bg-foreground" />
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-foreground" />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">
                    Registry Empty
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-30 max-w-[220px] mx-auto italic font-serif">
                    Initialize a snapshot to populate your private blueprint repository.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(() => {
        const previewT = allBuiltinTemplates.find(t => t.id === previewTemplateId);
        return previewT ? (
          <TemplatePreviewModal
            open={!!previewTemplateId}
            onOpenChange={(open) => { if (!open) setPreviewTemplateId(null); }}
            templateName={previewT.name}
            templateDescription={previewT.description}
            elements={previewT.elements}
            onSelect={() => { loadTemplate(previewT.id); setPreviewTemplateId(null); }}
            onDuplicate={() => {
              const data = {
                id: crypto.randomUUID(),
                name: previewT.name + " (Copy)",
                elements: previewT.elements,
                canvasWidth: 640,
                canvasHeight: 900,
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem("invoiceflow-builder-layout", JSON.stringify(data));
              toast.success("Template loaded into builder for customization");
              navigate("/invoices/builder");
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
