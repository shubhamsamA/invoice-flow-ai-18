import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { exportFullInvoicePDF, generateInvoicePreviewHTML } from "@/lib/pdf-export";

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-detail", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase
        .from("invoices")
        .select("*, clients(name, email, address, gst_number)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      const { data: items } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id!)
        .order("sort_order");
      return { ...inv, items: items || [] };
    },
    enabled: !!user && !!id,
  });

  // Fetch business profile for branding
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const buildInvoiceData = () => {
    if (!invoice) return null;
    return {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      gst_rate: invoice.gst_rate,
      gst_amount: invoice.gst_amount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
      client_name: invoice.clients?.name || (invoice.inline_client_json as any)?.name,
      client_email: invoice.clients?.email || (invoice.inline_client_json as any)?.email,
      client_address: invoice.clients?.address || (invoice.inline_client_json as any)?.address,
      client_gst: invoice.clients?.gst_number || (invoice.inline_client_json as any)?.gst_number,
      items: invoice.items.map((i: any, idx: number) => ({
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        amount: Number(i.amount),
        sl_no: i.sort_order != null ? i.sort_order + 1 : idx + 1,
      })),
      // Business branding
      business_name: profile?.business_name || undefined,
      business_email: profile?.business_email || undefined,
      business_address: profile?.business_address || undefined,
      business_gst: profile?.gst_number || undefined,
      logo_url: (profile as any)?.logo_url || undefined,
      stamp_url: (profile as any)?.stamp_url || undefined,
      signature_url: (profile as any)?.signature_url || undefined,
      bank_account_name: profile?.bank_account_name || undefined,
      bank_account_number: profile?.bank_account_number || undefined,
      bank_ifsc: profile?.bank_ifsc || undefined,
      bank_name: profile?.bank_name || undefined,
      bank_branch: profile?.bank_branch || undefined,
      bank_upi_id: profile?.bank_upi_id || undefined,
      // Layout
      layout_json: invoice.layout_json,
    };
  };

  const handleDownloadPDF = () => {
    const data = buildInvoiceData();
    if (data) exportFullInvoicePDF(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link to="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const invoiceData = buildInvoiceData()!;
  const previewHTML = generateInvoicePreviewHTML(invoiceData);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">Invoice Preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/invoices/${id}/edit`}>
              <Edit className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button
            className="gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="bg-white rounded-xl border shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
      </motion.div>
    </div>
  );
}
