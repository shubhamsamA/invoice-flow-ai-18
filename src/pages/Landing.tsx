import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Zap, Palette, Shield, ArrowRight, Sparkles, BarChart3 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    desc: "Create polished, branded invoices in seconds with our drag-and-drop builder.",
  },
  {
    icon: Zap,
    title: "AI-Powered Generation",
    desc: "Describe your invoice in plain text and let AI fill in everything for you.",
  },
  {
    icon: Palette,
    title: "Custom Templates",
    desc: "Design reusable templates with full font, color, and layout customization.",
  },
  {
    icon: Shield,
    title: "Bank & GST Ready",
    desc: "Auto-fill bank details, GST numbers, and business info on every invoice.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    desc: "Track revenue, pending payments, and client activity at a glance.",
  },
  {
    icon: Sparkles,
    title: "PDF Export",
    desc: "Download pixel-perfect PDFs with your logo, stamp, and signature.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">InvoiceFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/auth">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Invoice Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Create Beautiful Invoices
              <br />
              <span className="text-primary">in Seconds</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Design professional invoices with a visual builder, generate them with AI, 
              and manage your business finances — all in one elegant platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                <Link to="/auth">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="#features">See Features</a>
              </Button>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-card border rounded-2xl shadow-2xl shadow-primary/5 p-8 max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Invoice</div>
                  <div className="text-xl font-bold mt-1">INV-001</div>
                </div>
                <div className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] px-3 py-1 rounded-full text-xs font-semibold uppercase">
                  Paid
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { item: "Website Redesign", amount: "₹45,000" },
                  { item: "Logo Design", amount: "₹12,000" },
                  { item: "SEO Optimization", amount: "₹8,000" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{row.item}</span>
                    <span className="font-medium tabular-nums">{row.amount}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-primary/20">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">₹65,000</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From AI generation to pixel-perfect exports — InvoiceFlow handles it all.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-card border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to Streamline Your Invoicing?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of freelancers and businesses who trust InvoiceFlow for effortless invoicing.
            </p>
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link to="/auth">
                Create Your First Invoice <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <FileText className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">InvoiceFlow</span>
          </div>
          <span>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
