import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Zap, FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportInvoicePDF } from "@/lib/pdf-export";

const examples = [
  "Create invoice for 2 laptops ₹50,000 each with 18% GST for Rahul",
  "Bill Meera Consulting ₹15,000 for logo design, ₹8,000 for brand guide, 5% discount",
  "Invoice TechCorp for 10 hours of consulting at ₹3,500/hr plus 18% GST",
];

interface ParsedData {
  client: string;
  items: { name: string; qty: number; price: number }[];
  gst: number;
  discount: number;
}

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedData | null>(null);

  /**
   * Calls the parse-invoice edge function which uses Lovable AI
   * to extract structured invoice data from natural language.
   */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-invoice", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as ParsedData);
      toast.success("Invoice data extracted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse invoice");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = result ? result.items.reduce((s, i) => s + i.qty * i.price, 0) : 0;
  const gstAmt = result ? (subtotal * result.gst) / 100 : 0;
  const discAmt = result ? (subtotal * result.discount) / 100 : 0;
  const total = subtotal + gstAmt - discAmt;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered
        </div>
        <h1 className="text-2xl font-semibold">AI Invoice Generator</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Describe your invoice in plain language and let AI extract the structured data for you.
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        className="bg-card rounded-xl border shadow-sm p-6 space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Textarea
          placeholder="Describe your invoice... e.g. 'Create invoice for 2 laptops ₹50,000 each with 18% GST for Rahul'"
          className="min-h-[100px] resize-none text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-full text-muted-foreground transition-colors cursor-pointer"
              >
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
          <Button
            className="gap-2 shadow-sm shrink-0 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Analyzing..." : "Generate"}
          </Button>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="bg-card rounded-xl border shadow-sm p-6 space-y-5"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--success)/0.1)] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Extracted Invoice Data</h2>
                <p className="text-xs text-muted-foreground">AI has parsed your description</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-20 shrink-0">Client:</span>
                <span className="font-medium">{result.client}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Items</span>
                <div className="mt-2 space-y-2">
                  {result.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 text-sm"
                    >
                      <span>{item.name}</span>
                      <span className="tabular-nums font-medium">
                        {item.qty} × {fmt(item.price)} = {fmt(item.qty * item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({result.gst}%)</span>
                  <span className="tabular-nums">+{fmt(gstAmt)}</span>
                </div>
                {result.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount ({result.discount}%)</span>
                    <span className="tabular-nums text-[hsl(var(--success))]">-{fmt(discAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1.5 border-t">
                  <span>Total</span>
                  <span className="tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70">
                <ArrowRight className="h-4 w-4" /> Use This Data to Create Invoice
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                onClick={() => result && exportInvoicePDF(result)}
              >
                <Download className="h-4 w-4" /> PDF
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
