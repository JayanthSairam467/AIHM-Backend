import type { SessionRepository, FhirBundleRepository } from '../../infrastructure/repositories/types.js';
import { NotFoundError } from '../../domain/errors/index.js';

export class GetFhirBundle {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly fhirBundleRepo: FhirBundleRepository
  ) {}

  async execute(sessionId: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    const bundle = await this.fhirBundleRepo.findBySessionId(sessionId);
    if (!bundle) {
      throw new NotFoundError('FhirBundle for Session', sessionId);
    }

    return bundle;
  }
}
