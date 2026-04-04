import { BuilderElement } from "@/types/builder";
import { SAMPLE_INVOICE_DATA, InvoiceLayoutData, getFontFamily, resolveInvoiceText } from "@/lib/invoice-layout";

interface Props {
  elements: BuilderElement[];
  canvasWidth: number;
  canvasHeight: number;
  data?: InvoiceLayoutData;
}

const fmt = (n: number, currency = "INR") => {
  if (currency === "USD") return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
};

function PreviewElement({ element, data }: { element: BuilderElement; data: InvoiceLayoutData }) {
  const { type, content } = element;
  const c = content || {};

  switch (type) {
    case "text": {
      const rendered = resolveInvoiceText(c.text, data);
      return (
        <div
          className="w-full h-full flex items-center px-3"
          style={{
            fontSize: c.fontSize || 14,
            fontWeight: c.fontWeight || (c.bold ? 700 : 400),
            color: c.color || "#111827",
            fontFamily: getFontFamily(c.fontFamily),
            fontStyle: c.italic ? "italic" : undefined,
            textDecoration: c.underline ? "underline" : undefined,
            textAlign: c.textAlign || "left",
            lineHeight: c.lineHeight || 1.4,
            letterSpacing: typeof c.letterSpacing === "number" ? `${c.letterSpacing}px` : undefined,
            textTransform: c.textTransform || undefined,
            backgroundColor: c.backgroundColor && c.backgroundColor !== "transparent" ? c.backgroundColor : undefined,
          }}
        >
          <p className="w-full">{rendered || "Text"}</p>
        </div>
      );
    }
    case "logo":
      return (
        <div className="h-full flex items-center justify-center">
          {(data.logo_url || c.url) ? (
            <img src={data.logo_url || c.url} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f" }}>{data.business_name || "Company"}</div>
          )}
        </div>
      );
    case "business-details": {
      const ff = getFontFamily(c.fontFamily);
      const fs = c.fontSize || 12;
      return (
        <div className="p-3 space-y-1" style={{ fontSize: fs, fontFamily: ff }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", marginBottom: 4, fontWeight: 600 }}>From</div>
          <p style={{ fontWeight: 500, fontSize: fs + 2 }}>{data.business_name || c.name}</p>
          <p style={{ color: "#666" }}>{data.business_email || c.email}</p>
          <p style={{ color: "#666" }}>{data.business_address || c.address}</p>
          {(data.business_gst || c.gst) && <p style={{ color: "#666", fontFamily: "monospace", fontSize: 10 }}>GST: {data.business_gst || c.gst}</p>}
        </div>
      );
    }
    case "client-details": {
      const ff = getFontFamily(c.fontFamily);
      const fs = c.fontSize || 12;
      return (
        <div className="p-3 space-y-1" style={{ fontSize: fs, fontFamily: ff }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", marginBottom: 4, fontWeight: 600 }}>Bill To</div>
          <p style={{ fontWeight: 500, fontSize: fs + 2 }}>{data.client_name || c.name}</p>
          <p style={{ color: "#666" }}>{data.client_email || c.email}</p>
          <p style={{ color: "#666" }}>{data.client_address || c.address}</p>
          {(data.client_gst || c.gst) && <p style={{ color: "#666", fontFamily: "monospace", fontSize: 10 }}>GST: {data.client_gst || c.gst}</p>}
        </div>
      );
    }
    case "invoice-number":
      return (
        <div className="h-full flex items-center px-3">
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", fontWeight: 600, marginBottom: 4 }}>{c.label || "Invoice #"}</div>
            <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>{data.invoice_number}</p>
          </div>
        </div>
      );
    case "invoice-date":
      return (
        <div className="h-full flex items-start px-3 py-2">
          <div className="w-full space-y-1.5">
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", fontWeight: 600, marginBottom: 4 }}>{c.label || "Date"}</div>
            {c.showIssue !== false && (
              <div className="flex justify-between" style={{ fontSize: 12 }}>
                <span style={{ color: "#8899a6" }}>Issue:</span>
                <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{data.issue_date}</span>
              </div>
            )}
            {c.showDue !== false && (
              <div className="flex justify-between" style={{ fontSize: 12 }}>
                <span style={{ color: "#8899a6" }}>Due:</span>
                <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{data.due_date || "—"}</span>
              </div>
            )}
          </div>
        </div>
      );
    case "items-table": {
      const cols = c.columns || { description: "Description", qty: "Qty", price: "Price", total: "Total", slNo: "#", hsnSac: "HSN/SAC", gstType: "GST Type", gstRate: "Rate %", gstAmount: "GST Amt" };
      const vis = c.visibleColumns || { slNo: true, description: true, hsnSac: true, qty: true, price: true, gstType: true, gstRate: true, gstAmount: true, total: true };
      const ff = getFontFamily(c.fontFamily);
      const fs = c.fontSize || 12;
      const thStyle = (align: string = "left"): React.CSSProperties => ({ textAlign: align as any, padding: "6px 8px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8899a6", borderBottom: "2px solid #e8edf2" });
      const tdStyle = (align: string = "left"): React.CSSProperties => ({ padding: "6px 8px", borderBottom: "1px solid #eee", fontSize: 12, textAlign: align as any });
      return (
        <div className="p-3" style={{ fontSize: fs, fontFamily: ff }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {vis.slNo !== false && <th style={thStyle()}>{cols.slNo || "#"}</th>}
                {vis.description !== false && <th style={thStyle()}>{cols.description || "Description"}</th>}
                {vis.hsnSac && <th style={thStyle()}>{cols.hsnSac || "HSN/SAC"}</th>}
                {vis.qty !== false && <th style={thStyle("right")}>{cols.qty || "Qty"}</th>}
                {vis.price !== false && <th style={thStyle("right")}>{cols.price || "Price"}</th>}
                {vis.gstType && <th style={thStyle()}>{cols.gstType || "GST Type"}</th>}
                {vis.gstRate && <th style={thStyle("right")}>{cols.gstRate || "Rate %"}</th>}
                {vis.gstAmount && <th style={thStyle("right")}>{cols.gstAmount || "GST Amt"}</th>}
                {vis.total !== false && <th style={thStyle("right")}>{cols.total || "Total"}</th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                const gstRate = (item as any).gst_rate || data.gst_rate || 0;
                const gstAmt = item.amount * gstRate / 100;
                return (
                  <tr key={i}>
                    {vis.slNo !== false && <td style={tdStyle()}>{item.sl_no || i + 1}</td>}
                    {vis.description !== false && (
                      <td style={tdStyle()}>
                        {item.name}
                        {item.description && <div style={{ fontSize: 10, color: "#888" }}>{item.description}</div>}
                      </td>
                    )}
                    {vis.hsnSac && <td style={tdStyle()}>{(item as any).hsn_sac || "—"}</td>}
                    {vis.qty !== false && <td style={tdStyle("right")}>{item.quantity}</td>}
                    {vis.price !== false && <td style={tdStyle("right")}>{fmt(item.unit_price, data.currency)}</td>}
                    {vis.gstType && <td style={tdStyle()}>{(item as any).gst_type || "IGST"}</td>}
                    {vis.gstRate && <td style={tdStyle("right")}>{gstRate}%</td>}
                    {vis.gstAmount && <td style={tdStyle("right")}>{fmt(gstAmt, data.currency)}</td>}
                    {vis.total !== false && <td style={{ ...tdStyle("right"), fontWeight: 500 }}>{fmt(item.amount, data.currency)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    case "total-summary": {
      const ff = getFontFamily(c.fontFamily);
      const fs = c.fontSize || 13;
      return (
        <div className="p-3 space-y-1" style={{ fontSize: fs, fontFamily: ff }}>
          <div className="flex justify-between py-1"><span style={{ color: "#666" }}>Subtotal</span><span>{fmt(data.subtotal, data.currency)}</span></div>
          {data.gst_rate > 0 && <div className="flex justify-between py-1"><span style={{ color: "#666" }}>GST ({data.gst_rate}%)</span><span>+{fmt(data.gst_amount, data.currency)}</span></div>}
          {data.discount > 0 && <div className="flex justify-between py-1"><span style={{ color: "#666" }}>Discount</span><span style={{ color: "#2e8b57" }}>-{fmt(data.discount, data.currency)}</span></div>}
          <div className="flex justify-between pt-2" style={{ fontWeight: 700, fontSize: 15, borderTop: "2px solid #1e3a5f", marginTop: 4 }}>
            <span>Total</span><span>{fmt(data.total, data.currency)}</span>
          </div>
        </div>
      );
    }
    case "signature":
      return (
        <div className="h-full flex flex-col items-center justify-end p-3">
          {data.signature_url ? (
            <img src={data.signature_url} alt="Signature" style={{ maxHeight: 40, maxWidth: 140, objectFit: "contain" }} />
          ) : (
            <div style={{ height: 40, width: "100%", borderBottom: "1px solid #ccc" }} />
          )}
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>{c.label || "Authorized Signatory"}</div>
        </div>
      );
    case "stamp":
      return (
        <div className="h-full flex items-center justify-center">
          {(data.stamp_url || c.url) ? (
            <img src={data.stamp_url || c.url} alt="Stamp" className="max-h-full max-w-full object-contain p-2" style={{ opacity: 0.8 }} />
          ) : (
            <div style={{ fontSize: 10, color: "#8899a6" }}>Company Stamp</div>
          )}
        </div>
      );
    case "note": {
      const rendered = resolveInvoiceText(c.text, data);
      return (
        <div className="h-full flex items-start px-3 py-2" style={{
          fontSize: c.fontSize || 12,
          color: c.color || "#555",
          fontFamily: getFontFamily(c.fontFamily),
          fontWeight: c.fontWeight || 400,
          textAlign: c.textAlign || "left",
          lineHeight: c.lineHeight || 1.4,
        }}>
          <p>{rendered || data.notes || "Note"}</p>
        </div>
      );
    }
    case "divider":
      return (
        <div className="h-full flex items-center" style={{ padding: `0 16px`, marginTop: c.spacing || 0, marginBottom: c.spacing || 0 }}>
          <hr style={{ width: "100%", border: "none", borderTop: `${c.thickness || 1}px ${c.style || "solid"} ${c.color || "#ddd"}` }} />
        </div>
      );
    case "bank-details": {
      const accName = data.bank_account_name || c.accountName || "";
      const accNum = data.bank_account_number || c.accountNumber || "";
      const ifsc = data.bank_ifsc || c.ifsc || "";
      const bName = data.bank_name || c.bankName || "";
      const branch = data.bank_branch || c.branch || "";
      const upi = data.bank_upi_id || c.upiId || "";
      return (
        <div className="p-3 space-y-1" style={{ fontSize: c.fontSize || 12, fontFamily: getFontFamily(c.fontFamily) }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8899a6", marginBottom: 4, fontWeight: 600 }}>Bank Details</div>
          {accName && <p style={{ fontWeight: 500, fontSize: 13 }}>A/C Name: {accName}</p>}
          {accNum && <p style={{ fontFamily: "monospace", fontSize: 11 }}>A/C No: {accNum}</p>}
          {ifsc && <p style={{ color: "#666" }}>IFSC: {ifsc}</p>}
          {bName && <p style={{ color: "#666" }}>{bName}{branch ? ` — ${branch}` : ""}</p>}
          {upi && <p style={{ color: "#666" }}>UPI: {upi}</p>}
        </div>
      );
    }
    default:
      return <div style={{ padding: 8, fontSize: 12, color: "#888" }}>Unknown</div>;
  }
}

export function BuilderLivePreview({ elements, canvasWidth, canvasHeight, data }: Props) {
  const invoiceData = data || SAMPLE_INVOICE_DATA;

  return (
    <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-4">
      <div
        className="relative bg-white shadow-md border"
        style={{ width: canvasWidth, height: canvasHeight, minWidth: canvasWidth }}
      >
        {elements.map((el) => (
          <div
            key={el.id}
            className="absolute overflow-hidden"
            style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
          >
            <PreviewElement element={el} data={invoiceData} />
          </div>
        ))}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No elements yet — add components in the Editor tab</p>
          </div>
        )}
      </div>
    </div>
  );
}
