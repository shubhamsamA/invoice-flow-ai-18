import { useState } from "react";
import { Plus, Trash2, Edit2, Search, Package, Save, X, Loader2, Upload } from "lucide-react";
import InventoryBulkImport from "@/components/InventoryBulkImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  hsn_code: string | null;
  sku: string | null;
  category: string | null;
  unit: string | null;
  unit_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

const UNITS = ["pcs", "kg", "g", "ltr", "ml", "m", "cm", "ft", "hrs", "nos", "box", "set", "pair"];

const emptyForm = {
  name: "",
  description: "",
  hsn_code: "",
  sku: "",
  category: "",
  unit: "pcs",
  unit_price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
};

export default function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!user,
  });

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];

  const filtered = items.filter(i => {
    const matchesSearch = !search || 
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())) ||
      (i.hsn_code && i.hsn_code.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === "all" || i.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      description: item.description || "",
      hsn_code: item.hsn_code || "",
      sku: item.sku || "",
      category: item.category || "",
      unit: item.unit || "pcs",
      unit_price: item.unit_price,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
      is_active: item.is_active,
    });
    setEditing(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user!.id,
        name: form.name.trim(),
        description: form.description || null,
        hsn_code: form.hsn_code || null,
        sku: form.sku || null,
        category: form.category || null,
        unit: form.unit,
        unit_price: form.unit_price,
        stock_quantity: form.stock_quantity,
        low_stock_threshold: form.low_stock_threshold,
        is_active: form.is_active,
      };

      if (editing) {
        const { error } = await supabase.from("inventory").update(payload).eq("id", editing);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("inventory").insert(payload);
        if (error) throw error;
        toast.success("Item added");
      }
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage your products & services for quick invoice creation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No inventory items yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add items to quickly use them in invoices</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-lg font-bold text-primary">{formatCurrency(item.unit_price)}</span>
                  <span className="text-xs text-muted-foreground">/ {item.unit}</span>
                  {!item.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {item.sku && <span>SKU: {item.sku}</span>}
                  {item.hsn_code && <span>HSN: {item.hsn_code}</span>}
                  {item.category && <Badge variant="outline" className="text-[10px] h-5">{item.category}</Badge>}
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className={item.stock_quantity <= item.low_stock_threshold ? "text-destructive font-semibold" : "text-muted-foreground"}>
                    Stock: {item.stock_quantity} {item.unit}
                  </span>
                  {item.stock_quantity <= item.low_stock_threshold && (
                    <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product or service name" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit Price (₹)</Label>
                <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PRD-001" />
              </div>
              <div>
                <Label className="text-xs font-semibold">HSN/SAC Code</Label>
                <Input value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} placeholder="e.g. 998311" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Services" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Stock Quantity</Label>
                <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Low Stock Alert</Label>
                <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InventoryBulkImport open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
