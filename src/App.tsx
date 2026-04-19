import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded route chunks
const Index = lazy(() => import("./pages/Index"));
const Invoices = lazy(() => import("./pages/Invoices"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const BulkUpload = lazy(() => import("./pages/BulkUpload"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const InvoicePreview = lazy(() => import("./pages/InvoicePreview"));
const Clients = lazy(() => import("./pages/Clients"));
const Templates = lazy(() => import("./pages/Templates"));
const AIGenerator = lazy(() => import("./pages/AIGenerator"));
const InvoiceBuilder = lazy(() => import("./pages/InvoiceBuilder"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RestaurantBill = lazy(() => import("./pages/RestaurantBill"));
const RestaurantBills = lazy(() => import("./pages/RestaurantBills"));
const Inventory = lazy(() => import("./pages/Inventory"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Index />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<CreateInvoice />} />
              <Route path="/invoices/bulk-upload" element={<BulkUpload />} />
              <Route path="/invoices/:id" element={<InvoicePreview />} />
              <Route path="/invoices/:id/edit" element={<EditInvoice />} />
              <Route path="/invoices/builder" element={<InvoiceBuilder />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/ai-generator" element={<AIGenerator />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/restaurant-bills" element={<RestaurantBills />} />
              <Route path="/restaurant-bill/new" element={<RestaurantBill />} />
              <Route path="/inventory" element={<Inventory />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
