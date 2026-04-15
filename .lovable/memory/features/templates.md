---
name: Invoice Templates
description: 12 pre-built templates (Minimal, Corporate, Freelance, GST, Professional, Consulting, Creative, Services, Retail, Export, Proforma, Hourly) with schematic SVG thumbnails
type: feature
---
- 12 built-in templates defined in `src/lib/builtin-templates.ts`, each with `id`, `name`, `description`, and `elements` array
- `TemplateThumbnail` component in `src/components/TemplateThumbnail.tsx` renders schematic SVGs from element positions
- Template selection dialog uses 3-column grid with thumbnails on both CreateInvoice and EditInvoice pages
- Custom user templates also supported via `templates` DB table
