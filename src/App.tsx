import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoicePreview from "./pages/InvoicePreview";
import Clients from "./pages/Clients";
import Templates from "./pages/Templates";
import AIGenerator from "./pages/AIGenerator";
import InvoiceBuilder from "./pages/InvoiceBuilder";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<CreateInvoice />} />
              <Route path="/invoices/:id" element={<InvoicePreview />} />
              <Route path="/invoices/builder" element={<InvoiceBuilder />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/ai-generator" element={<AIGenerator />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
