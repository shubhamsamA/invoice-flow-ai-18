import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  ArrowLeft, Plus, Trash2, Save, Loader2, LayoutTemplate, 
  Check, Eye, ChevronDown, ChevronUp, 
  FileText, User, Calendar, CreditCard, Receipt, 
  Settings2, Info, Sparkles, Download, GripVertical
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

let slNoCounter = 1;
const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  sl_no: slNoCounter++,
  name: "",
  description: "",
  hsn_sac: "",
  quantity: 1,
  price: 0,
  gst_type: "none",
  gst_rate: 0,
});

/** Compute GST breakdown for an item */
function computeItemGST(item: InvoiceItem) {
  const base = item.quantity * item.price;
  if (item.gst_type === "none" || item.gst_rate <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, utgst: 0, total: 0 };
  }
  const tax = (base * item.gst_rate) / 100;
  if (item.gst_type === "cgst_sgst") {
    return { cgst: tax / 2, sgst: tax / 2, igst: 0, utgst: 0, total: tax };
  }
  if (item.gst_type === "igst") {
    return { cgst: 0, sgst: 0, igst: tax, utgst: 0, total: tax };
  }
  if (item.gst_type === "cgst_utgst") {
    return { cgst: tax / 2, sgst: 0, igst: 0, utgst: tax / 2, total: tax };
  }
  return { cgst: 0, sgst: 0, igst: 0, utgst: 0, total: 0 };
}

/** Builtin template layouts */
const builtinTemplateOptions: { id: string; name: string; elements: BuilderElement[] }[] = [
  {
    id: "minimal",
    name: "Minimal",
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
    id: "corporate",
    name: "Corporate",
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
    id: "freelance",
    name: "Modern Freelance",
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
    id: "gst",
    name: "Indian GST",
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

function SortableInvoiceRow({ item, idx, children }: { item: InvoiceItem; idx: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-muted/20 transition-colors">
      <td className="px-1 py-4 w-[30px]">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {children}
    </tr>
  );
}

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [clientId, setClientId] = useState("");
  const [clientMode, setClientMode] = useState<ClientMode>("select");
  const [inlineClientDetails, setInlineClientDetails] = useState<InlineClientDetails>({ ...emptyInline });
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    account_name: "",
    account_number: "",
    ifsc: "",
    bank_name: "",
    branch: "",
    upi_id: "",
  });
  const [bankSynced, setBankSynced] = useState(false);
  // Overall GST toggle
  const [overallGstEnabled, setOverallGstEnabled] = useState(false);
  const [overallGstRate, setOverallGstRate] = useState(18);
  // Custom table columns
  const [tableColumns, setTableColumns] = useState([
    { key: "name", label: "Description" },
    { key: "quantity", label: "Qty" },
    { key: "price", label: "Price" },
    { key: "gst_type", label: "GST Type" },
    { key: "gst_rate", label: "Rate%" },
    { key: "total", label: "Total" },
  ]);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [customColumns, setCustomColumns] = useState<{ key: string; label: string }[]>([]);

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

  // Fetch custom templates
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

  // Fetch saved bank details from profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Sync bank details from profile
  if (profile && !bankSynced) {
    const p = profile as any;
    if (p.bank_account_name || p.bank_account_number) {
      setBankDetails({
        account_name: p.bank_account_name || "",
        account_number: p.bank_account_number || "",
        ifsc: p.bank_ifsc || "",
        bank_name: p.bank_name || "",
        branch: p.bank_branch || "",
        upi_id: p.bank_upi_id || "",
      });
    }
    setBankSynced(true);
  }

  // Apply AI-generated data from URL params
  useEffect(() => {
    if (aiApplied) return;
    const aiDataStr = searchParams.get("ai_data");
    if (!aiDataStr) return;
    try {
      const aiData = JSON.parse(aiDataStr);
      if (aiData.items && aiData.items.length > 0) {
        const aiGst = typeof aiData.gst === "number" ? aiData.gst : 0;
        setItems(
          aiData.items.map((item: any, idx: number) => ({
            id: crypto.randomUUID(),
            sl_no: idx + 1,
            name: item.name || "",
            description: "",
            hsn_sac: item.hsn_sac || "",
            quantity: item.qty || 1,
            price: item.price || 0,
            gst_type: aiGst > 0 ? "cgst_sgst" : "none",
            gst_rate: aiGst,
          })),
        );
      }
      if (typeof aiData.discount === "number") setDiscount(aiData.discount);
      if (aiData.client && clients.length > 0) {
        const match = clients.find((c: any) => c.name.toLowerCase().includes(aiData.client.toLowerCase()));
        if (match) setClientId(match.id);
      }
      setAiApplied(true);
    } catch {
      // ignore
    }
  }, [searchParams, clients, aiApplied]);

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
    const builtin = builtinTemplateOptions.find((t) => t.id === selectedTemplate);
    if (builtin) return builtin.name;
    const custom = customTemplates.find((t: any) => t.id === selectedTemplate);
    if (custom) return custom.name;
    return null;
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  // Compute GST breakdown
  const gstBreakdown = useMemo(() => {
    let totalCgst = 0, totalSgst = 0, totalIgst = 0, totalUtgst = 0, totalGst = 0;

    if (overallGstEnabled) {
      // Overall GST applied uniformly
      const sub = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const tax = (sub * overallGstRate) / 100;
      totalCgst = tax / 2;
      totalSgst = tax / 2;
      totalGst = tax;
    } else {
      items.forEach((item) => {
        const g = computeItemGST(item);
        totalCgst += g.cgst;
        totalSgst += g.sgst;
        totalIgst += g.igst;
        totalUtgst += g.utgst;
        totalGst += g.total;
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

  const handleSave = async () => {
    if (!items.some((i) => i.name.trim())) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const layoutJson = getSelectedLayoutJson();

      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          user_id: user!.id,
          client_id: clientMode === "select" && clientId ? clientId : null,
          invoice_number: nextNumber,
          issue_date: issueDate,
          due_date: dueDate || null,
          subtotal: subtotal,
          discount: discountAmount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total: total,
          layout_json: layoutJson,
          notes: notes || null,
          inline_client_json: clientMode === "inline" ? inlineClientDetails : null,
        })
        .select("id")
        .single();
      if (invError) throw invError;

      const itemRows = items
        .filter((i) => i.name.trim())
        .map((item, idx) => ({
          invoice_id: invoice.id,
          name: item.name,
          description: item.description || null,
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
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };



  // Build live preview data
  const selectedClient = clients.find((c: any) => c.id === clientId);
  const resolvedClientName = clientMode === "inline" ? inlineClientDetails.name : (selectedClient?.name || "");
  const resolvedClientEmail = clientMode === "inline" ? inlineClientDetails.email : "";
  const resolvedClientAddress = clientMode === "inline" ? inlineClientDetails.address : "";
  const previewHTML = useMemo(() => {
    const layoutJson = getSelectedLayoutJson();
    const previewData = {
      invoice_number: nextNumber,
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
      bank_account_name: bankDetails.account_name,
      bank_account_number: bankDetails.account_number,
      bank_ifsc: bankDetails.ifsc,
      bank_name: bankDetails.bank_name,
      bank_branch: bankDetails.branch,
      bank_upi_id: bankDetails.upi_id,
    };
    return generateInvoicePreviewHTML(previewData);
  }, [nextNumber, issueDate, dueDate, subtotal, discountAmount, gstRate, gstAmount, total, notes, items, selectedTemplate, clientId, clients, bankDetails, clientMode, inlineClientDetails]);

  // GST summary component
  const GstSummary = () => (
    <div className="space-y-1.5">
      {gstBreakdown.cgst > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">CGST</span>
          <span className="tabular-nums">+{formatCurrency(gstBreakdown.cgst)}</span>
        </div>
      )}
      {gstBreakdown.sgst > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">SGST</span>
          <span className="tabular-nums">+{formatCurrency(gstBreakdown.sgst)}</span>
        </div>
      )}
      {gstBreakdown.igst > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">IGST</span>
          <span className="tabular-nums">+{formatCurrency(gstBreakdown.igst)}</span>
        </div>
      )}
      {gstBreakdown.utgst > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">UTGST</span>
          <span className="tabular-nums">+{formatCurrency(gstBreakdown.utgst)}</span>
        </div>
      )}
      {gstAmount > 0 && (
        <div className="flex justify-between text-xs font-medium border-t border-dashed pt-1">
          <span className="text-muted-foreground">Total GST</span>
          <span className="tabular-nums">+{formatCurrency(gstAmount)}</span>
        </div>
      )}
    </div>
  );

  // Per-item GST detail
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
              <span className="text-muted-foreground ml-1">
                ({GST_TYPES.find((t) => t.value === item.gst_type)?.label} @ {item.gst_rate}%)
              </span>
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

  const addCustomColumn = () => {
    const key = `custom_${Date.now()}`;
    setCustomColumns([...customColumns, { key, label: "Custom" }]);
  };
  const removeCustomColumn = (key: string) => {
    setCustomColumns(customColumns.filter((c) => c.key !== key));
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border" asChild>
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Invoice</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span className="bg-muted px-2 py-0.5 rounded uppercase">{nextNumber}</span>
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
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Invoice
          </Button>
        </div>
      </motion.div>

      {showPreview ? (
        <motion.div
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
            <iframe
              srcDoc={previewHTML}
              className="w-full border-none"
              style={{ minHeight: "calc(100vh - 180px)" }}
              title="Invoice Preview"
            />
          </div>
        </motion.div>
      ) : (

      <div className="grid gap-8 grid-cols-1">
        <div className="space-y-8">
          {/* Main Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client & Date Info */}
            <motion.div 
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Client & Schedule</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Issue Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                      <Input 
                        type="date" 
                        value={issueDate} 
                        onChange={(e) => setIssueDate(e.target.value)} 
                        className="pl-9 bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Due Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                      <Input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        className="pl-9 bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Template & Visuals */}
            <motion.div 
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visual Template</h2>
                </div>
                {selectedTemplate && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tight">
                    Active
                  </span>
                )}
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Design Layout</Label>
                  <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-muted/50 border-border hover:bg-muted">
                        <span className="flex items-center gap-2">
                          <LayoutTemplate className="h-4 w-4 text-muted-foreground/70" />
                          {selectedTemplate ? getSelectedTemplateName() : "Standard Default"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Select Invoice Template</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto p-1">
                        <button
                          className={cn(
                            "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                            !selectedTemplate ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-muted/30"
                          )}
                          onClick={() => { setSelectedTemplate(null); setTemplateDialogOpen(false); }}
                        >
                          <div className="h-32 w-full bg-muted rounded-lg mb-3 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                          <span className="font-bold text-foreground">No Template</span>
                          <span className="text-xs text-muted-foreground">Standard minimalist layout</span>
                        </button>
                        {builtinTemplateOptions.map((t) => (
                          <button
                            key={t.id}
                            className={cn(
                              "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                              selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-muted/30"
                            )}
                            onClick={() => { setSelectedTemplate(t.id); setTemplateDialogOpen(false); }}
                          >
                            <div className="h-32 w-full bg-muted/80 rounded-lg mb-3 flex items-center justify-center">
                              <Sparkles className="h-8 w-8 text-primary/40" />
                            </div>
                            <span className="font-bold text-foreground">{t.name}</span>
                            <span className="text-xs text-muted-foreground">{t.elements.length} components</span>
                          </button>
                        ))}

                        {customTemplates.length > 0 && (
                          <div className="col-span-2 mt-6 mb-2">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Your Custom Templates</h3>
                          </div>
                        )}

                        {customTemplates.map((t: any) => (
                          <button
                            key={t.id}
                            className={cn(
                              "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                              selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-border hover:bg-muted/30"
                            )}
                            onClick={() => { setSelectedTemplate(t.id); setTemplateDialogOpen(false); }}
                          >
                            <div className="h-32 w-full bg-primary/5 rounded-lg mb-3 flex items-center justify-center">
                              <LayoutTemplate className="h-8 w-8 text-primary/40" />
                            </div>
                            <span className="font-bold text-foreground">{t.name}</span>
                            <span className="text-xs text-muted-foreground">Custom Layout</span>
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 flex items-start gap-3">
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-[11px] text-primary/80 leading-relaxed">
                    The selected template defines how your PDF will look. You can customize these in the <Link to="/templates" className="font-bold underline">Template Builder</Link>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Line Items Table */}
          <motion.div 
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Line Items</h2>
              </div>
              <div className="flex items-center gap-2">
               
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 text-xs font-bold"
                  onClick={addItem}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Item
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showTableSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/50 bg-muted/20 p-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-tight">Custom Columns</h3>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={addCustomColumn}>
                      <Plus className="h-3 w-3 mr-1" /> New Column
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customColumns.map((col) => (
                      <div key={col.key} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                        <Input 
                          className="h-7 text-xs border-none focus-visible:ring-0" 
                          value={col.label}
                          onChange={(e) => setCustomColumns(customColumns.map(c => c.key === col.key ? { ...c, label: e.target.value } : c))}
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-destructive" onClick={() => removeCustomColumn(col.key)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {customColumns.length === 0 && (
                      <p className="text-[11px] text-muted-foreground/60 italic">No custom columns added yet.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="px-1 py-3 w-[30px]"></th>
                    <th className="px-3 py-3 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[4%]">Sl.No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[24%]">Description</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[10%]">HSN/SAC</th>
                    <th className="px-3 py-3 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[7%]">Qty</th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[10%]">Price</th>
                    {!overallGstEnabled && (
                      <>
                        <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[12%]">GST Type</th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[7%]">GST%</th>
                        <th className="px-3 py-3 text-right text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[9%]">GST Amt</th>
                      </>
                    )}
                    {customColumns.map((col) => (
                      <th key={col.key} className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{col.label}</th>
                    ))}
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest w-[10%]">Total</th>
                    <th className="px-3 py-3 w-[40px]"></th>
                  </tr>
                </thead>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-border/50">
                  {items.map((item, idx) => {
                    const itemGst = overallGstEnabled
                      ? (item.quantity * item.price * overallGstRate) / 100
                      : computeItemGST(item).total;
                    const g = computeItemGST(item);
                    return (
                      <SortableInvoiceRow key={item.id} item={item} idx={idx}>
                        <td className="px-4 py-4 text-center">
                          <Input
                            type="number"
                            min={1}
                            value={item.sl_no}
                            onChange={(e) => updateItem(item.id, "sl_no", parseInt(e.target.value) || 1)}
                            className="w-14 text-center text-xs font-mono tabular-nums bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input 
                            value={item.name} 
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            placeholder="Item name or service description"
                            className="bg-transparent hover:border-border focus:bg-background transition-all text-sm font-medium"
                          />
                        </td>
                        <td className="px-3 py-4">
                          <Input 
                            value={item.hsn_sac} 
                            onChange={(e) => updateItem(item.id, "hsn_sac", e.target.value)}
                            placeholder="HSN/SAC"
                            className="bg-transparent hover:border-border focus:bg-background text-xs font-mono"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                            className="text-center font-mono text-sm bg-transparent hover:border-border focus:bg-background"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs">₹</span>
                            <Input 
                              type="number" 
                              value={item.price} 
                              onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                              className="text-right pl-6 font-mono text-sm bg-transparent hover:border-border focus:bg-background"
                            />
                          </div>
                        </td>
                        {!overallGstEnabled && (
                          <>
                            <td className="px-4 py-4">
                              <Select 
                                value={item.gst_type} 
                                onValueChange={(v) => updateItem(item.id, "gst_type", v)}
                              >
                                <SelectTrigger className="h-9 text-xs bg-transparent hover:border-border focus:bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GST_TYPES.map((g) => (
                                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-4">
                              <Input 
                                type="number" 
                                value={item.gst_rate} 
                                onChange={(e) => updateItem(item.id, "gst_rate", parseFloat(e.target.value) || 0)}
                                disabled={item.gst_type === "none"}
                                className="text-center font-mono text-sm bg-transparent hover:border-border focus:bg-background disabled:opacity-30"
                              />
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="font-mono text-sm text-muted-foreground">
                                {formatCurrency(itemGst)}
                              </span>
                            </td>
                          </>
                        )}
                        {customColumns.map((col) => (
                          <td key={col.key} className="px-4 py-4">
                            <Input className="text-xs bg-transparent hover:border-border focus:bg-background" />
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-foreground text-sm">
                            {formatCurrency(item.quantity * item.price + itemGst)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </SortableInvoiceRow>
                    );
                  })}
                </tbody>
                </SortableContext>
                </DndContext>
              </table>
            </div>
            
            <div className="p-6 bg-muted/20 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={overallGstEnabled} onCheckedChange={setOverallGstEnabled} />
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Apply Overall GST</Label>
                </div>
                {overallGstEnabled && (
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">Rate</span>
                    <Input 
                      type="number" 
                      value={overallGstRate} 
                      onChange={(e) => setOverallGstRate(parseFloat(e.target.value) || 0)}
                      className="w-12 h-6 p-0 border-none text-center font-mono text-xs focus-visible:ring-0"
                    />
                    <span className="text-xs text-muted-foreground/50">%</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-1">Subtotal</span>
                <span className="text-xl font-mono font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bank & Payment</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">Account Name</Label>
                    <Input value={bankDetails.account_name} onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })} className="h-9 text-xs bg-muted/50 border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">Account Number</Label>
                    <Input value={bankDetails.account_number} onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })} className="h-9 text-xs font-mono bg-muted/50 border-border" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">IFSC Code</Label>
                    <Input value={bankDetails.ifsc} onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })} className="h-9 text-xs font-mono bg-muted/50 border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">UPI ID</Label>
                    <Input value={bankDetails.upi_id} onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })} className="h-9 text-xs font-mono bg-muted/50 border-border" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes & Terms</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">Discount Percentage</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs font-mono bg-muted/50 border-border pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">Internal Notes</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add payment terms or a thank you note..."
                    className="text-xs bg-muted/50 border-border resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Summary & Preview */}
        <div className="space-y-6">
          <motion.div 
            className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/10 sticky top-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70 mb-6">Invoice Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-foreground/70">Subtotal</span>
                <span className="text-sm font-mono">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="space-y-2 py-3 border-y border-primary-foreground/20">
                {gstBreakdown.cgst > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary-foreground/60">CGST</span>
                    <span className="font-mono text-primary-foreground/80">+{formatCurrency(gstBreakdown.cgst)}</span>
                  </div>
                )}
                {gstBreakdown.sgst > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary-foreground/60">SGST</span>
                    <span className="font-mono text-primary-foreground/80">+{formatCurrency(gstBreakdown.sgst)}</span>
                  </div>
                )}
                {gstBreakdown.igst > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary-foreground/60">IGST</span>
                    <span className="font-mono text-primary-foreground/80">+{formatCurrency(gstBreakdown.igst)}</span>
                  </div>
                )}
                {gstAmount > 0 && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-accent-foreground">Total Tax</span>
                    <span className="text-xs font-mono font-bold text-accent-foreground">+{formatCurrency(gstAmount)}</span>
                  </div>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-accent-foreground">Discount ({discount}%)</span>
                  <span className="text-sm font-mono text-accent-foreground">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/50 block mb-1">Grand Total</span>
              <div className="text-4xl font-mono font-bold tracking-tighter">
                {formatCurrency(total)}
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Finalize & Save
            </Button>
          </motion.div>

        </div>
      </div>
      )}
    </div>
  );
}
