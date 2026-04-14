import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, ArrowLeft, CheckCircle2, Zap, Palette, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const FloatingSVG = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const blobX = useTransform(springX, [0, 1920], [-100, 100]);
  const blobY = useTransform(springY, [0, 1080], [-100, 100]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10">
      <motion.div
        style={{ x: blobX, y: blobY }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-30"
      />
      <motion.div
        style={{ x: useTransform(blobX, (v) => -v), y: useTransform(blobY, (v) => -v) }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] opacity-20"
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        // Send login notification email
        supabase.functions.invoke('send-email', {
          body: {
            type: 'login_notification',
            to: email,
            data: { loginTime: new Date().toLocaleString() },
          },
        });
        navigate("/dashboard");
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        // Send welcome email
        supabase.functions.invoke('send-email', {
          body: {
            type: 'welcome',
            to: email,
            data: {
              name: displayName,
              loginUrl: `${window.location.origin}/auth`,
            },
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      // Send branded password reset email via Resend
      supabase.functions.invoke('send-email', {
        body: {
          type: 'password_reset',
          to: email,
          data: { resetUrl: `${window.location.origin}/reset-password` },
        },
      });
      toast.success("Password reset link sent! Check your email.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-hidden">
      <FloatingSVG />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">FLOW.</span>
        </Link>
        <Link
          to="/"
          className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-24 items-center">
          {/* Left Side: Editorial Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px w-12 bg-primary" />
              <span className="text-[11px] uppercase tracking-[0.3em] font-black text-primary">System Access</span>
            </div>

            <h1 className="text-7xl font-display font-bold tracking-tighter uppercase mb-12 leading-[0.9]">
              Design <br />
              <span className="text-primary italic font-serif lowercase tracking-normal">Without Limits.</span>
            </h1>

            <div className="space-y-8">
              {[
                { icon: Zap, title: "AI Generation", desc: "Instant invoice creation with plain text." },
                { icon: Palette, title: "Custom Themes", desc: "Complete control over your brand identity." },
                { icon: Shield, title: "GST Ready", desc: "Automated tax and bank detail handling." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Auth Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-card/40 backdrop-blur-2xl border border-border/40 p-1 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-background/80 rounded-[2.4rem] p-10 md:p-12">
                <div className="mb-12">
                  <h2 className="text-3xl font-display font-bold tracking-tight uppercase mb-2">
                    {isForgotPassword ? "Reset" : isLogin ? "Sign In" : "Sign Up"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium italic font-serif">
                    {isForgotPassword
                      ? "Enter your email to receive a reset link."
                      : isLogin
                        ? "Access your professional design workspace."
                        : "Join the next era of invoice design."}
                  </p>
                </div>

                {isForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-8">
                    <div className="space-y-3">
                      <Label
                        htmlFor="reset-email"
                        className="text-[10px] uppercase tracking-widest font-black text-muted-foreground"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-14 bg-muted/30 border-border/40 rounded-xl px-6 font-medium focus:ring-primary/20"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none text-lg font-display font-bold uppercase tracking-widest group"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Send Reset Link"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                      >
                        <ArrowLeft className="h-3 w-3" /> Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {!isLogin && (
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-[10px] uppercase tracking-widest font-black text-muted-foreground"
                        >
                          Display Name
                        </Label>
                        <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="h-14 bg-muted/30 border-border/40 rounded-xl px-6 font-medium focus:ring-primary/20"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-[10px] uppercase tracking-widest font-black text-muted-foreground"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-14 bg-muted/30 border-border/40 rounded-xl px-6 font-medium focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="password"
                          className="text-[10px] uppercase tracking-widest font-black text-muted-foreground"
                        >
                          Password
                        </Label>
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-primary transition-colors"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 bg-muted/30 border-border/40 rounded-xl px-6 font-medium focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-6">
                      <Button
                        type="submit"
                        className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none text-lg font-display font-bold uppercase tracking-widest group"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : isLogin ? "Sign In" : "Sign Up"}
                      </Button>

                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                          <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary hover:underline ml-2"
                          >
                            {isLogin ? "Sign Up" : "Sign In"}
                          </button>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest font-bold text-muted-foreground justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>100% Free. No hidden fees.</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Micro-copy */}
      <footer className="p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
          © {new Date().getFullYear()} FLOW INFRASTRUCTURE. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
