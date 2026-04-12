import { useState, useRef, useEffect } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  hsn_code: string | null;
  unit_price: number;
  unit: string | null;
  sku: string | null;
}

interface InventorySearchProps {
  onSelect: (item: { name: string; description: string; hsn_sac: string; price: number }) => void;
}

export default function InventorySearch({ onSelect }: InventorySearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, description, hsn_code, unit_price, unit, sku")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!user,
  });

  const filtered = query.trim()
    ? items.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        (i.sku && i.sku.toLowerCase().includes(query.toLowerCase())) ||
        (i.hsn_code && i.hsn_code.toLowerCase().includes(query.toLowerCase()))
      )
    : items;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: InventoryItem) => {
    onSelect({
      name: item.name,
      description: item.description || "",
      hsn_sac: item.hsn_code || "",
      price: item.unit_price,
    });
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-8 h-8 text-xs"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 10).map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors text-xs"
              onClick={() => handleSelect(item)}
            >
              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground truncate block">{item.name}</span>
                {item.sku && <span className="text-muted-foreground">SKU: {item.sku}</span>}
              </div>
              <span className="font-semibold text-primary shrink-0">
                ₹{item.unit_price.toLocaleString("en-IN")}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-3 text-center text-xs text-muted-foreground">
          No items found
        </div>
      )}
    </div>
  );
}
