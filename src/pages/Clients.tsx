import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, MapPin, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ClientsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Fetch clients from database
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch invoice stats per client
  const { data: clientStats = {} } = useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("client_id, total, id");
      if (error) throw error;
      const stats: Record<string, { count: number; total: number }> = {};
      data?.forEach((inv) => {
        if (!inv.client_id) return;
        if (!stats[inv.client_id]) stats[inv.client_id] = { count: 0, total: 0 };
        stats[inv.client_id].count++;
        stats[inv.client_id].total += Number(inv.total) || 0;
      });
      return stats;
    },
    enabled: !!user,
  });

  // Add client mutation
  const addClient = useMutation({
    mutationFn: async (formData: FormData) => {
      const { error } = await supabase.from("clients").insert({
        user_id: user!.id,
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || null,
        address: (formData.get("address") as string) || null,
        gst_number: (formData.get("gst") as string) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      toast.success("Client added successfully");
    },
    onError: () => toast.error("Failed to add client"),
  });

  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: formData.get("name") as string,
          email: (formData.get("email") as string) || null,
          address: (formData.get("address") as string) || null,
          gst_number: (formData.get("gst") as string) || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setEditingClient(null);
      toast.success("Client updated");
    },
    onError: () => toast.error("Failed to update client"),
  });

  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client removed");
    },
    onError: () => toast.error("Failed to delete client"),
  });

  const filtered = clients.filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, formData: form });
    } else {
      addClient.mutate(form);
    }
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setDialogOpen(true);
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
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingClient(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70">
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  name="name"
                  placeholder="Client or company name"
                  required
                  defaultValue={editingClient?.name || ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="billing@company.com"
                  defaultValue={editingClient?.email || ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input name="address" placeholder="City, State" defaultValue={editingClient?.address || ""} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GST Number</Label>
                <Input name="gst" placeholder="e.g. 27AABCP1234A1ZA" defaultValue={editingClient?.gst_number || ""} />
              </div>
              <Button
                type="submit"
                className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                disabled={addClient.isPending || updateClient.isPending}
              >
                {(addClient.isPending || updateClient.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? "Update Client" : "Add Client"}
              </Button>
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
        <Input
          placeholder="Search clients..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client: any, i: number) => {
            const stats = clientStats[client.id] || { count: 0, total: 0 };
            return (
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
                      {client.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      {client.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {client.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => openEdit(client)}>
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive"
                        onClick={() => deleteClient.mutate(client.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {client.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {client.address}
                    </div>
                  )}
                  {client.gst_number && <div className="font-mono text-[11px]">GST: {client.gst_number}</div>}
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between text-xs">
                  <span className="text-muted-foreground">{stats.count} invoices</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(stats.total)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "No clients match your search." : "No clients yet. Add your first client to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
