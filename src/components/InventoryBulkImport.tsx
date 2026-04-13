import { useState, useRef } from "react";
import { Upload, Download, Loader2, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedItem {
  name: string;
  description: string;
  hsn_code: string;
  sku: string;
  category: string;
  unit: string;
  unit_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  error?: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(current.trim()); current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current.trim());
      if (row.some(c => c)) rows.push(row);
      row = []; current = "";
    } else { current += ch; }
  }
  row.push(current.trim());
  if (row.some(c => c)) rows.push(row);
  return rows;
}

const EXPECTED_HEADERS = ["name", "description", "hsn_code", "sku", "category", "unit", "unit_price", "stock_quantity", "low_stock_threshold"];

function mapRow(headers: string[], row: string[]): ParsedItem {
  const get = (key: string) => {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/[\s_-]/g, "") === key.toLowerCase().replace(/[\s_-]/g, ""));
    return idx >= 0 ? (row[idx] || "") : "";
  };
  const name = get("name");
  const unit_price = parseFloat(get("unitprice") || get("unit_price") || get("price") || "0") || 0;
  const stock_quantity = parseFloat(get("stockquantity") || get("stock_quantity") || get("stock") || get("quantity") || "0") || 0;
  const low_stock_threshold = parseFloat(get("lowstockthreshold") || get("low_stock_threshold") || get("lowstock") || "5") || 5;

  return {
    name,
    description: get("description"),
    hsn_code: get("hsncode") || get("hsn_code") || get("hsn"),
    sku: get("sku"),
    category: get("category"),
    unit: get("unit") || "pcs",
    unit_price,
    stock_quantity,
    low_stock_threshold,
    error: !name ? "Name is required" : undefined,
  };
}

export default function InventoryBulkImport({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const reset = () => { setParsed([]); setDone(false); setImportCount(0); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
      const headers = rows[0];
      const items = rows.slice(1).map(r => mapRow(headers, r));
      setParsed(items);
      setDone(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const validItems = parsed.filter(p => !p.error);
  const errorItems = parsed.filter(p => p.error);

  const handleImport = async () => {
    if (!user || validItems.length === 0) return;
    setImporting(true);
    try {
      const payload = validItems.map(item => ({
        user_id: user.id,
        name: item.name,
        description: item.description || null,
        hsn_code: item.hsn_code || null,
        sku: item.sku || null,
        category: item.category || null,
        unit: item.unit,
        unit_price: item.unit_price,
        stock_quantity: item.stock_quantity,
        low_stock_threshold: item.low_stock_threshold,
        is_active: true,
      }));
      const { error } = await supabase.from("inventory").insert(payload);
      if (error) throw error;
      setImportCount(validItems.length);
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`${validItems.length} items imported successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import items");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "name,description,hsn_code,sku,category,unit,unit_price,stock_quantity,low_stock_threshold\nWidget A,A sample widget,998311,WDG-001,Products,pcs,250,100,10\nService B,Consulting service,998312,SVC-002,Services,hrs,1500,0,0";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventory_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory</DialogTitle>
        </DialogHeader>

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{importCount} items imported!</p>
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Close</Button>
          </motion.div>
        ) : parsed.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload a CSV file with your inventory items. Download the template to see the expected format.</p>
            <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="default">{validItems.length} valid</Badge>
              {errorItems.length > 0 && <Badge variant="destructive">{errorItems.length} errors</Badge>}
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">SKU</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-right font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((item, i) => (
                      <tr key={i} className={item.error ? "bg-destructive/5" : ""}>
                        <td className="px-3 py-1.5">
                          {item.error
                            ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            : <Check className="h-3.5 w-3.5 text-primary" />}
                        </td>
                        <td className="px-3 py-1.5 font-medium">{item.name || <span className="text-destructive italic">Missing</span>}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{item.sku || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{item.category || "—"}</td>
                        <td className="px-3 py-1.5 text-right">₹{item.unit_price.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-1.5 text-right">{item.stock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={handleImport} disabled={importing || validItems.length === 0} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {validItems.length} Items
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
