import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, MapPin, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  gst: string;
  invoices: number;
  totalBilled: number;
}

const initialClients: Client[] = [
  { id: "1", name: "Priya Sharma", email: "priya@email.com", address: "Mumbai, Maharashtra", gst: "27AABCP1234A1ZA", invoices: 8, totalBilled: 342000 },
  { id: "2", name: "TechCorp Solutions", email: "billing@techcorp.in", address: "Bengaluru, Karnataka", gst: "29AABCT5678B1ZB", invoices: 12, totalBilled: 890000 },
  { id: "3", name: "Aarav Design Studio", email: "aarav@design.co", address: "Delhi, NCR", gst: "07AABCA9012C1ZC", invoices: 4, totalBilled: 156000 },
  { id: "4", name: "GlobalTech India", email: "accounts@globaltech.in", address: "Hyderabad, Telangana", gst: "36AABCG3456D1ZD", invoices: 6, totalBilled: 478000 },
  { id: "5", name: "Meera Consulting", email: "meera@consult.com", address: "Pune, Maharashtra", gst: "27AABCM7890E1ZE", invoices: 3, totalBilled: 135000 },
];

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: form.get("name") as string,
      email: form.get("email") as string,
      address: form.get("address") as string,
      gst: form.get("gst") as string,
      invoices: 0,
      totalBilled: 0,
    };
    setClients([newClient, ...clients]);
    setDialogOpen(false);
    toast.success(`${newClient.name} added successfully`);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
    toast.success("Client removed");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clients</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input name="name" placeholder="Client or company name" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" placeholder="billing@company.com" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input name="address" placeholder="City, State" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GST Number</Label>
                <Input name="gst" placeholder="e.g. 27AABCP1234A1ZA" />
              </div>
              <Button type="submit" className="w-full">Add Client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        className="relative max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <motion.div
            key={client.id}
            className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {client.email}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2"><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {client.address}
              </div>
              <div className="font-mono text-[11px]">GST: {client.gst}</div>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between text-xs">
              <span className="text-muted-foreground">{client.invoices} invoices</span>
              <span className="font-semibold tabular-nums">{formatCurrency(client.totalBilled)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No clients found.</p>
        </div>
      )}
    </div>
  );
}
