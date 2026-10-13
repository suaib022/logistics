-- ==============================================================================
-- SETUP.SQL: Ciketo Logistics Claims & Evidence Storage Tables
-- ==============================================================================
-- IMPORTANT NOTE:
-- Please create a PRIVATE Supabase Storage bucket named "claims-evidence"
-- in your Supabase Dashboard under Storage -> New Bucket (Public bucket = OFF)
-- before running file upload workflows.
-- ==============================================================================

-- 1. Ensure pgcrypto extension is available for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  order_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  issue_type TEXT,
  claim_description TEXT NOT NULL,
  has_file_attachment BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-enrich customer details from orders table when order_id is provided
CREATE OR REPLACE FUNCTION public.fn_enrich_claim_from_order()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  IF NEW.order_id IS NOT NULL AND TRIM(NEW.order_id) <> '' THEN
    SELECT customer_name, email, phone
      INTO v_name, v_email, v_phone
      FROM public.orders
     WHERE order_id ILIKE TRIM(NEW.order_id)
     ORDER BY created_at DESC
     LIMIT 1;

    IF FOUND THEN
      IF NEW.customer_name IS NULL OR TRIM(NEW.customer_name) = '' THEN
        NEW.customer_name := v_name;
      END IF;
      IF NEW.customer_email IS NULL OR TRIM(NEW.customer_email) = '' THEN
        NEW.customer_email := v_email;
      END IF;
      IF NEW.customer_phone IS NULL OR TRIM(NEW.customer_phone) = '' THEN
        NEW.customer_phone := v_phone;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enrich_claim_from_order ON public.claims;
CREATE TRIGGER trg_enrich_claim_from_order
  BEFORE INSERT OR UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enrich_claim_from_order();

-- 3. Create the claim_attachments table
CREATE TABLE IF NOT EXISTS public.claim_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
  elevenlabs_file_id TEXT,
  original_filename TEXT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_claims_conversation_id ON public.claims(conversation_id);
CREATE INDEX IF NOT EXISTS idx_claim_attachments_claim_id ON public.claim_attachments(claim_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_attachments ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Service role full access on claims" ON public.claims;
DROP POLICY IF EXISTS "Service role full access on claim_attachments" ON public.claim_attachments;

-- Allow service_role (used by n8n backend) full CRUD access without public exposure
CREATE POLICY "Service role full access on claims"
  ON public.claims
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on claim_attachments"
  ON public.claim_attachments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No public (anon) policies created: tables are strictly private to backend agents.
