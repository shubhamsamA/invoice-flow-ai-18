import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, 
  Upload, 
  Loader2, 
  Trash2, 
  Building2, 
  Image as ImageIcon, 
  Stamp, 
  PenTool, 
  Landmark, 
  Lock,
  User,
  CreditCard,
  Shield,
  Palette,
  Bell,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "business" | "bank" | "branding" | "security";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
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

  const [bankForm, setBankForm] = useState({
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
    bank_branch: "",
    bank_upi_id: "",
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
    setBankForm({
      bank_account_name: (profile as any).bank_account_name || "",
      bank_account_number: (profile as any).bank_account_number || "",
      bank_ifsc: (profile as any).bank_ifsc || "",
      bank_name: (profile as any).bank_name || "",
      bank_branch: (profile as any).bank_branch || "",
      bank_upi_id: (profile as any).bank_upi_id || "",
    });
    setSynced(true);
  }

  const handleSave = async (data: any, type: "profile" | "bank") => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update(data).eq("user_id", user!.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`${type === "profile" ? "Profile" : "Bank details"} saved successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "stamp_url" | "signature_url",
    folder: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const loadingToast = toast.loading("Uploading image...");
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${folder}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("business-assets").upload(path, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
      const url = data.publicUrl;

      await supabase.from("profiles").update({ [field]: url }).eq("user_id", user!.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.dismiss(loadingToast);
      toast.success("Image updated");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Upload failed");
    }
  };

  const handleRemoveImage = async (field: "logo_url" | "stamp_url" | "signature_url") => {
    try {
      await supabase.from("profiles").update({ [field]: null }).eq("user_id", user!.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Image removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove image");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: any; description: string }[] = [
    { id: "profile", label: "Personal Profile", icon: User, description: "Manage your personal information" },
    { id: "business", label: "Business Details", icon: Building2, description: "Company info and tax details" },
    { id: "bank", label: "Bank Accounts", icon: Landmark, description: "Payment and settlement details" },
    { id: "branding", label: "Branding Assets", icon: Palette, description: "Logos, stamps and signatures" },
    { id: "security", label: "Security", icon: Shield, description: "Password and account safety" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-display">Settings</h1>
        <p className="text-muted-foreground font-serif italic text-lg">Manage your account settings and business preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold font-display rounded-lg transition-all duration-200 group",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1 text-left">{tab.label}</span>
                <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", activeTab === tab.id && "opacity-100")} />
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border shadow-sm overflow-hidden"
            >
              <div className="p-6 border-bottom bg-muted/30">
                <h2 className="text-xl font-bold font-display tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-sm text-muted-foreground font-serif italic">{tabs.find(t => t.id === activeTab)?.description}</p>
              </div>

              <div className="p-6">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="display_name" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Display Name</Label>
                        <Input 
                          id="display_name"
                          value={form.display_name} 
                          onChange={(e) => setForm({ ...form, display_name: e.target.value })} 
                          placeholder="Your full name" 
                          className="font-sans"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSave({ display_name: form.display_name }, "profile")} 
                      disabled={saving}
                      className="min-w-[120px]"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}

                {activeTab === "business" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business_name" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Business Name</Label>
                        <Input 
                          id="business_name"
                          value={form.business_name} 
                          onChange={(e) => setForm({ ...form, business_name: e.target.value })} 
                          placeholder="Acme Corp" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_email" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Business Email</Label>
                        <Input 
                          id="business_email"
                          type="email"
                          value={form.business_email} 
                          onChange={(e) => setForm({ ...form, business_email: e.target.value })} 
                          placeholder="billing@acme.com" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_phone" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Business Phone</Label>
                        <Input 
                          id="business_phone"
                          value={form.business_phone} 
                          onChange={(e) => setForm({ ...form, business_phone: e.target.value })} 
                          placeholder="+1 (555) 000-0000" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gst_number" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">GST / Tax ID</Label>
                        <Input 
                          id="gst_number"
                          value={form.gst_number} 
                          onChange={(e) => setForm({ ...form, gst_number: e.target.value })} 
                          placeholder="Tax Identification Number"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="business_address" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Business Address</Label>
                        <Input 
                          id="business_address"
                          value={form.business_address} 
                          onChange={(e) => setForm({ ...form, business_address: e.target.value })} 
                          placeholder="123 Business Way, Suite 100" 
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSave(form, "profile")} 
                      disabled={saving}
                      className="min-w-[120px]"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Business Details
                    </Button>
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_name" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Account Holder Name</Label>
                        <Input 
                          id="bank_account_name"
                          value={bankForm.bank_account_name} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_account_name: e.target.value })} 
                          placeholder="Full Name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_name" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Bank Name</Label>
                        <Input 
                          id="bank_name"
                          value={bankForm.bank_name} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} 
                          placeholder="Global Bank" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Account Number</Label>
                        <Input 
                          id="bank_account_number"
                          value={bankForm.bank_account_number} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_account_number: e.target.value })} 
                          placeholder="0000 0000 0000"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_ifsc" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">IFSC / Routing Code</Label>
                        <Input 
                          id="bank_ifsc"
                          value={bankForm.bank_ifsc} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_ifsc: e.target.value })} 
                          placeholder="BANK000123"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_branch" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Branch Name</Label>
                        <Input 
                          id="bank_branch"
                          value={bankForm.bank_branch} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_branch: e.target.value })} 
                          placeholder="Main Branch" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_upi_id" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">UPI ID (Optional)</Label>
                        <Input 
                          id="bank_upi_id"
                          value={bankForm.bank_upi_id} 
                          onChange={(e) => setBankForm({ ...bankForm, bank_upi_id: e.target.value })} 
                          placeholder="username@bank"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSave(bankForm, "bank")} 
                      disabled={saving}
                      className="min-w-[120px]"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Bank Details
                    </Button>
                  </div>
                )}

                {activeTab === "branding" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { id: "logo_url", label: "Business Logo", icon: ImageIcon, folder: "logo", desc: "Main logo for invoices" },
                      { id: "stamp_url", label: "Company Stamp", icon: Stamp, folder: "stamp", desc: "Official company seal" },
                      { id: "signature_url", label: "Signature", icon: PenTool, folder: "signature", desc: "Authorized signature" },
                    ].map((asset) => (
                      <div key={asset.id} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <asset.icon className="h-4 w-4 text-primary" />
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{asset.label}</Label>
                        </div>
                        <div className="relative group aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center overflow-hidden transition-colors hover:bg-muted/20">
                          {profile?.[asset.id as any] ? (
                            <>
                              <img 
                                src={profile[asset.id as any]} 
                                alt={asset.label} 
                                className="max-w-[80%] max-h-[80%] object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveImage(asset.id as any)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{asset.desc}</p>
                            </div>
                          )}
                        </div>
                        <label className="block">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, asset.id as any, asset.folder)} 
                          />
                          <Button variant="outline" className="w-full text-xs" asChild>
                            <span>
                              <Upload className="h-3 w-3 mr-2" />
                              {profile?.[asset.id as any] ? "Change Image" : "Upload Image"}
                            </span>
                          </Button>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="max-w-md space-y-6">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_password" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">New Password</Label>
                        <Input 
                          id="new_password"
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Confirm New Password</Label>
                        <Input 
                          id="confirm_password"
                          type="password" 
                          value={confirmNewPassword} 
                          onChange={(e) => setConfirmNewPassword(e.target.value)} 
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={changingPassword}
                        className="w-full"
                      >
                        {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        Update Password
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

