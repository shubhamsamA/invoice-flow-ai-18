
-- Create restaurant_bills table
CREATE TABLE public.restaurant_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bill_number TEXT NOT NULL,
  table_number TEXT,
  server_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  service_charge_rate NUMERIC NOT NULL DEFAULT 0,
  service_charge_amount NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 5,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  tip NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own restaurant bills" ON public.restaurant_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own restaurant bills" ON public.restaurant_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own restaurant bills" ON public.restaurant_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own restaurant bills" ON public.restaurant_bills FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_restaurant_bills_updated_at
  BEFORE UPDATE ON public.restaurant_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create restaurant_bill_items table
CREATE TABLE public.restaurant_bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.restaurant_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.restaurant_bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bill items" ON public.restaurant_bill_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurant_bills WHERE restaurant_bills.id = restaurant_bill_items.bill_id AND restaurant_bills.user_id = auth.uid()));
CREATE POLICY "Users can insert own bill items" ON public.restaurant_bill_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM restaurant_bills WHERE restaurant_bills.id = restaurant_bill_items.bill_id AND restaurant_bills.user_id = auth.uid()));
CREATE POLICY "Users can update own bill items" ON public.restaurant_bill_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM restaurant_bills WHERE restaurant_bills.id = restaurant_bill_items.bill_id AND restaurant_bills.user_id = auth.uid()));
CREATE POLICY "Users can delete own bill items" ON public.restaurant_bill_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM restaurant_bills WHERE restaurant_bills.id = restaurant_bill_items.bill_id AND restaurant_bills.user_id = auth.uid()));
