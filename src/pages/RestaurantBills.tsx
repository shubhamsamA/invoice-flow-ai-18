import { Link } from "react-router-dom";
import { Plus, Loader2, Trash2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function RestaurantBills() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bills, isLoading } = useQuery({
    queryKey: ["restaurant-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_bills")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleKOTReprint = async (bill: typeof bills extends (infer T)[] | undefined ? T : never) => {
    const { data: billItems, error } = await supabase
      .from("restaurant_bill_items")
      .select("*")
      .eq("bill_id", bill.id)
      .order("sort_order");
    if (error || !billItems?.length) {
      toast.error("No items found for this bill");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const now = new Date(bill.created_at);
    printWindow.document.write(`
      <html><head><title>KOT - ${bill.table_number || "N/A"}</title>
      <style>
        @page { size: 80mm 200mm; margin: 1mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 2mm; width: 76mm; }
        .header { text-align: center; margin-bottom: 6px; }
        .header h1 { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
        .reprint { text-align: center; font-size: 10px; font-weight: bold; margin-bottom: 4px; }
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
        <div class="reprint">[ REPRINT ]</div>
        <div class="divider"></div>
        <div class="info"><span>Table: ${bill.table_number || "N/A"}</span><span>${now.toLocaleTimeString()}</span></div>
        <div class="info"><span>Server: ${bill.server_name || "N/A"}</span><span>${now.toLocaleDateString()}</span></div>
        <div class="info"><span>${bill.bill_number}</span></div>
        <div class="divider"></div>
        <table>
          <thead><tr><th>Item</th><th class="center">Qty</th></tr></thead>
          <tbody>
            ${billItems.map((i) => `<tr><td>${i.name}</td><td class="center">${i.quantity}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        ${bill.notes ? `<p style="font-size:11px;margin-top:4px;">Note: ${bill.notes}</p>` : ""}
        <div class="footer"><p>Kitchen Order Ticket</p></div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("restaurant_bills").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete bill");
    } else {
      toast.success("Bill deleted");
      queryClient.invalidateQueries({ queryKey: ["restaurant-bills"] });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "default";
      case "unpaid": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Restaurant Bills</h1>
          <p className="text-sm text-muted-foreground">Manage your restaurant bills</p>
        </div>
        <Button className="gap-2" asChild>
          <Link to="/restaurant-bill/new">
            <Plus className="h-4 w-4" /> New Bill
          </Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !bills?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No bills yet. Create your first restaurant bill!</p>
            <Button asChild>
              <Link to="/restaurant-bill/new">
                <Plus className="h-4 w-4 mr-2" /> Create Bill
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill, idx) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{bill.bill_number}</span>
                      <Badge variant={statusColor(bill.status)} className="text-[10px]">
                        {bill.status}
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {bill.table_number && <span>Table: {bill.table_number}</span>}
                      <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">₹{Number(bill.total).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleKOTReprint(bill)}
                      title="Reprint KOT"
                    >
                      <ChefHat className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(bill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
