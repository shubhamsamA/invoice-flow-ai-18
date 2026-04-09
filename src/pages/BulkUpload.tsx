import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
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
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create invoices: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Bulk Upload Invoices</h1>
          <p className="text-sm text-muted-foreground">Upload a CSV file to create multiple invoices at once</p>
        </div>
      </motion.div>

      <motion.div
        className="bg-card rounded-xl border shadow-sm p-6 space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-semibold">Upload File</h2>
        <p className="text-xs text-muted-foreground">
          CSV format with columns: <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">Client, Client Email, Client Phone, Client Address, Item, Qty, Price, GST Type, GST Rate, Date, Due Date, Notes</code>
        </p>
        <p className="text-xs text-muted-foreground">
          GST Type can be: <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">none, cgst_sgst, igst, utgst</code>. Multiple items per client are grouped into one invoice.
        </p>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFile}
          />
          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          {fileName ? (
            <p className="text-sm font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </motion.div>

      {parsed.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{parsed.length} Invoice(s) Ready</h2>
            <Button
              onClick={handleCreateAll}
              disabled={saving}
              className="gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Create All Invoices
            </Button>
          </div>

          {parsed.map((inv, idx) => {
            const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
            const totalGst = inv.items.reduce((s, i) => (s + (i.quantity * i.price * i.gst_rate) / 100), 0);
            const clientExists = clients.some((c) => c.name.toLowerCase() === inv.client_name.toLowerCase());

            return (
              <div key={idx} className="bg-card rounded-xl border shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{inv.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.items.length} item(s) · {inv.issue_date}
                      {!clientExists && (
                        <span className="ml-2 text-amber-600">(Client not in database)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(subtotal + totalGst)}</p>
                    {totalGst > 0 && <p className="text-[10px] text-muted-foreground">incl. GST {formatCurrency(totalGst)}</p>}
                  </div>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 gap-px bg-muted text-[10px] uppercase tracking-wider font-medium px-3 py-1.5">
                    <span className="col-span-4">Item</span>
                    <span className="col-span-1 text-right">Qty</span>
                    <span className="col-span-2 text-right">Price</span>
                    <span className="col-span-3 text-center">GST</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {inv.items.map((item, i) => {
                    const itemGst = (item.quantity * item.price * item.gst_rate) / 100;
                    return (
                      <div key={i} className="grid grid-cols-12 gap-px px-3 py-1.5 border-t text-[11px]">
                        <span className="col-span-4 truncate">{item.name}</span>
                        <span className="col-span-1 text-right tabular-nums">{item.quantity}</span>
                        <span className="col-span-2 text-right tabular-nums">{formatCurrency(item.price)}</span>
                        <span className="col-span-3 text-center text-muted-foreground">
                          {item.gst_type !== "none" ? `${item.gst_type.toUpperCase()} ${item.gst_rate}%` : "—"}
                        </span>
                        <span className="col-span-2 text-right tabular-nums font-medium">
                          {formatCurrency(item.quantity * item.price + itemGst)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
