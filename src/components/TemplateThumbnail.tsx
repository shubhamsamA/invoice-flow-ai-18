import { getBuiltinTemplates } from "@/lib/builtin-templates";

/** Returns a mini schematic SVG representing the template layout */
export function TemplateThumbnail({ templateId }: { templateId: string }) {
  const templates = getBuiltinTemplates();
  const template = templates.find(t => t.id === templateId);
  if (!template) return null;

  const maxX = 640, maxY = 960;
  const s = (v: number, max: number, t: number) => (v / max) * t;

  return (
    <svg viewBox="0 0 160 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="120" rx="4" className="fill-muted/50" />
      {template.elements.map((el, i) => {
        const sx = s(el.x, maxX, 160);
        const sy = s(el.y, maxY, 120);
        const sw = s(el.width, maxX, 160);
        const sh = s(el.height, maxY, 120);

        let fill = "hsl(var(--muted-foreground) / 0.15)";
        let stroke = "none";

        switch (el.type) {
          case "text": fill = "hsl(var(--primary) / 0.3)"; break;
          case "logo": fill = "hsl(var(--primary) / 0.5)"; break;
          case "items-table": fill = "hsl(var(--muted-foreground) / 0.12)"; stroke = "hsl(var(--muted-foreground) / 0.2)"; break;
          case "total-summary": fill = "hsl(var(--primary) / 0.2)"; break;
          case "divider": fill = "hsl(var(--muted-foreground) / 0.25)"; break;
          case "signature": fill = "hsl(var(--muted-foreground) / 0.1)"; break;
          case "bank-details": fill = "hsl(var(--muted-foreground) / 0.08)"; break;
          case "stamp": fill = "hsl(var(--destructive) / 0.15)"; break;
          case "note": fill = "hsl(var(--primary) / 0.08)"; break;
        }

        return (
          <rect
            key={i}
            x={sx}
            y={sy}
            width={Math.max(sw, 2)}
            height={Math.max(sh, 1)}
            rx={1}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
}
