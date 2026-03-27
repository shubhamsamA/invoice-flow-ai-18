import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save, Loader2, LayoutTemplate, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BuilderElement, DEFAULT_SIZES, DEFAULT_CONTENT } from "@/types/builder";

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

const builtinTemplateOptions: { id: string; name: string; elements: BuilderElement[] }[] = [
  {
    id: "minimal",
    name: "Minimal",
    elements: [
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
  },
  {
    id: "corporate",
    name: "Corporate",
    elements: [
      {
        id: crypto.randomUUID(),
        type: "logo",
        x: 32,
        y: 32,
        ...DEFAULT_SIZES["logo"],
        content: DEFAULT_CONTENT["logo"],
      },
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
  },
  {
    id: "freelance",
    name: "Modern Freelance",
    elements: [
      { id: crypto.randomUUID(), type: "divider", x: 32, y: 16, width: 576, height: 16, content: { style: "solid" } },
      {
        id: crypto.randomUUID(),
        type: "logo",
        x: 32,
        y: 48,
        ...DEFAULT_SIZES["logo"],
        content: DEFAULT_CONTENT["logo"],
      },
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
  },
  {
    id: "gst",
    name: "Indian GST",
    elements: [
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
  },
];

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ["custom-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, layout_json")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Load existing invoice
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-edit", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase.from("invoices").select("*").eq("id", id!).single();
      if (error) throw error;
      const { data: invItems } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id!)
        .order("sort_order");
      return { ...inv, items: invItems || [] };
    },
    enabled: !!user && !!id,
  });

  // Pre-fill form when invoice loads
  useEffect(() => {
    if (invoice && !loaded) {
      setInvoiceNumber(invoice.invoice_number);
      setClientId(invoice.client_id || "");
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || "");
      setGstRate(Number(invoice.gst_rate));
      setNotes(invoice.notes || "");
      // Reverse-calculate discount percentage from saved discount amount & subtotal
      const sub = Number(invoice.subtotal);
      const disc = Number(invoice.discount);
      setDiscount(sub > 0 ? Math.round((disc / sub) * 100 * 100) / 100 : 0);
      setItems(
        invoice.items.length > 0
          ? invoice.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              quantity: Number(i.quantity),
              price: Number(i.unit_price),
            }))
          : [emptyItem()],
      );
      // Detect template from layout_json
      if (invoice.layout_json && Array.isArray(invoice.layout_json)) {
        // Check if it matches a builtin by element count (simple heuristic)
        const match = builtinTemplateOptions.find((t) => t.elements.length === (invoice.layout_json as any[]).length);
        // For custom templates, check DB
        if (!match) {
          const custom = customTemplates.find(
            (t: any) => Array.isArray(t.layout_json) && t.layout_json.length === (invoice.layout_json as any[]).length,
          );
          if (custom) setSelectedTemplate(custom.id);
        }
      }
      setLoaded(true);
    }
  }, [invoice, loaded, customTemplates]);

  const getSelectedLayoutJson = (): any[] | null => {
    if (!selectedTemplate) return null;
    const builtin = builtinTemplateOptions.find((t) => t.id === selectedTemplate);
    if (builtin) return builtin.elements;
    const custom = customTemplates.find((t: any) => t.id === selectedTemplate);
    if (custom) return custom.layout_json as any[];
    return null;
  };

  const getSelectedTemplateName = (): string | null => {
    if (!selectedTemplate) return null;
    return (
      builtinTemplateOptions.find((t) => t.id === selectedTemplate)?.name ||
      customTemplates.find((t: any) => t.id === selectedTemplate)?.name ||
      null
    );
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (iid: string) => setItems(items.filter((i) => i.id !== iid));
  const updateItem = (iid: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((i) => (i.id === iid ? { ...i, [field]: value } : i)));
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
      const layoutJson = getSelectedLayoutJson();
      const { error: invError } = await supabase
        .from("invoices")
        .update({
          client_id: clientId || null,
          issue_date: issueDate,
          due_date: dueDate || null,
          subtotal,
          discount: discountAmount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total,
          layout_json: layoutJson,
          notes: notes || null,
        })
        .eq("id", id!);
      if (invError) throw invError;

      // Delete old items and insert new
      await supabase.from("invoice_items").delete().eq("invoice_id", id!);
      const itemRows = items
        .filter((i) => i.name.trim())
        .map((item, idx) => ({
          invoice_id: id!,
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
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice updated");
      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Edit {invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">Update invoice details</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Template Selection */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Template</h2>
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    {selectedTemplate ? "Change Template" : "Choose Template"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select a Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 mt-3 max-h-[400px] overflow-y-auto">
                    <button
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${!selectedTemplate ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`}
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateDialogOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">No Template</span>
                        {!selectedTemplate && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-2 px-1">
                      Prebuilt
                    </p>
                    {builtinTemplateOptions.map((t) => (
                      <button
                        key={t.id}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${selectedTemplate === t.id ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`}
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setTemplateDialogOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{t.name}</span>
                          {selectedTemplate === t.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </button>
                    ))}
                    {customTemplates.length > 0 && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-2 px-1">
                        Your Templates
                      </p>
                    )}
                    {customTemplates.map((t: any) => (
                      <button
                        key={t.id}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${selectedTemplate === t.id ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`}
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setTemplateDialogOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{t.name}</span>
                          {selectedTemplate === t.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {selectedTemplate && (
              <div className="flex items-center gap-2 bg-primary/5 text-primary rounded-lg px-3 py-2 text-xs font-medium">
                <LayoutTemplate className="h-3.5 w-3.5" /> Using: {getSelectedTemplateName()}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice Number</Label>
                <Input value={invoiceNumber} readOnly className="bg-muted/50" />
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
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                  <Input
                    className="col-span-5"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                  <Input
                    className="col-span-2 tabular-nums"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                  />
                  <Input
                    className="col-span-3 tabular-nums"
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                  />
                  <p className="col-span-1 text-right text-sm font-medium tabular-nums">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold">Tax, Discount & Notes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">GST Rate (%)</Label>
                <Input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount (%)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Payment terms, thank you message, bank details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
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
                  <span className="font-medium text-[hsl(var(--success))] tabular-nums">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2.5 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                className="w-full gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Invoice
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
