import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Users,
  PenTool,
  Sparkles,
  Settings,
  ArrowRight,
  X,
  Rocket,
} from "lucide-react";

const TOUR_KEY = "invoiceflow-tour-completed";

const steps = [
  {
    title: "Welcome to Invoice_Build!",
    description:
      "Let's take a quick tour so you know where everything is. This will only take a minute.",
    icon: Rocket,
    route: "/dashboard",
  },
  {
    title: "Dashboard",
    description:
      "This is your command center. See revenue stats, pending payments, and recent activity at a glance.",
    icon: LayoutDashboard,
    route: "/dashboard",
  },
  {
    title: "Create Invoices",
    description:
      "Go to Invoices to create, manage, and track all your invoices. You can also bulk-upload them.",
    icon: FileText,
    route: "/invoices",
  },
  {
    title: "Manage Clients",
    description:
      "Add and organize your clients here. Client details auto-fill when you create invoices.",
    icon: Users,
    route: "/clients",
  },
  {
    title: "Invoice Builder",
    description:
      "Design custom invoice layouts with our drag-and-drop builder. Save them as reusable templates.",
    icon: PenTool,
    route: "/invoices/builder",
  },
  {
    title: "AI Generator",
    description:
      "Use AI to extract data from existing invoices or generate beautiful invoice designs from a text prompt.",
    icon: Sparkles,
    route: "/ai-generator",
  },
  {
    title: "Business Profile",
    description:
      "Set up your business details, logo, bank info, and signature. These auto-populate on every invoice.",
    icon: Settings,
    route: "/settings",
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    // Only show on dashboard for first-time users
    if (!completed && location.pathname === "/dashboard") {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setShow(false);
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(steps[nextStep].route);
    } else {
      completeTour();
      navigate("/dashboard");
    }
  };

  const skip = () => {
    completeTour();
    navigate("/dashboard");
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md mx-4 bg-card border border-border rounded-lg p-8 shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={skip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                    ? "w-3 bg-primary/40"
                    : "w-3 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold font-mono tracking-tight mb-2">
            {step.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={skip}
              className="text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider transition-colors"
            >
              Skip Tour
            </button>
            <Button onClick={next} className="gap-2 font-mono uppercase text-xs">
              {isLast ? "Get Started" : "Next"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
