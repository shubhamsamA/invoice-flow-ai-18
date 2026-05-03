ALTER TABLE public.restaurant_bills
ADD COLUMN show_upi_qr boolean NOT NULL DEFAULT true,
ADD COLUMN show_view_qr boolean NOT NULL DEFAULT true;