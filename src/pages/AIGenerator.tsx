import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AIDataExtractor } from "@/components/ai/AIDataExtractor";
import { AIDesignGenerator } from "@/components/ai/AIDesignGenerator";

export default function AIGeneratorPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          AI-Powered Tools
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display mb-4">
          Smart Invoice Generator
        </h1>
        <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
          Extract invoice data from text or generate complete invoice designs with AI.
        </p>
      </motion.div>

      <Tabs defaultValue="extract" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="extract" className="font-bold text-xs tracking-wide">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Data Extraction
          </TabsTrigger>
          <TabsTrigger value="design" className="font-bold text-xs tracking-wide">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Design Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extract">
          <AIDataExtractor navigate={navigate} />
        </TabsContent>

        <TabsContent value="design">
          <AIDesignGenerator navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
