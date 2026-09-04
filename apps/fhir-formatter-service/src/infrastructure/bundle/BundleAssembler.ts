import { randomUUID } from 'node:crypto';
import type { FhirBundle, FhirResource, FhirBundleEntry } from '../../domain/types.js';

export class BundleAssembler {
  assemble(resources: FhirResource[]): FhirBundle {
    const entries: FhirBundleEntry[] = resources.map((resource) => ({
      fullUrl: `urn:uuid:${resource.id}`,
      resource,
    }));

    return {
      resourceType: 'Bundle',
      id: randomUUID(),
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: entries,
    };
  }
}
