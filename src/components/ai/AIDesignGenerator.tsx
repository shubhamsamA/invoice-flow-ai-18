import { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Sparkles, ArrowRight, Loader2, Lightbulb, Palette, Layout, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const designExamples = [
  "Minimal clean invoice with logo top-left, business details top-right, and a simple items table",
  "Professional invoice with header divider, bank details at bottom, and signature area",
  "Modern invoice with large invoice number, compact items table, notes section and bank details",
];

const STORAGE_KEY = "invoiceflow-builder-layout";

export function AIDesignGenerator({ navigate }: { navigate: NavigateFunction }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGenerated(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-design", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save to localStorage so the builder picks it up
      const layout = {
        id: "ai-generated",
        name: "AI Generated Layout",
        elements: data.elements,
        canvasWidth: data.canvasWidth,
        canvasHeight: data.canvasHeight,
        pageSize: data.pageSize || "compact",
        pageLocked: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      setGenerated(true);
      toast.success("Invoice design generated! Opening builder...");

      setTimeout(() => navigate("/invoices/builder"), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate design");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <motion.div
        className="lg:col-span-7 space-y-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest font-display">Describe your design</span>
          </div>
          <div className="p-6 space-y-4">
            <Textarea
              placeholder="e.g. 'Minimal invoice with logo top-left, items table, bank details at bottom, and signature'"
              className="min-h-[160px] resize-none text-base font-sans border-none focus-visible:ring-0 p-4 placeholder:text-muted-foreground/50 bg-transparent"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layout className={cn("h-4 w-4 transition-colors", prompt.trim() ? "text-primary" : "text-muted-foreground/30")} />
                <span className="text-[10px] uppercase tracking-wider font-bold">Design mode</span>
              </div>
              <Button
                className="rounded-full px-8 font-display font-bold tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? "Designing..." : "Generate Design"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground px-2">
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Try these examples</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {designExamples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="text-left text-xs p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all group flex items-center justify-between"
              >
                <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{ex}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="lg:col-span-5">
        <AnimatePresence mode="wait">
          {generated ? (
            <motion.div
              key="success"
              className="bg-card rounded-2xl border shadow-2xl overflow-hidden sticky top-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest font-display">Design Ready</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-tighter">AI Generated</div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xl">Design Generated!</h3>
                  <p className="text-sm text-muted-foreground font-serif italic">Opening the builder so you can customize your layout...</p>
                </div>
                <Button className="rounded-xl font-bold text-xs h-11 shadow-lg" onClick={() => navigate("/invoices/builder")}>
                  <ArrowRight className="h-4 w-4 mr-2" /> Open Builder Now
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center p-8 text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Palette className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg">No Design Yet</h3>
                <p className="text-sm text-muted-foreground font-serif italic max-w-[220px]">
                  Describe your ideal invoice layout and AI will create it for you.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
