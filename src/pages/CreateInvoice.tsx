import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  name: "",
  quantity: 1,
  price: 0,
});

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate next invoice number
  const { data: nextNumber = "INV-001" } = useQuery({
    queryKey: ["next-invoice-number"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const match = data[0].invoice_number.match(/(\d+)$/);
        if (match) return `INV-${String(Number(match[1]) + 1).padStart(3, "0")}`;
      }
      return "INV-001";
    },
    enabled: !!user,
  });

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + gstAmount - discountAmount;

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const handleSave = async () => {
    if (!items.some((i) => i.name.trim())) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          user_id: user!.id,
          client_id: clientId || null,
          invoice_number: nextNumber,
          issue_date: issueDate,
          due_date: dueDate || null,
          subtotal: subtotal,
          discount: discountAmount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total: total,
        })
        .select("id")
        .single();
      if (invError) throw invError;

      // Create invoice items
      const itemRows = items
        .filter((i) => i.name.trim())
        .map((item, idx) => ({
          invoice_id: invoice.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          amount: item.quantity * item.price,
          sort_order: idx,
        }));

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
        if (itemsError) throw itemsError;
      }

      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice saved");
      navigate("/invoices");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <p className="text-sm text-muted-foreground">Fill in the details below</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice Number</Label>
                <Input value={nextNumber} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Line Items</h2>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Price</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 items-center"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Input className="col-span-5" placeholder="Item name" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} />
                  <Input className="col-span-2 tabular-nums" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} />
                  <Input className="col-span-3 tabular-nums" type="number" min={0} value={item.price} onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)} />
                  <p className="col-span-1 text-right text-sm font-medium tabular-nums">{formatCurrency(item.quantity * item.price)}</p>
                  <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-4">Tax & Discount</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">GST Rate (%)</Label>
                <Input type="number" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)} className="tabular-nums" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount (%)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="tabular-nums" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold">Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({gstRate}%)</span>
                <span className="font-medium tabular-nums">+{formatCurrency(gstAmount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount ({discount}%)</span>
                  <span className="font-medium text-[hsl(var(--success))] tabular-nums">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2.5 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button className="w-full gap-2 shadow-sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Invoice
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
