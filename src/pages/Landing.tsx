import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  FileText,
  Zap,
  Palette,
  Shield,
  BarChart3,
  Plus,
  Globe,
  MousePointer2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useRef, useEffect } from "react";

const features = [
  {
    icon: Zap,
    title: "AI Generation",
    desc: "Describe your invoice in plain text and let AI fill in everything for you.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileText,
    title: "Pro Invoices",
    desc: "Polished, branded invoices in seconds.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    desc: "Full font and color control.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "GST Ready",
    desc: "Auto-fill bank and tax details.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Track your invoice history and activity at a glance.",
    color: "bg-primary/10 text-primary",
  },
];

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
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40"
      />
      <motion.div
        style={{ x: useTransform(blobX, (v) => -v), y: useTransform(blobY, (v) => -v) }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] opacity-30"
      />

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
};

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30" ref={containerRef}>
      <FloatingSVG />

      {/* Nav */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-12 h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl md:text-2xl font-display font-bold tracking-tighter uppercase">FLOW.</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-16">
            {[
              { label: "Capabilities", href: "#features" },
              { label: "Process", href: "#how-it-works" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground hover:text-primary transition-all relative group/link"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover/link:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center">
            <Link
              to="/auth"
              className="text-[11px] uppercase tracking-[0.4em] font-black text-foreground hover:text-primary transition-all duration-300 border border-border/40 px-8 py-3 rounded-full hover:bg-muted/50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-primary"
          style={{ width: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
        />
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-12 lg:pb-20 overflow-hidden border-b border-border/40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="grid lg:grid-cols-[1.1fr_0.9fr] gap-24 items-center"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 mb-12"
              >
                <div className="h-px w-12 bg-primary" />
                <span className="text-[11px] uppercase tracking-[0.3em] font-black text-primary">
                  AI-Driven Invoice Engine
                </span>
              </motion.div>

              <h1 className="editorial-title mb-12">
                Invoices <br />
                <span className="editorial-subtitle block mt-4 text-foreground/80">Crafted with Intelligence.</span>
              </h1>

              <div className="flex flex-col sm:flex-row items-start gap-12">
                <p className="text-xl text-muted-foreground max-w-md leading-relaxed font-medium">
                  The world's most sophisticated invoicing platform. Design, automate, and manage your professional
                  invoices in one high-performance interface.
                </p>
                <div className="flex flex-col gap-4">
                  <Button
                    size="lg"
                    className="h-16 px-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none text-xl font-display font-bold uppercase tracking-widest group"
                    asChild
                  >
                    <Link to="/auth">
                      Create Invoice
                      <Plus className="ml-4 group-hover:rotate-90 transition-transform" />
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>100% Free. No hidden fees.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <motion.div
                className="relative z-10 bg-card/40 backdrop-blur-2xl border border-border/60 p-1 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden group"
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 1 }}
              >
                <div className="bg-background/80 rounded-[1.9rem] md:rounded-[2.4rem] p-6 lg:p-14">
                  <div className="flex items-start justify-between mb-8 lg:mb-16">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-14 md:w-14 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <FileText className="h-5 w-5 md:h-7 md:w-7 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1">
                          Invoice No.
                        </div>
                        <div className="text-lg md:text-2xl font-display font-bold tracking-tight">#INV-2026-042</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1">
                        Status
                      </div>
                      <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 text-primary border border-primary/20 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                        <div className="h-1 w-1 md:h-1.5 md:w-1.5 bg-primary rounded-full animate-pulse" />
                        Draft
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8 mb-8 lg:mb-16">
                    <div className="grid grid-cols-2 gap-6 md:gap-12 border-b border-border/40 pb-6 md:pb-8">
                      <div>
                        <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2 md:mb-3">
                          Bill To
                        </div>
                        <div className="font-display font-bold text-base md:text-lg">Acme Corp.</div>
                        <div className="text-xs md:text-sm text-muted-foreground font-medium">San Francisco, CA</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2 md:mb-3">
                          Due Date
                        </div>
                        <div className="font-display font-bold text-base md:text-lg italic font-serif">
                          April 15, 2026
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {[
                        { label: "AI Strategy Consulting", qty: "12h", price: "₹120k", icon: Zap },
                        { label: "Custom UI Framework", qty: "1", price: "₹85k", icon: Palette },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-muted/50 rounded-lg md:rounded-xl flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                              <item.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover/item:text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-xs md:text-sm">{item.label}</div>
                              <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                Qty: {item.qty}
                              </div>
                            </div>
                          </div>
                          <div className="text-base md:text-lg font-display font-bold tracking-tight">{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 md:pt-10 border-t-2 border-primary/20 flex items-end justify-between">
                    <div>
                      <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1 md:mb-2">
                        Total Amount
                      </div>
                      <div className="text-3xl md:text-5xl font-display font-bold tracking-tighter text-primary">
                        ₹205,000
                      </div>
                    </div>
                    <motion.div
                      className="h-14 w-14 md:h-20 md:w-20 rounded-full border-2 md:border-4 border-primary/20 border-t-primary flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <FileText className="h-6 w-6 md:h-10 md:w-10 text-primary" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="hidden sm:flex absolute -top-12 -right-12 z-20 bg-background border border-border/60 p-4 rounded-2xl shadow-2xl items-center gap-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                    Custom Theme
                  </div>
                  <div className="text-sm font-bold">Applied</div>
                </div>
              </motion.div>

              <motion.div
                className="hidden sm:flex absolute -bottom-8 -left-8 z-20 bg-background border border-border/60 p-4 rounded-2xl shadow-2xl items-center gap-4"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                    AI Generation
                  </div>
                  <div className="text-sm font-bold">Ready</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Features */}
      <section id="features" className="py-12 lg:py-20 border-b border-border/40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-5xl lg:text-7xl  font-bold tracking-tighter uppercase mb-8">
                The Core <br />{" "}
                <span className="text-primary italic font-serif lowercase tracking-normal">Infrastructure.</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                Every tool you need to design and manage professional invoices, built into a single, cohesive interface.
              </p>
            </div>
            <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              <span>01 / Capabilities</span>
              <div className="h-px w-24 bg-border" />
              <span>08 / Modules</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-1 space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="group relative bg-card/20 border border-border/40 p-8 overflow-hidden hover:bg-primary/5 transition-all duration-500"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Decorative background number */}
                  <div className="absolute -top-4 -right-4 text-7xl font-display font-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                    0{i + 1}
                  </div>

                  <div className="flex items-start gap-6 relative z-10">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-primary/20">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-display font-bold tracking-tight uppercase group-hover:text-primary transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[240px]">
                        {f.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-2 relative">
              <motion.div
                className="bg-card/40 border border-border/40 p-1 rounded-[2rem] overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <div className="bg-background/80 backdrop-blur-sm rounded-[1.8rem] p-8 lg:p-12">
                  <div className="flex items-center justify-between mb-12 border-b border-border/40 pb-8">
                    <div>
                      <h3 className="text-3xl font-display font-bold tracking-tight uppercase mb-2">Visual Canvas</h3>
                      <p className="text-sm text-muted-foreground font-medium italic font-serif">Drag. Drop. Design.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5 bg-muted/50 p-1.5 rounded-full border border-border/40">
                        {["#85b894", "#3b82f6", "#f59e0b", "#ec4899"].map((color) => (
                          <motion.button
                            key={color}
                            className="h-5 w-5 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          />
                        ))}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Palette className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
                    <div className="space-y-4">
                      <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-6">
                        Elements
                      </div>
                      {[
                        { label: "Logo Frame", icon: Palette },
                        { label: "Client Details", icon: Globe },
                        { label: "Item Table", icon: BarChart3 },
                        { label: "Signature", icon: MousePointer2 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-muted/30 border border-border/40 rounded-xl cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors group"
                          whileHover={{ x: 5 }}
                          drag
                          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                          dragElastic={0.1}
                        >
                          <item.icon className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="relative aspect-square md:aspect-[4/3] bg-muted/20 border border-dashed border-border/60 rounded-2xl flex items-center justify-center group overflow-hidden">
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Plus className="h-12 w-12 text-primary/20" />
                      </motion.div>

                      <motion.div
                        className="bg-background shadow-2xl border border-border/40 p-4 md:p-6 rounded-xl w-48 md:w-64 rotate-3 absolute top-6 md:top-12 left-6 md:left-12"
                        animate={{ y: [0, -10, 0], rotate: [3, 5, 3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="h-6 md:h-8 w-16 md:w-24 bg-primary/10 rounded-md mb-4" />
                        <div className="space-y-2">
                          <div className="h-1.5 md:h-2 w-full bg-muted rounded" />
                          <div className="h-1.5 md:h-2 w-2/3 bg-muted rounded" />
                        </div>
                      </motion.div>

                      <motion.div
                        className="bg-primary shadow-2xl p-4 md:p-6 rounded-xl w-48 md:w-64 -rotate-2 absolute bottom-6 md:bottom-12 right-6 md:right-12 text-primary-foreground"
                        animate={{ y: [0, 10, 0], rotate: [-2, -4, -2] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      >
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-[6px] md:text-[8px] uppercase tracking-widest font-bold opacity-60 mb-1">
                              Total
                            </div>
                            <div className="text-xl md:text-2xl font-display font-bold">₹12,400</div>
                          </div>
                          <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 opacity-60" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stats - Redesigned as a Technical Dashboard */}
      <section className="py-12 lg:py-20 border-b border-border/40 bg-muted/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex items-center gap-4 mb-24">
            <div className="h-px w-12 bg-primary" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-black text-primary">
              System Performance Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-border/40 divide-x divide-y lg:divide-y-0 divide-border/40 bg-background/40 backdrop-blur-sm">
            {[
              { label: "Design Templates", value: "142", icon: Palette, trend: "+12% this month" },
              { label: "AI Generation Speed", value: "24ms", icon: Zap, trend: "Optimized" },
              { label: "Active Designers", value: "12,482", icon: Globe, trend: "Live Now" },
              { label: "Invoices Created", value: "2.4M", icon: FileText, trend: "99.9% Success" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="p-12 group hover:bg-primary/5 transition-colors relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    {stat.trend}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl md:text-7xl font-display font-bold tracking-tighter group-hover:text-primary transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                    {stat.label}
                  </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -bottom-4 -right-4 text-8xl font-display font-black opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                  0{i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive CTA - Redesigned as Editorial Hero */}
      <section className="py-12 lg:py-20 relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
          />
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M0 50 Q 25 0 50 50 T 100 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.05"
              animate={{ d: ["M0 50 Q 25 100 50 50 T 100 50", "M0 50 Q 25 0 50 50 T 100 50"] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M0 30 Q 25 80 50 30 T 100 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.05"
              animate={{ d: ["M0 30 Q 25 -20 50 30 T 100 30", "M0 30 Q 25 80 50 30 T 100 30"] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </svg>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px w-12 bg-primary" />
                <span className="text-[11px] uppercase tracking-[0.4em] font-black text-primary">
                  Final Call to Action
                </span>
              </div>
              <h2 className="text-7xl md:text-[10vw] font-display font-bold tracking-tighter uppercase leading-[0.85] mb-16">
                The Future <br />
                <span className="text-primary italic font-serif lowercase tracking-normal">is Flow.</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Button
                  size="lg"
                  className="h-24 px-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none text-2xl font-display font-bold uppercase tracking-widest group shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]"
                  asChild
                >
                  <Link to="/auth">
                    Start Designing
                    <Zap className="ml-4 group-hover:scale-125 transition-transform" />
                  </Link>
                </Button>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-2">Instant Access</div>
                  <div className="text-lg font-display font-bold italic font-serif">No credit card required.</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="aspect-square rounded-full border border-background/20 p-12 flex items-center justify-center relative">
                <motion.div
                  className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <div className="text-center space-y-4">
                  <div className="text-8xl font-display font-bold tracking-tighter">100%</div>
                  <div className="text-[12px] uppercase tracking-[0.3em] font-black text-primary">Free Forever</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dramatic Editorial Footer */}
      <footer className="py-12 lg:py-20 border-t border-border/40 bg-background relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-32 lg:gap-64 mb-40">
            <div className="space-y-16">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:rotate-12 transition-transform">
                  <FileText className="h-8 w-8 text-primary-foreground" />
                </div>
                <span className="text-5xl font-display font-bold tracking-tight">FLOW.</span>
              </Link>

              <h3 className="text-6xl md:text-8xl font-display font-bold tracking-tighter uppercase leading-[0.8] max-w-xl">
                The New <br />
                <span className="text-primary italic font-serif lowercase tracking-normal">Standard.</span>
              </h3>

              <div className="flex items-center gap-12">
                <div className="h-px w-24 bg-primary" />
                <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-sm">
                  Precision-engineered for the modern professional. Design with absolute freedom.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-end space-y-24">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.5em] font-black mb-10 text-primary/60">Product</h4>
                  <ul className="space-y-4">
                    {["AI Engine", "Themes", "GST", "Stats"].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-[13px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[11px] uppercase tracking-[0.5em] font-black mb-10 text-primary/60">Company</h4>
                  <ul className="space-y-4">
                    {["Story", "Legal", "Privacy", "Contact"].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-[13px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-12">
                <div className="flex items-center gap-8">
                  <a
                    href="#"
                    className="text-[11px] font-black tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    TWITTER
                  </a>
                  <a
                    href="#"
                    className="text-[11px] font-black tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    GITHUB
                  </a>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="group flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>Top</span>
                  <div className="h-10 w-10 rounded-full border border-border/40 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowLeft className="h-3 w-3 rotate-90 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[9px] uppercase tracking-[0.5em] font-black text-muted-foreground/30">
            <span>© {new Date().getFullYear()} FLOW INFRASTRUCTURE</span>
            <div className="flex items-center gap-4">
              <span>EST. 2026</span>
              <div className="h-1 w-1 bg-border rounded-full" />
              <span>BUILT WITH PRECISION</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
