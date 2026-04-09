import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, AlertCircle, Check, Download, Info, FileText, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ParsedInvoice {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  items: { name: string; quantity: number; price: number; gst_type: string; gst_rate: number }[];
  issue_date: string;
  due_date: string;
  notes: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += ch;
    }
  }
  row.push(current.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

function groupIntoInvoices(rows: string[][], headers: string[]): ParsedInvoice[] {
  const colIndex = (names: string[]) => {
    for (const n of names) {
      const idx = headers.findIndex((h) => h.toLowerCase().replace(/[^a-z]/g, "").includes(n));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const clientCol = colIndex(["client", "customer", "billto", "company"]);
  const clientEmailCol = colIndex(["clientemail", "customeremail", "email"]);
  const clientPhoneCol = colIndex(["clientphone", "customerphone", "phone"]);
  const clientAddressCol = colIndex(["clientaddress", "customeraddress", "address"]);
  const itemCol = colIndex(["item", "description", "product", "service"]);
  const qtyCol = colIndex(["qty", "quantity", "units"]);
  const priceCol = colIndex(["price", "rate", "unitprice", "amount"]);
  const gstTypeCol = colIndex(["gsttype", "taxtype"]);
  const gstRateCol = colIndex(["gstrate", "taxrate", "gst"]);
  const dateCol = colIndex(["date", "issuedate", "invoicedate"]);
  const dueCol = colIndex(["due", "duedate"]);
  const notesCol = colIndex(["notes", "note", "memo"]);

  if (clientCol < 0 || itemCol < 0) {
    throw new Error("CSV must have at least 'Client' and 'Item' columns");
  }

  const invoiceMap = new Map<string, ParsedInvoice>();

  for (const row of rows) {
    const client = row[clientCol] || "";
    if (!client) continue;

    if (!invoiceMap.has(client)) {
      invoiceMap.set(client, {
        client_name: client,
        client_email: clientEmailCol >= 0 ? row[clientEmailCol] || "" : "",
        client_phone: clientPhoneCol >= 0 ? row[clientPhoneCol] || "" : "",
        client_address: clientAddressCol >= 0 ? row[clientAddressCol] || "" : "",
        items: [],
        issue_date: dateCol >= 0 ? row[dateCol] || new Date().toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        due_date: dueCol >= 0 ? row[dueCol] || "" : "",
        notes: notesCol >= 0 ? row[notesCol] || "" : "",
      });
    }

    const inv = invoiceMap.get(client)!;
    inv.items.push({
      name: row[itemCol] || "Item",
      quantity: qtyCol >= 0 ? parseFloat(row[qtyCol]) || 1 : 1,
      price: priceCol >= 0 ? parseFloat(row[priceCol]) || 0 : 0,
      gst_type: gstTypeCol >= 0 ? row[gstTypeCol] || "none" : "none",
      gst_rate: gstRateCol >= 0 ? parseFloat(row[gstRateCol]) || 0 : 0,
    });
  }

  return Array.from(invoiceMap.values());
}

export default function BulkUploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedInvoice[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: lastInvoice } = useQuery({
    queryKey: ["last-invoice-number"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0]?.invoice_number || "INV-000";
    },
    enabled: !!user,
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setParsed([]);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("File must have a header row and at least one data row");
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const invoices = groupIntoInvoices(dataRows, headers);
      if (invoices.length === 0) throw new Error("No valid invoices found in the file");
      setParsed(invoices);
      toast.success(`Found ${invoices.length} invoice(s) with ${invoices.reduce((s, i) => s + i.items.length, 0)} items`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse file";
      setError(message);
    }
  };

  const handleCreateAll = async () => {
    if (!user || parsed.length === 0) return;
    setSaving(true);

    try {
      let counter = 0;
      const match = lastInvoice?.match(/(\d+)$/);
      if (match) counter = parseInt(match[1]);

      for (const inv of parsed) {
        counter++;
        const invoiceNumber = `INV-${String(counter).padStart(3, "0")}`;

        const clientMatch = clients.find(
          (c) => c.name.toLowerCase() === inv.client_name.toLowerCase()
        );

        const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
        const totalGst = inv.items.reduce((s, i) => {
          const itemTotal = i.quantity * i.price;
          return s + (itemTotal * i.gst_rate) / 100;
        }, 0);
        const total = subtotal + totalGst;

        const inlineClientJson = clientMatch
          ? null
          : { name: inv.client_name, email: inv.client_email, phone: inv.client_phone, address: inv.client_address, gst_number: "" };

        const { data: created, error: invErr } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            client_id: clientMatch?.id || null,
            inline_client_json: inlineClientJson,
            invoice_number: invoiceNumber,
            issue_date: inv.issue_date,
            due_date: inv.due_date || null,
            subtotal,
            discount: 0,
            gst_rate: 0,
            gst_amount: totalGst,
            total,
            notes: inv.notes || null,
          })
          .select("id")
          .single();
        if (invErr) throw invErr;

        const itemRows = inv.items.map((item, idx) => ({
          invoice_id: created.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          amount: item.quantity * item.price,
          sort_order: idx,
          description: item.gst_type !== "none" ? `${item.gst_type.toUpperCase()} @ ${item.gst_rate}%` : null,
        }));

        const { error: itemsErr } = await supabase.from("invoice_items").insert(itemRows);
        if (itemsErr) throw itemsErr;
      }

      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`${parsed.length} invoice(s) created successfully!`);
      navigate("/invoices");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create invoices: " + message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const downloadSampleCSV = () => {
    const headers = "Client,Client Email,Client Phone,Client Address,Item,Qty,Price,GST Type,GST Rate,Date,Due Date,Notes";
    const row1 = "Acme Corp,billing@acme.com,9876543210,\"123 Industrial Area, Mumbai\",Web Development,1,50000,cgst_sgst,18,2024-04-01,2024-04-15,Project milestone 1";
    const row2 = "Acme Corp,billing@acme.com,9876543210,\"123 Industrial Area, Mumbai\",Cloud Hosting,1,2500,igst,18,2024-04-01,2024-04-15,Monthly subscription";
    const row3 = "Design Studio,hello@design.in,9988776655,\"45 Creative Hub, Bangalore\",Logo Design,1,15000,none,0,2024-04-05,2024-04-20,Final delivery";
    
    const csvContent = [headers, row1, row2, row3].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "invoice_bulk_upload_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-10">
      {/* Header Section */}
      <motion.div
        className="relative pt-8 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -top-10 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link 
              to="/invoices" 
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Back to Invoices
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
                Bulk <span className="text-primary italic font-serif font-medium">Ingestion</span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Scale your billing operations by importing multiple invoices via CSV. 
                Our system automatically groups line items by client.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSampleCSV}
              className="rounded-full px-4 border-primary/20 hover:bg-primary/5 text-primary"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Instructions */}
        <div className="lg:col-span-5 space-y-8">
          {/* Upload Card */}
          <motion.div
            className="bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-primary/5 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-lg">Upload CSV</h2>
              </div>

              <div
                className={cn(
                  "relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300",
                  fileName 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFile}
                />
                
                <div className="space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative flex items-center justify-center w-full h-full bg-background border border-border rounded-2xl shadow-sm">
                      <FileSpreadsheet className={cn(
                        "h-8 w-8 transition-colors",
                        fileName ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </div>

                  <div>
                    {fileName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px] mx-auto">
                          {fileName}
                        </p>
                        <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                          File Ready for Processing
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
                        <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-3 text-destructive text-xs bg-destructive/5 border border-destructive/10 rounded-2xl p-4"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Format Guide */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 px-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Format Specifications</h3>
            </div>

            <div className="bg-muted/30 rounded-[2rem] p-6 border border-border/50 space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground/80">Required Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Client", "Item", "Qty", "Price", "Date"].map(col => (
                    <span key={col} className="px-2 py-1 bg-background border border-border rounded-md text-[10px] font-mono text-foreground">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground/80">GST Types Supported</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "none", label: "No Tax" },
                    { id: "cgst_sgst", label: "CGST + SGST" },
                    { id: "igst", label: "IGST" },
                    { id: "utgst", label: "UTGST" }
                  ].map(type => (
                    <div key={type.id} className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-xl border border-border/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span className="text-[10px] font-medium">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Preview & Sample */}
        <div className="lg:col-span-7 space-y-8">
          <AnimatePresence mode="wait">
            {parsed.length > 0 ? (
              <motion.div
                key="preview"
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold">{parsed.length} Invoices Detected</h2>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ready for import</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateAll}
                    disabled={saving}
                    className="rounded-full px-6 shadow-lg shadow-primary/20"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Import All
                  </Button>
                </div>

                <div className="space-y-4">
                  {parsed.map((inv, idx) => {
                    const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
                    const totalGst = inv.items.reduce((s, i) => (s + (i.quantity * i.price * i.gst_rate) / 100), 0);
                    const clientExists = clients.some((c) => c.name.toLowerCase() === inv.client_name.toLowerCase());

                    return (
                      <motion.div 
                        key={idx} 
                        className="group bg-card rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-lg">{inv.client_name}</h3>
                                {!clientExists && (
                                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded-full border border-amber-500/20">
                                    New Client
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">
                                {inv.issue_date} • {inv.items.length} Line Items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-display font-bold tabular-nums">
                                {formatCurrency(subtotal + totalGst)}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                Total Amount
                              </p>
                            </div>
                          </div>

                          <div className="bg-muted/20 rounded-2xl border border-border/30 overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/40 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              <span className="col-span-6">Description</span>
                              <span className="col-span-2 text-right">Qty</span>
                              <span className="col-span-4 text-right">Amount</span>
                            </div>
                            <div className="divide-y divide-border/20">
                              {inv.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] items-center">
                                  <div className="col-span-6">
                                    <p className="font-medium text-foreground truncate">{item.name}</p>
                                    {item.gst_type !== "none" && (
                                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                        {item.gst_type.replace("_", " + ")} @ {item.gst_rate}%
                                      </p>
                                    )}
                                  </div>
                                  <span className="col-span-2 text-right tabular-nums text-muted-foreground">
                                    {item.quantity}
                                  </span>
                                  <span className="col-span-4 text-right tabular-nums font-semibold">
                                    {formatCurrency(item.quantity * item.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sample"
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TableIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold">Sample Structure</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">How to prepare your data</p>
                  </div>
                </div>

                <div className="bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
                  <div className="p-1 bg-muted/30 border-b border-border/50 flex items-center gap-1.5 px-4 h-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/20" />
                    <span className="ml-2 text-[10px] font-mono text-muted-foreground">sample_invoices.csv</span>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/50">
                          {["Client", "Item", "Qty", "Price", "GST Type", "Date"].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {[
                          ["Acme Corp", "Web Dev", "1", "50000", "cgst_sgst", "2024-04-01"],
                          ["Acme Corp", "Hosting", "1", "2500", "igst", "2024-04-01"],
                          ["Design Studio", "Logo", "1", "15000", "none", "2024-04-05"],
                          ["Global Tech", "Consulting", "10", "2000", "igst", "2024-04-10"]
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-3 whitespace-nowrap font-medium text-foreground/80">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-muted/10 border-t border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-3 w-3 text-primary" />
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        <strong className="text-foreground">Pro Tip:</strong> Rows with the same <code className="text-primary font-bold">Client</code> and <code className="text-primary font-bold">Date</code> will be automatically merged into a single invoice with multiple line items.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Empty State Illustration */}
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-40">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                    <FileSpreadsheet className="h-20 w-20 text-muted-foreground relative" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display font-medium">No File Uploaded</p>
                    <p className="text-xs">Your data preview will appear here</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
