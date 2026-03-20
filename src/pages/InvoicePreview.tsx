import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { exportFullInvoicePDF, generateInvoicePreviewHTML } from "@/lib/pdf-export";

/**
 * Invoice Preview Page
 * Shows a styled preview of a saved invoice and allows PDF download.
 */
export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch invoice with client and items
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-detail", id],
    queryFn: async () => {
      const { data: inv, error } = await supabase
        .from("invoices")
        .select("*, clients(name, email, address, gst_number)")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id!)
        .order("sort_order");
      if (itemsError) throw itemsError;

      return { ...inv, items: items || [] };
    },
    enabled: !!user && !!id,
  });

  const handleDownloadPDF = () => {
    if (!invoice) return;
    exportFullInvoicePDF({
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
      client_name: invoice.clients?.name,
      client_email: invoice.clients?.email,
      client_address: invoice.clients?.address,
      client_gst: invoice.clients?.gst_number,
      items: invoice.items.map((i: any) => ({
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        amount: Number(i.amount),
      })),
    });
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

  const previewHTML = generateInvoicePreviewHTML({
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
    client_name: invoice.clients?.name,
    client_email: invoice.clients?.email,
    client_address: invoice.clients?.address,
    client_gst: invoice.clients?.gst_number,
    items: invoice.items.map((i: any) => ({
      name: i.name,
      description: i.description,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      amount: Number(i.amount),
    })),
  });

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
            <Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">Invoice Preview</p>
          </div>
        </div>
        <Button className="gap-2 shadow-sm" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4" /> Download PDF
        </Button>
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
