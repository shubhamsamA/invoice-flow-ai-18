import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Zap, FileText, Loader2, Download, MessageSquare, Lightbulb, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportInvoicePDF } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          AI-Powered Extraction
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display mb-4">
          Smart Invoice Generator
        </h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
          Transform your natural language descriptions into structured, professional invoices in seconds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <motion.div
          className="lg:col-span-7 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest font-display">Describe your billing</span>
            </div>
            <div className="p-6 space-y-4">
              <Textarea
                placeholder="e.g. 'Create invoice for 2 laptops ₹50,000 each with 18% GST for Rahul'"
                className="min-h-[160px] resize-none text-base font-sans border-none focus-visible:ring-0 p-4 placeholder:text-muted-foreground/50 bg-transparent"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className={cn("h-4 w-4 transition-colors", prompt.trim() ? "text-yellow-500" : "text-muted-foreground/30")} />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Ready to process</span>
                </div>
                <Button
                  className="rounded-full px-8 font-display font-bold tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Analyzing..." : "Generate Invoice"}
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
              {examples.map((ex, i) => (
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

        {/* Result Section */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                className="bg-card rounded-2xl border shadow-2xl overflow-hidden sticky top-8"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest font-display">Preview Data</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-tighter">
                    AI Verified
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Client Name</label>
                    <p className="text-xl font-display font-bold tracking-tight">{result.client}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Line Items</label>
                    <div className="space-y-2">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.qty} unit{item.qty > 1 ? 's' : ''} × {fmt(item.price)}</p>
                          </div>
                          <p className="text-sm font-mono font-bold">{fmt(item.qty * item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-serif italic">Subtotal</span>
                      <span className="font-mono">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-serif italic">Tax ({result.gst}%)</span>
                      <span className="font-mono text-primary">+{fmt(gstAmt)}</span>
                    </div>
                    {result.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-serif italic">Discount ({result.discount}%)</span>
                        <span className="font-mono text-green-600">-{fmt(discAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end pt-4">
                      <span className="text-xs font-bold uppercase tracking-widest font-display">Total Amount</span>
                      <span className="text-3xl font-display font-bold tracking-tighter text-primary">{fmt(total)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-xs h-11"
                      onClick={() => result && exportInvoicePDF(result)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export PDF
                    </Button>
                    <Button
                      className="rounded-xl font-bold text-xs h-11 shadow-lg"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("ai_data", JSON.stringify(result));
                        navigate(`/invoices/new?${params.toString()}`);
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" /> Create Full
                    </Button>
                  </div>
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
                  <Zap className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg">No Data Extracted</h3>
                  <p className="text-sm text-muted-foreground font-serif italic max-w-[200px]">
                    Enter your invoice details on the left to see the AI magic happen.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
