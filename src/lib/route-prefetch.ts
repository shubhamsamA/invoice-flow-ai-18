// Map of route paths to their dynamic import functions.
// Triggering the import warms Vite's module cache so the chunk is ready
// by the time the user clicks the link.
const loaders: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/pages/Index"),
  "/invoices": () => import("@/pages/Invoices"),
  "/invoices/new": () => import("@/pages/CreateInvoice"),
  "/invoices/bulk-upload": () => import("@/pages/BulkUpload"),
  "/invoices/builder": () => import("@/pages/InvoiceBuilder"),
  "/clients": () => import("@/pages/Clients"),
  "/templates": () => import("@/pages/Templates"),
  "/ai-generator": () => import("@/pages/AIGenerator"),
  "/settings": () => import("@/pages/Settings"),
  "/restaurant-bills": () => import("@/pages/RestaurantBills"),
  "/restaurant-bill/new": () => import("@/pages/RestaurantBill"),
  "/inventory": () => import("@/pages/Inventory"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = loaders[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire and forget; swallow errors so a failed prefetch never breaks UX.
  loader().catch(() => prefetched.delete(path));
}
