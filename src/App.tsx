import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Clients from "./pages/Clients";
import Templates from "./pages/Templates";
import AIGenerator from "./pages/AIGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/ai-generator" element={<AIGenerator />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
