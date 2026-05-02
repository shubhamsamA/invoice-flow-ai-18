import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface BillData {
  bill: any;
  items: any[];
  profile: any;
}

export default function PublicBill() {
  const { id } = useParams();
  const [data, setData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${SUPABASE_URL}/functions/v1/public-bill?id=${id}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error}</CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { bill, items, profile } = data;
  const fmt = (v: number) => `₹${Number(v).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 font-mono text-sm">
            <div className="text-center mb-4">
              <h1 className="text-base font-bold uppercase tracking-wide">
                {profile?.business_name || "Restaurant"}
              </h1>
              {profile?.business_address && <p className="text-xs text-muted-foreground mt-1">{profile.business_address}</p>}
              {profile?.business_phone && <p className="text-xs text-muted-foreground">Tel: {profile.business_phone}</p>}
              {profile?.gst_number && <p className="text-xs text-muted-foreground">GSTIN: {profile.gst_number}</p>}
            </div>
            <div className="border-t border-dashed my-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{bill.bill_number}</span>
              <span>{new Date(bill.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              {bill.table_number && <span>Table: {bill.table_number}</span>}
              {bill.server_name && <span>Server: {bill.server_name}</span>}
            </div>
            {bill.customer_name && (
              <div className="text-xs text-muted-foreground mt-1">Customer: {bill.customer_name}</div>
            )}
            <div className="border-t border-dashed my-3" />
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1 w-10">Qty</th>
                  <th className="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-1">{i.name}</td>
                    <td className="text-center py-1">{i.quantity}</td>
                    <td className="text-right py-1">{fmt(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed my-3" />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(bill.subtotal)}</span></div>
              {Number(bill.service_charge_amount) > 0 && (
                <div className="flex justify-between">
                  <span>Service ({bill.service_charge_rate}%)</span><span>{fmt(bill.service_charge_amount)}</span>
                </div>
              )}
              {Number(bill.gst_rate) > 0 && (
                <div className="flex justify-between">
                  <span>GST ({bill.gst_rate}%)</span><span>{fmt(bill.gst_amount)}</span>
                </div>
              )}
              {Number(bill.tip) > 0 && (
                <div className="flex justify-between"><span>Tip</span><span>{fmt(bill.tip)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>TOTAL</span><span>{fmt(bill.total)}</span>
              </div>
            </div>
            <div className="border-t border-dashed my-3" />
            <div className="text-center text-xs text-muted-foreground">
              <p>Payment: {String(bill.payment_method).toUpperCase()}</p>
              <p className="mt-1">Status: {bill.status}</p>
              {bill.notes && <p className="mt-2">{bill.notes}</p>}
              <p className="mt-3">Thank you! Visit again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}