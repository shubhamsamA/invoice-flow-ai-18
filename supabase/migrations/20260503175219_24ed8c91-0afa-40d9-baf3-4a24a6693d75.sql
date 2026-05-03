ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_show_upi_qr boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS default_show_view_qr boolean NOT NULL DEFAULT true;