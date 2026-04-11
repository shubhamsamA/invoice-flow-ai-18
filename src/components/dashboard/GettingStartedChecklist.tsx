import { Check, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  link: string;
  linkLabel: string;
  done: boolean;
}

export function GettingStartedChecklist() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("invoiceflow-checklist-dismissed") === "true"
  );

  const { data: profile } = useQuery({
    queryKey: ["checklist-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("business_name, business_email")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["checklist-clients"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: invoiceCount = 0 } = useQuery({
    queryKey: ["checklist-invoices"],
    queryFn: async () => {
      const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: paidCount = 0 } = useQuery({
    queryKey: ["checklist-paid"],
    queryFn: async () => {
      const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "paid");
      return count || 0;
    },
    enabled: !!user,
  });

  const items: ChecklistItem[] = [
    {
      key: "profile",
      label: "Set up business profile",
      description: "Add your business name, address, and logo",
      link: "/settings",
      linkLabel: "Go to Settings",
      done: !!(profile?.business_name),
    },
    {
      key: "client",
      label: "Add your first client",
      description: "Create a client to start invoicing",
      link: "/clients",
      linkLabel: "Add Client",
      done: clientCount > 0,
    },
    {
      key: "invoice",
      label: "Create your first invoice",
      description: "Generate a professional invoice",
      link: "/invoices/new",
      linkLabel: "Create Invoice",
      done: invoiceCount > 0,
    },
    {
      key: "paid",
      label: "Mark an invoice as paid",
      description: "Track your first payment",
      link: "/invoices",
      linkLabel: "View Invoices",
      done: paidCount > 0,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;
  const progress = Math.round((completedCount / items.length) * 100);

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem("invoiceflow-checklist-dismissed", "true");
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border border-border/50 rounded-lg overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="font-serif italic text-lg text-muted-foreground">Getting Started</h2>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
              {completedCount}/{items.length}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              item.done ? "opacity-60" : "hover:bg-sidebar-accent"
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                item.done
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border"
              )}
            >
              {item.done && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium font-mono", item.done && "line-through")}>{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.description}</p>
            </div>
            {!item.done && (
              <Link
                to={item.link}
                className="text-[10px] font-mono uppercase text-primary hover:underline flex items-center gap-0.5 shrink-0"
              >
                {item.linkLabel}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
