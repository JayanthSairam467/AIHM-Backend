import type { FhirBundleEntity } from '../types.js';

export interface CreateFhirBundleInput {
  id: string;
  sessionId: string;
  fhirVersion: string;
  resourceCount: number;
  bundle: Record<string, unknown>;
}

export interface FhirBundleRepository {
  create(input: CreateFhirBundleInput): Promise<FhirBundleEntity>;
  findBySessionId(sessionId: string): Promise<FhirBundleEntity | null>;
}
