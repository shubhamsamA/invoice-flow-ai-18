import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, MoreHorizontal, FileText, Download, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const invoices = [
  { id: "INV-001", client: "Priya Sharma", email: "priya@email.com", amount: 84000, status: "paid", date: "2026-03-15", due: "2026-04-15", items: 3 },
  { id: "INV-002", client: "TechCorp Solutions", email: "billing@techcorp.in", amount: 150000, status: "unpaid", date: "2026-03-12", due: "2026-04-12", items: 5 },
  { id: "INV-003", client: "Aarav Design Studio", email: "aarav@design.co", amount: 32500, status: "overdue", date: "2026-02-28", due: "2026-03-15", items: 2 },
  { id: "INV-004", client: "GlobalTech India", email: "accounts@globaltech.in", amount: 67800, status: "paid", date: "2026-03-10", due: "2026-04-10", items: 4 },
  { id: "INV-005", client: "Meera Consulting", email: "meera@consult.com", amount: 45000, status: "paid", date: "2026-03-08", due: "2026-04-08", items: 1 },
  { id: "INV-006", client: "Ravi Kumar Enterprises", email: "ravi@enterprise.in", amount: 215000, status: "unpaid", date: "2026-03-05", due: "2026-04-05", items: 7 },
];

const statusClasses: Record<string, string> = {
  paid: "invoice-status-paid",
  unpaid: "invoice-status-unpaid",
  overdue: "invoice-status-overdue",
};

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function InvoicesPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    if (filter !== "all" && inv.status !== filter) return false;
    if (search && !inv.client.toLowerCase().includes(search.toLowerCase()) && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} total invoices</p>
        </div>
        <Button asChild className="gap-2 shadow-sm">
          <Link to="/invoices/new">
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client or invoice ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "paid", "unpaid", "overdue"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              className="capitalize text-xs"
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-card rounded-xl border shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Due</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{inv.client}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{inv.date}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{inv.due}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${statusClasses[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Download className="h-3.5 w-3.5" /> Download PDF</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Send className="h-3.5 w-3.5" /> Send to client</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No invoices match your filters.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setFilter("all"); setSearch(""); }}>
              Clear filters
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
