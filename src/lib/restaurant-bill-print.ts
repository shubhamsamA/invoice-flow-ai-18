interface BillProfile {
  business_name?: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  gst_number?: string | null;
  bank_upi_id?: string | null;
  logo_url?: string | null;
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
  pageSize?: PageSize;
  viewUrl?: string | null;
  showUpiQr?: boolean;
  showViewQr?: boolean;
}

export type PageSize = "80mm" | "58mm" | "A4" | "A5" | "Letter";

export const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: "80mm", label: "Thermal 80mm" },
  { value: "58mm", label: "Thermal 58mm" },
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "Letter", label: "Letter" },
];

function pageStyles(size: PageSize) {
  switch (size) {
    case "58mm":
      return { page: "58mm 200mm", body: "width: 54mm; padding: 3mm 1mm; font-size: 10px;" };
    case "A4":
      return { page: "A4", body: "width: 100%; max-width: 180mm; margin: 0 auto; padding: 12mm; font-size: 12px;" };
    case "A5":
      return { page: "A5", body: "width: 100%; max-width: 130mm; margin: 0 auto; padding: 8mm; font-size: 11px;" };
    case "Letter":
      return { page: "Letter", body: "width: 100%; max-width: 190mm; margin: 0 auto; padding: 12mm; font-size: 12px;" };
    case "80mm":
    default:
      return { page: "80mm 200mm", body: "width: 76mm; padding: 4mm 2mm;" };
  }
}

const fmt = (v: number) => `Rs.${v.toFixed(2)}`;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

export function buildBillHTML(bill: PrintableBill, profile: BillProfile | null) {
  const filledItems = bill.items.filter((i) => i.name.trim());
  const sizes = pageStyles(bill.pageSize || "80mm");
  const upi = profile?.bank_upi_id?.trim();
  const merchant = profile?.business_name || "Merchant";
  const showUpi = bill.showUpiQr !== false;
  const showView = bill.showViewQr !== false;
  const qrUrl = upi && showUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `upi://pay?pa=${upi}&pn=${encodeURIComponent(merchant)}&am=${bill.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(bill.billNumber)}`
      )}`
    : null;
  const viewQr = bill.viewUrl && showView
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bill.viewUrl)}`
    : null;
  return `
    <html><head><title>${esc(bill.billNumber)}</title>
    <style>
      @page { size: ${sizes.page}; margin: 6mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; ${sizes.body} color: #000; }
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
      .qr { text-align: center; margin-top: 8px; }
      .qr img { width: 110px; height: 110px; }
      .qr p { font-size: 9px; color: #333; margin-top: 2px; }
      .qr-row { display: flex; justify-content: space-around; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .qr-row .qr { margin-top: 0; }
      .logo { max-width: 60px; max-height: 60px; margin: 0 auto 4px; display: block; object-fit: contain; }
    </style>
    </head><body>
      <div class="center">
        ${profile?.logo_url ? `<img src="${esc(profile.logo_url)}" alt="Logo" class="logo" />` : ""}
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
      ${bill.customerName ? `<div class="info-row"><span>Customer: ${esc(bill.customerName)}</span><span></span></div>` : ""}
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
        ${
          qrUrl || viewQr
            ? `<div class="qr-row">
                ${qrUrl ? `<div class="qr"><img src="${qrUrl}" alt="UPI QR" /><p>Pay via UPI</p><p class="muted">${esc(upi!)}</p></div>` : ""}
                ${viewQr ? `<div class="qr"><img src="${viewQr}" alt="View Bill QR" /><p>Scan to view bill</p></div>` : ""}
              </div>`
            : ""
        }
        <p style="margin-top:6px;">Thank you! Visit again.</p>
      </div>
      <script>
        (function(){
          function doPrint(){ try { window.focus(); window.print(); } catch(e){} setTimeout(function(){ try { window.close(); } catch(e){} }, 500); }
          var imgs = Array.prototype.slice.call(document.images || []);
          if (!imgs.length) { doPrint(); return; }
          var remaining = imgs.length;
          var done = false;
          function check(){ if (done) return; remaining--; if (remaining <= 0) { done = true; doPrint(); } }
          imgs.forEach(function(img){
            if (img.complete && img.naturalWidth > 0) { check(); }
            else {
              img.addEventListener('load', check);
              img.addEventListener('error', check);
            }
          });
          // Fallback in case some image hangs
          setTimeout(function(){ if (!done) { done = true; doPrint(); } }, 5000);
        })();
      </script>
    </body></html>
  `;
}

export function openPrintWindow(bill: PrintableBill, profile: BillProfile | null) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildBillHTML(bill, profile));
  w.document.close();
}
