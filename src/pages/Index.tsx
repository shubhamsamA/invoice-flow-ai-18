import { ArrowUpRight, ArrowDownRight, FileText, Users, DollarSign, Clock, Plus, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const statusClasses: Record<string, string> = {
  paid: "invoice-status-paid",
  unpaid: "invoice-status-unpaid",
  overdue: "invoice-status-overdue",
};

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch all invoices for stats
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch client count
  const { data: clientCount = 0 } = useQuery({
    queryKey: ["client-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("clients").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Compute stats from real data
  const paidInvoices = invoices.filter((i: any) => i.status === "paid");
  const unpaidInvoices = invoices.filter((i: any) => i.status === "unpaid" || i.status === "overdue");
  const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.total), 0);
  const pendingAmount = unpaidInvoices.reduce((sum: number, i: any) => sum + Number(i.total), 0);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: `${paidInvoices.length} paid invoices`,
      up: true,
      icon: DollarSign,
      color: "text-[hsl(var(--success))]",
      bgColor: "bg-[hsl(var(--success)/0.1)]",
    },
    {
      label: "Paid Invoices",
      value: String(paidInvoices.length),
      change: `of ${invoices.length} total`,
      up: true,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Unpaid Invoices",
      value: String(unpaidInvoices.length),
      change: `${formatCurrency(pendingAmount)} pending`,
      up: false,
      icon: Clock,
      color: "text-[hsl(var(--warning))]",
      bgColor: "bg-[hsl(var(--warning)/0.1)]",
    },
    {
      label: "Active Clients",
      value: String(clientCount),
      change: "in your account",
      up: true,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back. Here's your invoice overview.</p>
        </div>
        <Button asChild className="gap-2 shadow-sm">
          <Link to="/invoices/new">
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="stat-card"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="flex items-start justify-between">
                  <div className={`${stat.bgColor} rounded-lg p-2.5`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  {stat.up ? (
                    <ArrowUpRight className="h-4 w-4 text-[hsl(var(--success))]" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[hsl(var(--warning))]" />
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 uppercase tracking-wider font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.div
              className="lg:col-span-3 stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold">Invoice Summary</h2>
                  <p className="text-xs text-muted-foreground">{invoices.length} total invoices</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>No invoices yet. Create your first one to see stats here.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-3 h-36">
                    {/* Show last 6 invoices as bar chart */}
                    {invoices.slice(0, 6).reverse().map((inv: any, i: number) => {
                      const maxTotal = Math.max(...invoices.slice(0, 6).map((x: any) => Number(x.total)));
                      const pct = maxTotal > 0 ? (Number(inv.total) / maxTotal) * 100 : 10;
                      return (
                        <motion.div
                          key={inv.id}
                          className="flex-1 rounded-t-md bg-primary/15 relative group"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 8)}%` }}
                          transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div
                            className={`w-full rounded-t-md ${inv.status === "paid" ? "bg-primary" : "bg-primary/40"}`}
                            style={{ height: "100%" }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {invoices.slice(0, 6).reverse().map((inv: any) => (
                      <span key={inv.id} className="flex-1 text-center text-[10px] text-muted-foreground truncate">
                        {inv.invoice_number}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            <motion.div
              className="lg:col-span-2 stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Recent Invoices</h2>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" asChild>
                  <Link to="/invoices">View all</Link>
                </Button>
              </div>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No invoices yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((inv: any, i: number) => (
                    <motion.div
                      key={inv.id}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.clients?.name || "No client"}</p>
                        <p className="text-[11px] text-muted-foreground">{inv.invoice_number} · {inv.issue_date}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(Number(inv.total))}</p>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusClasses[inv.status]}`}>
                          {inv.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
