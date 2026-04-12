import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Printer, Download, Save, Loader2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const generateId = () => crypto.randomUUID();

export default function RestaurantBill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [tableNumber, setTableNumber] = useState("");
  const [serverName, setServerName] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: generateId(), name: "", quantity: 1, unitPrice: 0 },
  ]);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(10);
  const [gstRate, setGstRate] = useState(5);
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: billCount } = useQuery({
    queryKey: ["restaurant-bill-count"],
    queryFn: async () => {
      const { count } = await supabase.from("restaurant_bills").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const serviceChargeAmount = serviceChargeEnabled ? (subtotal * serviceChargeRate) / 100 : 0;
  const taxableAmount = subtotal + serviceChargeAmount;
  const gstAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = taxableAmount + gstAmount + tip;

  const addItem = () => setItems([...items, { id: generateId(), name: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const billNumber = `BILL-${String((billCount ?? 0) + 1).padStart(4, "0")}`;

  const handleSave = async () => {
    if (!user) return;
    if (items.every((i) => !i.name.trim())) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const { data: bill, error } = await supabase
        .from("restaurant_bills")
        .insert({
          user_id: user.id,
          bill_number: billNumber,
          table_number: tableNumber || null,
          server_name: serverName || null,
          subtotal,
          service_charge_rate: serviceChargeEnabled ? serviceChargeRate : 0,
          service_charge_amount: serviceChargeAmount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          tip,
          total: grandTotal,
          payment_method: paymentMethod,
          notes: notes || null,
          status: "unpaid",
        })
        .select()
        .single();

      if (error) throw error;

      const billItems = items
        .filter((i) => i.name.trim())
        .map((i, idx) => ({
          bill_id: bill.id,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          amount: i.quantity * i.unitPrice,
          sort_order: idx,
        }));

      if (billItems.length) {
        const { error: itemsError } = await supabase.from("restaurant_bill_items").insert(billItems);
        if (itemsError) throw itemsError;
      }

      toast.success("Bill saved successfully!");
      navigate("/restaurant-bills");
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    } finally {
      setSaving(false);
    }
  };

  const handleKOTPrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const kotItems = items.filter((i) => i.name.trim());
    if (!kotItems.length) {
      toast.error("Add at least one item to print KOT");
      return;
    }
    const now = new Date();
    printWindow.document.write(`
      <html><head><title>KOT - ${tableNumber || "N/A"}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 8mm; width: 80mm; }
        .header { text-align: center; margin-bottom: 6px; }
        .header h1 { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
        .divider { border-top: 1px dashed #333; margin: 4px 0; }
        .info { font-size: 11px; display: flex; justify-content: space-between; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; margin: 4px 0; }
        th { text-align: left; border-bottom: 1px solid #333; padding: 3px 0; font-size: 11px; }
        td { padding: 3px 0; font-size: 12px; }
        .center { text-align: center; }
        .footer { text-align: center; font-size: 9px; margin-top: 8px; }
      </style>
      </head><body>
        <div class="header"><h1>** KOT **</h1></div>
        <div class="divider"></div>
        <div class="info"><span>Table: ${tableNumber || "N/A"}</span><span>${now.toLocaleTimeString()}</span></div>
        <div class="info"><span>Server: ${serverName || "N/A"}</span><span>${now.toLocaleDateString()}</span></div>
        <div class="divider"></div>
        <table>
          <thead><tr><th>Item</th><th class="center">Qty</th></tr></thead>
          <tbody>
            ${kotItems.map((i) => `<tr><td>${i.name}</td><td class="center">${i.quantity}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        ${notes ? `<p style="font-size:11px;margin-top:4px;">Note: ${notes}</p>` : ""}
        <div class="footer"><p>Kitchen Order Ticket</p></div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`
      <html><head><title>${billNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 12px; }
        .header h1 { font-size: 16px; font-weight: bold; }
        .header p { font-size: 11px; color: #666; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .info { font-size: 11px; display: flex; justify-content: space-between; }
        table { width: 100%; font-size: 11px; border-collapse: collapse; margin: 8px 0; }
        th { text-align: left; border-bottom: 1px solid #333; padding: 4px 0; }
        td { padding: 3px 0; }
        .right { text-align: right; }
        .total-row { font-weight: bold; font-size: 13px; }
        .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; }
      </style>
      </head><body>${printRef.current.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (v: number) => `₹${v.toFixed(2)}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Restaurant Bill</h1>
          <p className="text-sm text-muted-foreground">Create a new restaurant bill</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleKOTPrint}>
            <ChefHat className="h-4 w-4" /> KOT
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Bill
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Table Number</Label>
                  <Input placeholder="e.g. T-05" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Server / Waiter</Label>
                  <Input placeholder="Name" value={serverName} onChange={(e) => setServerName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {idx === 0 && <Label className="text-xs">Item</Label>}
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-16 space-y-1">
                    {idx === 0 && <Label className="text-xs">Qty</Label>}
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    {idx === 0 && <Label className="text-xs">Price</Label>}
                    <Input
                      type="number"
                      min={0}
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                      placeholder="₹0"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Service Charge</Label>
                <div className="flex items-center gap-2">
                  {serviceChargeEnabled && (
                    <Input
                      type="number"
                      className="w-16 h-8 text-xs"
                      value={serviceChargeRate}
                      onChange={(e) => setServiceChargeRate(Number(e.target.value) || 0)}
                    />
                  )}
                  <span className="text-xs text-muted-foreground">%</span>
                  <Switch checked={serviceChargeEnabled} onCheckedChange={setServiceChargeEnabled} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">GST Rate</Label>
                <div className="flex items-center gap-2">
                  <Select value={String(gstRate)} onValueChange={(v) => setGstRate(Number(v))}>
                    <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tip</Label>
                <Input
                  type="number"
                  className="w-24 h-8 text-xs"
                  value={tip || ""}
                  onChange={(e) => setTip(Number(e.target.value) || 0)}
                  placeholder="₹0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  placeholder="Any special notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Preview */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bill Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={printRef}
                className="bg-white border rounded-lg p-6 font-mono text-sm max-w-[320px] mx-auto"
              >
                {/* Header */}
                <div className="text-center mb-3">
                  <h2 className="text-base font-bold uppercase tracking-wide">
                    {profile?.business_name || "Restaurant Name"}
                  </h2>
                  {profile?.business_address && (
                    <p className="text-[10px] text-muted-foreground">{profile.business_address}</p>
                  )}
                  {profile?.business_phone && (
                    <p className="text-[10px] text-muted-foreground">Tel: {profile.business_phone}</p>
                  )}
                  {profile?.gst_number && (
                    <p className="text-[10px] text-muted-foreground">GSTIN: {profile.gst_number}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-muted-foreground/40 my-2" />

                {/* Bill info */}
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{billNumber}</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  {tableNumber && <span>Table: {tableNumber}</span>}
                  {serverName && <span>Server: {serverName}</span>}
                </div>

                <div className="border-t border-dashed border-muted-foreground/40 my-2" />

                {/* Items */}
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-foreground/20">
                      <th className="text-left py-1 font-semibold">Item</th>
                      <th className="text-center py-1 font-semibold w-8">Qty</th>
                      <th className="text-right py-1 font-semibold">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter((i) => i.name.trim()).map((item) => (
                      <tr key={item.id}>
                        <td className="py-0.5">{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                    {items.every((i) => !i.name.trim()) && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted-foreground text-[10px]">
                          No items added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-muted-foreground/40 my-2" />

                {/* Totals */}
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {serviceChargeEnabled && serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge ({serviceChargeRate}%)</span>
                      <span>{formatCurrency(serviceChargeAmount)}</span>
                    </div>
                  )}
                  {gstRate > 0 && (
                    <div className="flex justify-between">
                      <span>GST ({gstRate}%)</span>
                      <span>{formatCurrency(gstAmount)}</span>
                    </div>
                  )}
                  {tip > 0 && (
                    <div className="flex justify-between">
                      <span>Tip</span>
                      <span>{formatCurrency(tip)}</span>
                    </div>
                  )}
                  <div className="border-t border-foreground/30 my-1" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-muted-foreground/40 my-2" />

                <div className="text-center text-[10px] text-muted-foreground">
                  <p>Payment: {paymentMethod.toUpperCase()}</p>
                  {notes && <p className="mt-1">{notes}</p>}
                  <p className="mt-2">Thank you! Visit again.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
