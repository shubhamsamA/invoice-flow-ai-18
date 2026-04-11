import {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users,
  DollarSign,
  Clock,
  Plus,
  Loader2,
  Calendar,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Cell,
} from "recharts";

const statusClasses: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  unpaid: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();

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

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["client-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("clients").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const paidInvoices = invoices.filter((i: any) => i.status === "paid");
  const unpaidInvoices = invoices.filter((i: any) => i.status === "unpaid" || i.status === "overdue");
  const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.total), 0);
  const pendingAmount = unpaidInvoices.reduce((sum: number, i: any) => sum + Number(i.total), 0);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      subtext: `${paidInvoices.length} paid invoices`,
      icon: DollarSign,
      trend: "+12.5%",
      up: true,
      color: "text-primary",
      bgColor: "bg-primary/10 ",
    },
    {
      label: "Pending",
      value: formatCurrency(pendingAmount),
      subtext: `${unpaidInvoices.length} awaiting payment`,
      icon: Clock,
      trend: "-2.4%",
      up: false,
        color: "text-primary",
      bgColor: "bg-primary/10 ",
    },
    {
      label: "Total Invoices",
      value: String(invoices.length),
      subtext: "All time generated",
      icon: FileText,
      trend: "+5.2%",
      up: true,
    color: "text-primary",
      bgColor: "bg-primary/10 ",
    },
    {
      label: "Clients",
      value: String(clientCount),
      subtext: "Active relationships",
      icon: Users,
      trend: "+3",
      up: true,
      color: "text-primary",
      bgColor: "bg-primary/10 ",
    },
  ];

  const chartData = invoices
    .slice(0, 10)
    .reverse()
    .map((inv: any) => ({
      name: inv.invoice_number,
      amount: Number(inv.total),
      status: inv.status,
    }));

  const recentInvoices = invoices.slice(0, 6);

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-6 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-6" variants={itemVariants}>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">OVERVIEW</h1>
          <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
            <Activity className="h-4 w-4 text-primary" />
           System is stable
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="gap-2 font-mono uppercase hover:bg-foreground hover:text-background text-xs">
            <Link to="/invoices/new">
              <Plus className="h-4 w-4" />
              Initialize Invoice
            </Link>
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground animate-pulse font-mono">Syncing Data...</p>
        </div>
      ) : (
        <>
          {/* Getting Started Checklist */}
          <GettingStartedChecklist />

          {/* Stats Grid */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border/50 rounded-lg overflow-hidden" variants={itemVariants}>
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "group relative overflow-hidden bg-card p-6 transition-all duration-300",
                  i !== stats.length - 1 && "border-r border-border/50"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-full p-2 bg-primary/10">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-mono font-medium ${stat.up ? "text-emerald-500" : "text-amber-500"}`}>
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif italic text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-2xl font-bold tracking-tight font-mono">{stat.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Section */}
            <motion.div className="lg:col-span-8" variants={itemVariants}>
              <div className="bg-card border border-border/50 rounded-lg p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif italic text-lg text-muted-foreground">Revenue Flow</h2>
                </div>

                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
                          tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "0px",
                            fontSize: "12px",
                            fontFamily: "monospace",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="hsl(var(--primary)/0.1)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-dashed border-border/50">
                      <p className="text-xs text-muted-foreground font-mono">No_Data</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Invoices Section */}
            <motion.div className="lg:col-span-4" variants={itemVariants}>
              <div className="bg-card border border-border/50 rounded-lg h-full flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <h2 className="font-serif italic text-lg text-muted-foreground">Recent Activity</h2>
                  <Button variant="ghost" size="sm" className="text-[10px] uppercase font-mono hover:bg-primary/5" asChild>
                    <Link to="/invoices">View All</Link>
                  </Button>
                </div>

                <div className="flex-1">
                  {recentInvoices.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-6">
                      <p className="text-xs text-muted-foreground font-mono">No Activity</p>
                    </div>
                  ) : (
                    recentInvoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="group flex items-center justify-between px-4 py-3 border-b border-border/30 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate font-mono">{inv.clients?.name || "Unknown"}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">
                            {inv.invoice_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold tabular-nums font-mono">{formatCurrency(Number(inv.total))}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

