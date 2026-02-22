-- Review Audit Logs: tracks every review action for audit trail
CREATE TABLE IF NOT EXISTS review_audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_order_id VARCHAR NOT NULL REFERENCES work_orders(id),
  submission_id VARCHAR REFERENCES result_submissions(id),
  action VARCHAR NOT NULL, -- SUBMITTED, APPROVED, REJECTED, REVISION_REQUESTED
  performed_by VARCHAR REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE review_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit logs"
  ON review_audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON review_audit_logs FOR INSERT TO authenticated WITH CHECK (true);
