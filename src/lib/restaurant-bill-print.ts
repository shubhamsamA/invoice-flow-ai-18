interface BillProfile {
  business_name?: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  gst_number?: string | null;
}

interface BillItemLike {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PrintableBill {
  billNumber: string;
  tableNumber?: string | null;
  serverName?: string | null;
  customerName?: string | null;
  items: BillItemLike[];
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  gstRate: number;
  gstAmount: number;
  tip: number;
  subtotal: number;
  grandTotal: number;
  paymentMethod: string;
  notes?: string | null;
  date: Date;
}

const fmt = (v: number) => `Rs.${v.toFixed(2)}`;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

export function buildBillHTML(bill: PrintableBill, profile: BillProfile | null) {
  const filledItems = bill.items.filter((i) => i.name.trim());
  return `
    <html><head><title>${esc(bill.billNumber)}</title>
    <style>
      @page { size: 80mm 200mm; margin: 1mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 4mm 2mm; width: 76mm; color: #000; }
      .center { text-align: center; }
      .right { text-align: right; }
      .muted { color: #555; }
      .bold { font-weight: bold; }
      h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
      .small { font-size: 9px; }
      .info-row { display: flex; justify-content: space-between; font-size: 9px; color: #555; margin-top: 1px; }
      .divider { border-top: 1px dashed #999; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      thead th { text-align: left; padding: 2px 0; border-bottom: 1px solid #333; font-weight: 600; }
      thead th.qty { text-align: center; width: 28px; }
      thead th.amt { text-align: right; }
      tbody td { padding: 2px 0; }
      tbody td.qty { text-align: center; }
      tbody td.amt { text-align: right; }
      .totals { font-size: 10px; }
      .totals .row { display: flex; justify-content: space-between; padding: 1px 0; }
      .totals .grand { font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
      .footer { text-align: center; font-size: 9px; color: #555; margin-top: 6px; }
    </style>
    </head><body>
      <div class="center">
        <h2>${esc(profile?.business_name || "Restaurant Name")}</h2>
        ${profile?.business_address ? `<p class="small muted">${esc(profile.business_address)}</p>` : ""}
        ${profile?.business_phone ? `<p class="small muted">Tel: ${esc(profile.business_phone)}</p>` : ""}
        ${profile?.gst_number ? `<p class="small muted">GSTIN: ${esc(profile.gst_number)}</p>` : ""}
      </div>
      <div class="divider"></div>
      <div class="info-row"><span>${esc(bill.billNumber)}</span><span>${bill.date.toLocaleDateString()}</span></div>
      <div class="info-row">
        ${bill.tableNumber ? `<span>Table: ${esc(bill.tableNumber)}</span>` : "<span></span>"}
        ${bill.serverName ? `<span>Server: ${esc(bill.serverName)}</span>` : "<span></span>"}
      </div>
      <div class="divider"></div>
      <table>
        <thead><tr><th>Item</th><th class="qty">Qty</th><th class="amt">Amt</th></tr></thead>
        <tbody>
          ${
            filledItems.length
              ? filledItems
                  .map(
                    (i) =>
                      `<tr><td>${esc(i.name)}</td><td class="qty">${i.quantity}</td><td class="amt">${fmt(
                        i.quantity * i.unitPrice
                      )}</td></tr>`
                  )
                  .join("")
              : `<tr><td colspan="3" class="center muted small">No items</td></tr>`
          }
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${fmt(bill.subtotal)}</span></div>
        ${
          bill.serviceChargeEnabled && bill.serviceChargeAmount > 0
            ? `<div class="row"><span>Service Charge (${bill.serviceChargeRate}%)</span><span>${fmt(bill.serviceChargeAmount)}</span></div>`
            : ""
        }
        ${
          bill.gstRate > 0
            ? `<div class="row"><span>GST (${bill.gstRate}%)</span><span>${fmt(bill.gstAmount)}</span></div>`
            : ""
        }
        ${bill.tip > 0 ? `<div class="row"><span>Tip</span><span>${fmt(bill.tip)}</span></div>` : ""}
        <div class="row grand"><span>TOTAL</span><span>${fmt(bill.grandTotal)}</span></div>
      </div>
      <div class="divider"></div>
      <div class="footer">
        <p>Payment: ${esc(bill.paymentMethod.toUpperCase())}</p>
        ${bill.notes ? `<p style="margin-top:2px;">${esc(bill.notes)}</p>` : ""}
        <p style="margin-top:6px;">Thank you! Visit again.</p>
      </div>
      <script>window.print(); setTimeout(()=>window.close(), 300);</script>
    </body></html>
  `;
}

export function openPrintWindow(bill: PrintableBill, profile: BillProfile | null) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildBillHTML(bill, profile));
  w.document.close();
}
