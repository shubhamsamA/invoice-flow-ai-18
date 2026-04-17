import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import BulkUpload from "./pages/BulkUpload";
import EditInvoice from "./pages/EditInvoice";
import InvoicePreview from "./pages/InvoicePreview";
import Clients from "./pages/Clients";
import Templates from "./pages/Templates";
import AIGenerator from "./pages/AIGenerator";
import InvoiceBuilder from "./pages/InvoiceBuilder";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import RestaurantBill from "./pages/RestaurantBill";
import RestaurantBills from "./pages/RestaurantBills";
import Inventory from "./pages/Inventory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
