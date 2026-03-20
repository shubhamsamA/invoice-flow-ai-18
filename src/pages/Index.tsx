import { ArrowUpRight, ArrowDownRight, FileText, Users, DollarSign, Clock, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Mock data for dashboard
const stats = [
  {
    label: "Total Revenue",
    value: "₹4,82,350",
    change: "+12.5%",
    up: true,
    icon: DollarSign,
    color: "text-[hsl(var(--success))]",
    bgColor: "bg-[hsl(var(--success)/0.1)]",
  },
  {
    label: "Paid Invoices",
    value: "24",
    change: "+3 this month",
    up: true,
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Unpaid Invoices",
    value: "7",
    change: "₹1,23,400 pending",
    up: false,
    icon: Clock,
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.1)]",
  },
  {
    label: "Active Clients",
    value: "18",
    change: "+2 new",
    up: true,
    icon: Users,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

const recentInvoices = [
  { id: "INV-001", client: "Priya Sharma", amount: "₹84,000", status: "paid", date: "Mar 15, 2026" },
  { id: "INV-002", client: "TechCorp Solutions", amount: "₹1,50,000", status: "unpaid", date: "Mar 12, 2026" },
  { id: "INV-003", client: "Aarav Design Studio", amount: "₹32,500", status: "overdue", date: "Feb 28, 2026" },
  { id: "INV-004", client: "GlobalTech India", amount: "₹67,800", status: "paid", date: "Mar 10, 2026" },
  { id: "INV-005", client: "Meera Consulting", amount: "₹45,000", status: "paid", date: "Mar 8, 2026" },
];

const statusClasses: Record<string, string> = {
  paid: "invoice-status-paid",
  unpaid: "invoice-status-unpaid",
  overdue: "invoice-status-overdue",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
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

      {/* Stats Grid */}
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

      {/* Revenue Chart Placeholder + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <motion.div
          className="lg:col-span-3 stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold">Revenue Trend</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--success))]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-medium">+18.2%</span>
            </div>
          </div>
          {/* Simple visual chart representation */}
          <div className="flex items-end gap-3 h-36">
            {[35, 52, 41, 68, 55, 78].map((val, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-md bg-primary/15"
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="w-full rounded-t-md bg-primary"
                  style={{ height: `${val > 50 ? 60 : 40}%` }}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex gap-3 mt-3">
            {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => (
              <span key={m} className="flex-1 text-center text-[10px] text-muted-foreground">{m}</span>
            ))}
          </div>
        </motion.div>

        {/* Recent Invoices */}
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
          <div className="space-y-3">
            {recentInvoices.map((inv, i) => (
              <motion.div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.client}</p>
                  <p className="text-[11px] text-muted-foreground">{inv.id} · {inv.date}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold tabular-nums">{inv.amount}</p>
                  <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusClasses[inv.status]}`}>
                    {inv.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
