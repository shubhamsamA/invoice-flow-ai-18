import { useState } from "react";
import { Plus, User, UserPlus, PenLine, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type ClientMode = "select" | "create" | "inline";

interface InlineClientDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
}

interface ClientSelectorProps {
  clients: { id: string; name: string }[];
  clientId: string;
  onClientIdChange: (id: string) => void;
  inlineDetails: InlineClientDetails;
  onInlineDetailsChange: (details: InlineClientDetails) => void;
  clientMode: ClientMode;
  onClientModeChange: (mode: ClientMode) => void;
}

const emptyInline: InlineClientDetails = { name: "", email: "", phone: "", address: "", gst_number: "" };

export type { ClientMode, InlineClientDetails };
export { emptyInline };

export default function ClientSelector({
  clients,
  clientId,
  onClientIdChange,
  inlineDetails,
  onInlineDetailsChange,
  clientMode,
  onClientModeChange,
}: ClientSelectorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newClient, setNewClient] = useState<InlineClientDetails>({ ...emptyInline });
  const [savingClient, setSavingClient] = useState(false);

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSavingClient(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: user!.id,
          name: newClient.name.trim(),
          email: newClient.email || null,
          phone: newClient.phone || null,
          address: newClient.address || null,
          gst_number: newClient.gst_number || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClientIdChange(data.id);
      onClientModeChange("select");
      setNewClient({ ...emptyInline });
      toast.success("Client created!");
    } catch {
      toast.error("Failed to create client");
    } finally {
      setSavingClient(false);
    }
  };

  const updateInline = (field: keyof InlineClientDetails, value: string) => {
    onInlineDetailsChange({ ...inlineDetails, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-semibold text-foreground">Client</Label>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
        <button
          type="button"
          onClick={() => onClientModeChange("select")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            clientMode === "select"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-3 w-3" /> Existing
        </button>
        <button
          type="button"
          onClick={() => onClientModeChange("create")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            clientMode === "create"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-3 w-3" /> New Client
        </button>
        <button
          type="button"
          onClick={() => onClientModeChange("inline")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            clientMode === "inline"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenLine className="h-3 w-3" /> Fill Directly
        </button>
      </div>

      {/* Select existing */}
      {clientMode === "select" && (
        <Select value={clientId} onValueChange={onClientIdChange}>
          <SelectTrigger className="bg-muted/50 border-border focus:ring-primary">
            <SelectValue placeholder="Choose a client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Create new client */}
      {clientMode === "create" && (
        <div className="space-y-2.5 p-3 rounded-lg border border-dashed border-border bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Name *</Label>
            <Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client name" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Email</Label>
              <Input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Phone</Label>
              <Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Phone" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Address</Label>
            <Input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} placeholder="Address" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">GST Number</Label>
            <Input value={newClient.gst_number} onChange={(e) => setNewClient({ ...newClient, gst_number: e.target.value })} placeholder="GST Number" className="h-8 text-sm" />
          </div>
          <Button size="sm" className="w-full gap-1.5" onClick={handleCreateClient} disabled={savingClient}>
            {savingClient ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save & Select Client
          </Button>
        </div>
      )}

      {/* Fill inline without saving */}
      {clientMode === "inline" && (
        <div className="space-y-2.5 p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground">These details will appear on the invoice only — no client record is saved.</p>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Name</Label>
            <Input value={inlineDetails.name} onChange={(e) => updateInline("name", e.target.value)} placeholder="Client name" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Email</Label>
              <Input value={inlineDetails.email} onChange={(e) => updateInline("email", e.target.value)} placeholder="Email" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Phone</Label>
              <Input value={inlineDetails.phone} onChange={(e) => updateInline("phone", e.target.value)} placeholder="Phone" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Address</Label>
            <Input value={inlineDetails.address} onChange={(e) => updateInline("address", e.target.value)} placeholder="Address" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">GST Number</Label>
            <Input value={inlineDetails.gst_number} onChange={(e) => updateInline("gst_number", e.target.value)} placeholder="GST Number" className="h-8 text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
