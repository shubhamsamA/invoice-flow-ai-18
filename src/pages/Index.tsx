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
      className="max-w-7xl mx-auto space-y-10 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div className="flex flex-col md:flex-row md:items-end justify-between gap-6" variants={itemVariants}>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Your business performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-border/50">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button asChild className="gap-2 shadow-lg shadow-primary/20">
            <Link to="/invoices/new">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground animate-pulse">Syncing your data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" variants={itemVariants}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className={`${stat.bgColor} rounded-xl p-3 transition-transform group-hover:scale-110 duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-emerald-500" : "text-amber-500"}`}>
                    {stat.trend}
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  </div>
                </div>
                <div className="mt-5 space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground/80">{stat.subtext}</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Section */}
            <motion.div className="lg:col-span-8 space-y-4" variants={itemVariants}>
              <div className="bg-card border border-border/50 rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-lg font-semibold">Revenue Flow</h2>
                    <p className="text-xs text-muted-foreground">Historical invoice amounts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Amount</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">No data available for chart</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Invoices Section */}
            <motion.div className="lg:col-span-4 space-y-4" variants={itemVariants}>
              <div className="bg-card border border-border/50 rounded-2xl p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/5" asChild>
                    <Link to="/invoices">
                      View All <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  {recentInvoices.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No invoices found</p>
                      <p className="text-xs text-muted-foreground">Start by creating your first invoice.</p>
                    </div>
                  ) : (
                    recentInvoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{inv.clients?.name || "Unknown Client"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                              {inv.invoice_number} · {inv.issue_date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums">{formatCurrency(Number(inv.total))}</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${
                              statusClasses[inv.status] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-primary uppercase tracking-wider">Quick Action</p>
                      <p className="text-sm font-bold">Generate AI Invoice</p>
                    </div>
                    <Button size="icon" variant="ghost" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link to="/ai-generator">
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

