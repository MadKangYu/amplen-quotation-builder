-- Vercel Postgres Schema for AMPLEN Quotation Builder

CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  doc_number TEXT UNIQUE NOT NULL,
  customer_company TEXT,
  customer_name TEXT,
  customer_contact TEXT,
  customer_notes TEXT,
  products JSONB NOT NULL,
  total_qty INTEGER NOT NULL DEFAULT 0,
  total_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_doc_number ON quotations(doc_number);

-- Sample data (optional, for testing)
-- INSERT INTO quotations (doc_number, customer_company, products, total_qty, total_usd) 
-- VALUES ('КП-2026-0001', 'Test Company', '[{"id":1,"name":"Test","qty":1,"price":10}]'::jsonb, 1, 10.00);
