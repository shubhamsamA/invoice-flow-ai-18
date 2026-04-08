import { useState, useEffect, useMemo, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save, Loader2, LayoutTemplate, Check, ChevronDown, ChevronUp, Eye, FileText, Download, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BuilderElement, DEFAULT_SIZES, DEFAULT_CONTENT } from "@/types/builder";
import { generateInvoicePreviewHTML } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";
import ClientSelector, { type ClientMode, type InlineClientDetails, emptyInline } from "@/components/ClientSelector";

interface InvoiceItem {
  id: string;
  sl_no: number;
  name: string;
  description: string;
  hsn_sac: string;
  quantity: number;
  price: number;
  gst_type: string;
  gst_rate: number;
}

const GST_TYPES = [
  { value: "none", label: "No GST" },
  { value: "cgst_sgst", label: "CGST + SGST" },
  { value: "igst", label: "IGST" },
  { value: "cgst_utgst", label: "CGST + UTGST" },
];

let editSlNoCounter = 1;
const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  sl_no: editSlNoCounter++,
  name: "",
  description: "",
  hsn_sac: "",
  quantity: 1,
  price: 0,
  gst_type: "none",
  gst_rate: 0,
});

function computeItemGST(item: InvoiceItem) {
  const base = item.quantity * item.price;
  if (item.gst_type === "none" || item.gst_rate <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, utgst: 0, total: 0 };
  }
  const tax = (base * item.gst_rate) / 100;
  if (item.gst_type === "cgst_sgst") return { cgst: tax / 2, sgst: tax / 2, igst: 0, utgst: 0, total: tax };
  if (item.gst_type === "igst") return { cgst: 0, sgst: 0, igst: tax, utgst: 0, total: tax };
  if (item.gst_type === "cgst_utgst") return { cgst: tax / 2, sgst: 0, igst: 0, utgst: tax / 2, total: tax };
  return { cgst: 0, sgst: 0, igst: 0, utgst: 0, total: 0 };
}

const builtinTemplateOptions: { id: string; name: string; elements: BuilderElement[] }[] = [
  {
    id: "minimal", name: "Minimal",
    elements: [
      { id: crypto.randomUUID(), type: "text", x: 32, y: 32, width: 320, height: 48, content: { text: "INVOICE", fontSize: 24, bold: true } },
      { id: crypto.randomUUID(), type: "client-details", x: 32, y: 96, ...DEFAULT_SIZES["client-details"], content: DEFAULT_CONTENT["client-details"] },
      { id: crypto.randomUUID(), type: "divider", x: 32, y: 256, ...DEFAULT_SIZES["divider"], content: DEFAULT_CONTENT["divider"] },
      { id: crypto.randomUUID(), type: "items-table", x: 32, y: 288, ...DEFAULT_SIZES["items-table"], content: DEFAULT_CONTENT["items-table"] },
      { id: crypto.randomUUID(), type: "total-summary", x: 320, y: 528, ...DEFAULT_SIZES["total-summary"], content: DEFAULT_CONTENT["total-summary"] },
      { id: crypto.randomUUID(), type: "signature", x: 32, y: 736, ...DEFAULT_SIZES["signature"], content: DEFAULT_CONTENT["signature"] },
    ],
  },
  {
    id: "corporate", name: "Corporate",
    elements: [
      { id: crypto.randomUUID(), type: "logo", x: 32, y: 32, ...DEFAULT_SIZES["logo"], content: DEFAULT_CONTENT["logo"] },
      { id: crypto.randomUUID(), type: "text", x: 208, y: 48, width: 400, height: 48, content: { text: "CORPORATE INVOICE", fontSize: 22, bold: true } },
      { id: crypto.randomUUID(), type: "client-details", x: 32, y: 128, ...DEFAULT_SIZES["client-details"], content: DEFAULT_CONTENT["client-details"] },
      { id: crypto.randomUUID(), type: "items-table", x: 32, y: 288, width: 576, height: 256, content: DEFAULT_CONTENT["items-table"] },
      { id: crypto.randomUUID(), type: "total-summary", x: 320, y: 560, ...DEFAULT_SIZES["total-summary"], content: DEFAULT_CONTENT["total-summary"] },
      { id: crypto.randomUUID(), type: "signature", x: 32, y: 768, ...DEFAULT_SIZES["signature"], content: DEFAULT_CONTENT["signature"] },
    ],
  },
  {
    id: "freelance", name: "Modern Freelance",
    elements: [
      { id: crypto.randomUUID(), type: "divider", x: 32, y: 16, width: 576, height: 16, content: { style: "solid" } },
      { id: crypto.randomUUID(), type: "logo", x: 32, y: 48, ...DEFAULT_SIZES["logo"], content: DEFAULT_CONTENT["logo"] },
      { id: crypto.randomUUID(), type: "text", x: 32, y: 144, width: 400, height: 48, content: { text: "Invoice", fontSize: 28, bold: true } },
      { id: crypto.randomUUID(), type: "client-details", x: 32, y: 208, ...DEFAULT_SIZES["client-details"], content: DEFAULT_CONTENT["client-details"] },
      { id: crypto.randomUUID(), type: "items-table", x: 32, y: 368, ...DEFAULT_SIZES["items-table"], content: DEFAULT_CONTENT["items-table"] },
      { id: crypto.randomUUID(), type: "total-summary", x: 320, y: 608, ...DEFAULT_SIZES["total-summary"], content: DEFAULT_CONTENT["total-summary"] },
    ],
  },
  {
    id: "gst", name: "Indian GST",
    elements: [
      { id: crypto.randomUUID(), type: "text", x: 160, y: 32, width: 320, height: 48, content: { text: "TAX INVOICE", fontSize: 22, bold: true } },
      { id: crypto.randomUUID(), type: "logo", x: 32, y: 32, width: 112, height: 64, content: DEFAULT_CONTENT["logo"] },
      { id: crypto.randomUUID(), type: "client-details", x: 32, y: 112, ...DEFAULT_SIZES["client-details"], content: { ...DEFAULT_CONTENT["client-details"], gst: "07AABCU9603R1ZM" } },
      { id: crypto.randomUUID(), type: "divider", x: 32, y: 272, width: 576, height: 16, content: DEFAULT_CONTENT["divider"] },
      { id: crypto.randomUUID(), type: "items-table", x: 32, y: 304, width: 576, height: 256, content: { items: [{ name: "Service (HSN 998311)", qty: 1, price: 10000 }] } },
      { id: crypto.randomUUID(), type: "total-summary", x: 320, y: 576, ...DEFAULT_SIZES["total-summary"], content: { subtotal: 10000, gst: 18, discount: 0 } },
      { id: crypto.randomUUID(), type: "signature", x: 32, y: 768, ...DEFAULT_SIZES["signature"], content: DEFAULT_CONTENT["signature"] },
    ],
  },
];

function SortableEditRow({ item, gridTemplate, children }: { item: InvoiceItem; gridTemplate: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={{ ...style, gridTemplateColumns: gridTemplate }} className="grid gap-1 items-center">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1 flex justify-center">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [clientId, setClientId] = useState("");
  const [clientMode, setClientMode] = useState<ClientMode>("select");
  const [inlineClientDetails, setInlineClientDetails] = useState<InlineClientDetails>({ ...emptyInline });
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [overallGstEnabled, setOverallGstEnabled] = useState(false);
  const [overallGstRate, setOverallGstRate] = useState(18);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [customColumns, setCustomColumns] = useState<{ key: string; label: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // DnD sensors & handler
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

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
      const { data, error } = await supabase.from("templates").select("id, name, layout_json").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-edit", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase.from("invoices").select("*").eq("id", id!).single();
      if (error) throw error;
      const { data: invItems } = await supabase.from("invoice_items").select("*").eq("invoice_id", id!).order("sort_order");
      return { ...inv, items: invItems || [] };
    },
    enabled: !!user && !!id,
  });

  useEffect(() => {
    if (invoice && !loaded) {
      setInvoiceNumber(invoice.invoice_number);
      setClientId(invoice.client_id || "");
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      const sub = Number(invoice.subtotal);
      const disc = Number(invoice.discount);
      setDiscount(sub > 0 ? Math.round((disc / sub) * 100 * 100) / 100 : 0);
      setItems(
        invoice.items.length > 0
          ? invoice.items.map((i: any, idx: number) => ({
              id: i.id,
              sl_no: i.sort_order != null ? i.sort_order + 1 : idx + 1,
              name: i.name,
              description: i.description || "",
              hsn_sac: i.hsn_sac || "",
              quantity: Number(i.quantity),
              price: Number(i.unit_price),
              gst_type: "none",
              gst_rate: 0,
            }))
          : [emptyItem()],
      );
      // If invoice had a uniform GST rate, enable overall GST
      if (Number(invoice.gst_rate) > 0) {
        setOverallGstEnabled(true);
        setOverallGstRate(Number(invoice.gst_rate));
      }
      if (invoice.layout_json && Array.isArray(invoice.layout_json)) {
        const match = builtinTemplateOptions.find((t) => t.elements.length === (invoice.layout_json as any[]).length);
        if (!match) {
          const custom = customTemplates.find((t: any) => Array.isArray(t.layout_json) && t.layout_json.length === (invoice.layout_json as any[]).length);
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
    return builtinTemplateOptions.find((t) => t.id === selectedTemplate)?.name || customTemplates.find((t: any) => t.id === selectedTemplate)?.name || null;
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (iid: string) => setItems(items.filter((i) => i.id !== iid));
  const updateItem = (iid: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((i) => (i.id === iid ? { ...i, [field]: value } : i)));
  };

  const gstBreakdown = useMemo(() => {
    let totalCgst = 0, totalSgst = 0, totalIgst = 0, totalUtgst = 0, totalGst = 0;
    if (overallGstEnabled) {
      const sub = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const tax = (sub * overallGstRate) / 100;
      totalCgst = tax / 2; totalSgst = tax / 2; totalGst = tax;
    } else {
      items.forEach((item) => {
        const g = computeItemGST(item);
        totalCgst += g.cgst; totalSgst += g.sgst; totalIgst += g.igst; totalUtgst += g.utgst; totalGst += g.total;
      });
    }
    return { cgst: totalCgst, sgst: totalSgst, igst: totalIgst, utgst: totalUtgst, total: totalGst };
  }, [items, overallGstEnabled, overallGstRate]);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const gstAmount = gstBreakdown.total;
  const gstRate = subtotal > 0 ? (gstAmount / subtotal) * 100 : 0;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + gstAmount - discountAmount;
  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const selectedClient = clients.find((c: any) => c.id === clientId);
  const resolvedClientName = clientMode === "inline" ? inlineClientDetails.name : (selectedClient?.name || "");
  const resolvedClientEmail = clientMode === "inline" ? inlineClientDetails.email : "";
  const resolvedClientAddress = clientMode === "inline" ? inlineClientDetails.address : "";

  const previewHTML = useMemo(() => {
    const layoutJson = getSelectedLayoutJson();
    const previewData = {
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate || null,
      status: "unpaid" as const,
      subtotal,
      discount: discountAmount,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      currency: "INR",
      notes: notes || null,
      client_name: resolvedClientName,
      client_email: resolvedClientEmail,
      client_address: resolvedClientAddress,
      items: items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.price,
          amount: i.quantity * i.price,
          gst_type: i.gst_type,
          gst_rate: i.gst_rate,
        })),
      layout_json: layoutJson,
    };
    return generateInvoicePreviewHTML(previewData);
  }, [invoiceNumber, issueDate, dueDate, subtotal, discountAmount, gstRate, gstAmount, total, notes, items, selectedTemplate, clientId, clients, clientMode, inlineClientDetails]);

  const handleSave = async () => {
    if (!items.some((i) => i.name.trim())) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      const layoutJson = getSelectedLayoutJson();
      const { error: invError } = await supabase
        .from("invoices")
        .update({ client_id: clientMode === "select" && clientId ? clientId : null, issue_date: issueDate, due_date: dueDate || null, subtotal, discount: discountAmount, gst_rate: gstRate, gst_amount: gstAmount, total, layout_json: layoutJson, notes: notes || null, inline_client_json: clientMode === "inline" ? inlineClientDetails : null })
        .eq("id", id!);
      if (invError) throw invError;
      await supabase.from("invoice_items").delete().eq("invoice_id", id!);
      const itemRows = items.filter((i) => i.name.trim()).map((item, idx) => ({
        invoice_id: id!, name: item.name, description: item.description || null, quantity: item.quantity, unit_price: item.price, amount: item.quantity * item.price, sort_order: idx,
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
    } catch (err) { console.error(err); toast.error("Failed to update invoice"); }
    finally { setSaving(false); }
  };

  const addCustomColumn = () => setCustomColumns([...customColumns, { key: `custom_${Date.now()}`, label: "Custom" }]);
  const removeCustomColumn = (key: string) => setCustomColumns(customColumns.filter((c) => c.key !== key));

  const GstSummary = () => (
    <div className="space-y-1.5">
      {gstBreakdown.cgst > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">CGST</span><span className="tabular-nums">+{formatCurrency(gstBreakdown.cgst)}</span></div>}
      {gstBreakdown.sgst > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">SGST</span><span className="tabular-nums">+{formatCurrency(gstBreakdown.sgst)}</span></div>}
      {gstBreakdown.igst > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">IGST</span><span className="tabular-nums">+{formatCurrency(gstBreakdown.igst)}</span></div>}
      {gstBreakdown.utgst > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">UTGST</span><span className="tabular-nums">+{formatCurrency(gstBreakdown.utgst)}</span></div>}
      {gstAmount > 0 && <div className="flex justify-between text-xs font-medium border-t border-dashed pt-1"><span className="text-muted-foreground">Total GST</span><span className="tabular-nums">+{formatCurrency(gstAmount)}</span></div>}
    </div>
  );

  const ItemGstDetail = () => {
    const taxedItems = items.filter((i) => i.name.trim() && i.gst_type !== "none" && i.gst_rate > 0);
    if (taxedItems.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Per-Item Tax Detail</p>
        {taxedItems.map((item) => {
          const g = computeItemGST(item);
          return (
            <div key={item.id} className="text-xs pl-2 border-l-2 border-muted py-0.5">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-1">({GST_TYPES.find((t) => t.value === item.gst_type)?.label} @ {item.gst_rate}%)</span>
              <div className="flex gap-3 text-muted-foreground">
                {g.cgst > 0 && <span>CGST: {formatCurrency(g.cgst)}</span>}
                {g.sgst > 0 && <span>SGST: {formatCurrency(g.sgst)}</span>}
                {g.igst > 0 && <span>IGST: {formatCurrency(g.igst)}</span>}
                {g.utgst > 0 && <span>UTGST: {formatCurrency(g.utgst)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border" asChild><Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit {invoiceNumber}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span className="bg-muted px-2 py-0.5 rounded uppercase">{invoiceNumber}</span>
              <span>•</span>
              <span>{showPreview ? "Preview Mode" : "Draft Mode"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 font-medium transition-all duration-300",
              showPreview ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "bg-card border-border"
            )}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Back to Form" : "Live Preview"}
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update Invoice
          </Button>
        </div>
      </motion.div>

      {showPreview ? (
        <motion.div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Live Preview</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(previewHTML);
                    printWindow.document.close();
                    printWindow.onload = () => { printWindow.print(); };
                  }
                }}
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/40" />
                <div className="w-2 h-2 rounded-full bg-warning/40" />
                <div className="w-2 h-2 rounded-full bg-success/40" />
              </div>
            </div>
          </div>
          <div className="bg-white">
            <iframe srcDoc={previewHTML} className="w-full border-none" style={{ minHeight: "calc(100vh - 180px)" }} title="Invoice Preview" />
          </div>
        </motion.div>
      ) : (

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          {/* Template Selection */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Template</h2>
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><LayoutTemplate className="h-3.5 w-3.5" />{selectedTemplate ? "Change Template" : "Choose Template"}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Select a Template</DialogTitle></DialogHeader>
                  <div className="space-y-2 mt-3 max-h-[400px] overflow-y-auto">
                    <button className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${!selectedTemplate ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`} onClick={() => { setSelectedTemplate(null); setTemplateDialogOpen(false); }}>
                      <div className="flex items-center justify-between"><span className="font-medium">No Template</span>{!selectedTemplate && <Check className="h-4 w-4 text-primary" />}</div>
                    </button>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-2 px-1">Prebuilt</p>
                    {builtinTemplateOptions.map((t) => (
                      <button key={t.id} className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${selectedTemplate === t.id ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`} onClick={() => { setSelectedTemplate(t.id); setTemplateDialogOpen(false); }}>
                        <div className="flex items-center justify-between"><span className="font-medium">{t.name}</span>{selectedTemplate === t.id && <Check className="h-4 w-4 text-primary" />}</div>
                      </button>
                    ))}
                    {customTemplates.length > 0 && <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-2 px-1">Your Templates</p>}
                    {customTemplates.map((t: any) => (
                      <button key={t.id} className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${selectedTemplate === t.id ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-muted/50"}`} onClick={() => { setSelectedTemplate(t.id); setTemplateDialogOpen(false); }}>
                        <div className="flex items-center justify-between"><span className="font-medium">{t.name}</span>{selectedTemplate === t.id && <Check className="h-4 w-4 text-primary" />}</div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {selectedTemplate && <div className="flex items-center gap-2 bg-primary/5 text-primary rounded-lg px-3 py-2 text-xs font-medium"><LayoutTemplate className="h-3.5 w-3.5" /> Using: {getSelectedTemplateName()}</div>}
          </div>

          {/* Invoice Details */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Client</Label>
                <ClientSelector
                  clients={clients}
                  clientId={clientId}
                  onClientIdChange={setClientId}
                  inlineDetails={inlineClientDetails}
                  onInlineDetailsChange={setInlineClientDetails}
                  clientMode={clientMode}
                  onClientModeChange={(mode) => { setClientMode(mode); if (mode !== "select") setClientId(""); }}
                />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Invoice Number</Label><Input value={invoiceNumber} readOnly className="bg-muted/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Line Items</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setShowTableSettings(!showTableSettings)}>
                  {showTableSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Table Settings
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addItem}><Plus className="h-3.5 w-3.5" /> Add Row</Button>
              </div>
            </div>

            {showTableSettings && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-dashed">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Custom Columns</p>
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addCustomColumn}><Plus className="h-3 w-3" /> Add Column</Button>
                </div>
                {customColumns.length === 0 && <p className="text-xs text-muted-foreground">No custom columns. Click "Add Column" to extend the table.</p>}
                {customColumns.map((col) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Input className="h-8 text-xs flex-1" value={col.label} onChange={(e) => setCustomColumns(customColumns.map((c) => c.key === col.key ? { ...c, label: e.target.value } : c))} placeholder="Column name" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCustomColumn(col.key)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 overflow-x-auto">
              <div className="grid gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1" style={{ gridTemplateColumns: `24px 0.4fr 2fr 1fr 0.7fr 1fr 1.5fr 0.7fr 1fr ${customColumns.map(() => '1fr').join(' ')} 1.2fr auto` }}>
                <div></div><div>Sl.No</div><div>Description</div><div>HSN/SAC</div><div>Qty</div><div>Price</div><div>GST Type</div><div>GST%</div><div>GST Amt</div>
                {customColumns.map((col) => <div key={col.key}>{col.label}</div>)}
                <div className="text-right">Total</div><div></div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => {
                const itemGst = overallGstEnabled ? (item.quantity * item.price * overallGstRate) / 100 : computeItemGST(item).total;
                const gridTemplate = `24px 0.4fr 2fr 1fr 0.7fr 1fr 1.5fr 0.7fr 1fr ${customColumns.map(() => '1fr').join(' ')} 1.2fr auto`;
                return (
                  <SortableEditRow key={item.id} item={item} gridTemplate={gridTemplate}>
                    <Input type="number" min={1} value={item.sl_no} onChange={(e) => updateItem(item.id, "sl_no", parseInt(e.target.value) || 1)} className="w-14 text-center text-xs font-mono tabular-nums" />
                    <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} />
                    <Input placeholder="HSN/SAC" value={item.hsn_sac} onChange={(e) => updateItem(item.id, "hsn_sac", e.target.value)} className="text-xs font-mono" />
                    <Input className="tabular-nums" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} />
                    <Input className="tabular-nums" type="number" min={0} value={item.price} onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)} />
                    <Select value={overallGstEnabled ? "overall" : item.gst_type} onValueChange={(v) => { if (!overallGstEnabled) setItems(items.map((i) => i.id === item.id ? { ...i, gst_type: v, gst_rate: v === "none" ? 0 : i.gst_rate || 18 } : i)); }} disabled={overallGstEnabled}>
                      <SelectTrigger className="text-xs h-9"><SelectValue>{overallGstEnabled ? "Overall" : GST_TYPES.find((t) => t.value === item.gst_type)?.label}</SelectValue></SelectTrigger>
                      <SelectContent>{GST_TYPES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="tabular-nums" type="number" min={0} value={overallGstEnabled ? overallGstRate : item.gst_rate} onChange={(e) => { if (!overallGstEnabled) updateItem(item.id, "gst_rate", parseFloat(e.target.value) || 0); }} disabled={overallGstEnabled || item.gst_type === "none"} />
                    <div className="text-right text-xs font-mono text-muted-foreground">{formatCurrency(itemGst)}</div>
                    {customColumns.map((col) => <Input key={col.key} className="text-xs" placeholder={col.label} />)}
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(item.quantity * item.price + itemGst)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} disabled={items.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </SortableEditRow>
                );
              })}
              </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Tax, Discount & Notes */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold">Tax, Discount & Notes</h2>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 border border-dashed">
              <div><p className="text-xs font-medium">Overall GST</p><p className="text-[10px] text-muted-foreground">Apply a single GST rate to entire invoice (overrides per-item)</p></div>
              <div className="flex items-center gap-3">
                {overallGstEnabled && (
                  <div className="flex items-center gap-1">
                    <Input type="number" className="w-16 h-8 text-xs tabular-nums" value={overallGstRate} onChange={(e) => setOverallGstRate(parseFloat(e.target.value) || 0)} min={0} />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                )}
                <Switch checked={overallGstEnabled} onCheckedChange={setOverallGstEnabled} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs">Discount (%)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="tabular-nums" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea placeholder="Payment terms, thank you message..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div className="space-y-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4 sticky top-6">
            <h2 className="text-sm font-semibold">Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span></div>
              <GstSummary />
              {!overallGstEnabled && <ItemGstDetail />}
              {discount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Discount ({discount}%)</span><span className="font-medium text-[hsl(var(--success))] tabular-nums">-{formatCurrency(discountAmount)}</span></div>
              )}
              <div className="border-t pt-2.5 flex justify-between"><span className="font-semibold">Total</span><span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span></div>
            </div>
            <div className="space-y-2 pt-2">
              <Button className="w-full gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update Invoice
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </div>
  );
}
