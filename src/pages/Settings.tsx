import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Loader2, Trash2, Building2, Image, Stamp, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: "",
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    gst_number: "",
  });

  // Sync form when profile loads
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setForm({
      display_name: profile.display_name || "",
      business_name: profile.business_name || "",
      business_email: profile.business_email || "",
      business_phone: profile.business_phone || "",
      business_address: profile.business_address || "",
      gst_number: profile.gst_number || "",
    });
    setSynced(true);
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(form)
        .eq("user_id", user!.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}.${ext}`;
    const { error } = await supabase.storage
      .from("business-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "stamp_url" | "signature_url",
    folder: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }
    const url = await uploadFile(file, folder);
    if (url) {
      await supabase.from("profiles").update({ [field]: url }).eq("user_id", user!.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Uploaded successfully");
    }
  };

  const handleRemoveImage = async (field: "logo_url" | "stamp_url" | "signature_url") => {
    await supabase.from("profiles").update({ [field]: null }).eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Removed");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const imageFields: {
    label: string;
    field: "logo_url" | "stamp_url" | "signature_url";
    folder: string;
    icon: typeof Image;
    description: string;
  }[] = [
    { label: "Business Logo", field: "logo_url", folder: "logo", icon: Image, description: "Appears on invoice headers" },
    { label: "Company Stamp", field: "stamp_url", folder: "stamp", icon: Stamp, description: "Appears on invoice footer" },
    { label: "Signature", field: "signature_url", folder: "signature", icon: PenTool, description: "Authorized signatory" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your business profile and branding</p>
      </motion.div>

      {/* Business Details */}
      <motion.div
        className="bg-card rounded-xl border shadow-sm p-6 space-y-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Business Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Display Name</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Business Name</Label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Business Email</Label>
            <Input type="email" value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} placeholder="billing@acme.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Business Phone</Label>
            <Input value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Business Address</Label>
            <Input value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} placeholder="123 Main St, City" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">GST Number</Label>
            <Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} placeholder="22AAAAA0000A1Z5" className="font-mono text-xs" />
          </div>
        </div>

        <Button className="gap-2 shadow-sm" onClick={handleSaveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Details
        </Button>
      </motion.div>

      {/* Branding Assets */}
      <motion.div
        className="bg-card rounded-xl border shadow-sm p-6 space-y-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-sm font-semibold">Branding Assets</h2>
        <p className="text-xs text-muted-foreground">Upload your logo, company stamp, and signature. These will appear on your invoices.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {imageFields.map((img) => {
            const currentUrl = profile?.[img.field] as string | null;
            return (
              <div key={img.field} className="space-y-3">
                <div className="flex items-center gap-2">
                  <img.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{img.label}</span>
                </div>

                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] bg-muted/20">
                  {currentUrl ? (
                    <div className="relative group">
                      <img src={currentUrl} alt={img.label} className="max-h-[80px] max-w-full object-contain" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(img.field)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                      <p className="text-[10px] text-muted-foreground text-center">{img.description}</p>
                    </>
                  )}
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, img.field, img.folder)}
                  />
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs cursor-pointer" asChild>
                    <span><Upload className="h-3 w-3" /> {currentUrl ? "Replace" : "Upload"}</span>
                  </Button>
                </label>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
