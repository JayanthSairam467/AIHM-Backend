-- OmniScribe Health Database Schema
-- Migration: 001_create_tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(255) NOT NULL,
  practitioner_id VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'completed', 'cancelled')),
  message_count INTEGER NOT NULL DEFAULT 0,
  patient_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('doctor', 'patient', 'nurse', 'system')),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  sequence_number INTEGER NOT NULL,
  category VARCHAR(20) CHECK (category IN ('symptom', 'medication', 'vital', 'diagnosis', 'general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, sequence_number)
);

-- 3. Clinical Records table
CREATE TABLE clinical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  record_type VARCHAR(30) NOT NULL CHECK (record_type IN ('transcript', 'clinical_entity', 'vital_sign')),
  content JSONB NOT NULL DEFAULT '{}',
  source_message_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('generate_soap', 'export_fhir')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. SOAP Notes table
CREATE TABLE soap_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  subjective JSONB NOT NULL,
  objective JSONB NOT NULL,
  assessment JSONB NOT NULL,
  plan JSONB NOT NULL,
  source VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FHIR Bundles table
CREATE TABLE fhir_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  fhir_version VARCHAR(10) NOT NULL DEFAULT 'R4',
  resource_count INTEGER NOT NULL DEFAULT 0,
  bundle JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_session_sequence ON messages(session_id, sequence_number);
CREATE INDEX idx_clinical_records_session_id ON clinical_records(session_id);
CREATE INDEX idx_tasks_session_id ON tasks(session_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_soap_notes_session_id ON soap_notes(session_id);
CREATE INDEX idx_soap_notes_session_version ON soap_notes(session_id, version DESC);
CREATE INDEX idx_fhir_bundles_session_id ON fhir_bundles(session_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to sessions
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
