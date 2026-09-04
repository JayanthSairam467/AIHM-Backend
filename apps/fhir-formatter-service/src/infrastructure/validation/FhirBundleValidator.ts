import type { FhirBundle } from '../../domain/types.js';
import { BundleValidationError } from '../../domain/errors.js';

export class FhirBundleValidator {
  validate(bundle: FhirBundle): void {
    const issues: string[] = [];

    if (bundle.type !== 'document') {
      issues.push("Bundle type must be 'document'");
    }

    if (!bundle.entry || bundle.entry.length === 0) {
      issues.push('Bundle must have entries');
      throw new BundleValidationError('Validation failed', issues);
    }

    const firstEntry = bundle.entry[0];
    if (!firstEntry || firstEntry.resource.resourceType !== 'Composition') {
      issues.push('First entry in document bundle must be a Composition');
    }

    const resourceTypes = new Set(bundle.entry.map((e: any) => e.resource.resourceType));
    const requiredTypes = ['Composition', 'Patient', 'Practitioner', 'Encounter'];
    for (const req of requiredTypes) {
      if (!resourceTypes.has(req)) {
        issues.push(`Bundle is missing required resource type: ${req}`);
      }
    }

    const allFullUrls = new Set(bundle.entry.map((e: any) => e.fullUrl));
    
    // Check all references in the bundle to see if they resolve to an entry
    const checkReferences = (obj: any, path: string) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.reference && typeof obj.reference === 'string') {
        if (!allFullUrls.has(obj.reference) && obj.reference.startsWith('urn:uuid:')) {
          issues.push(`Unresolved reference at ${path}: ${obj.reference}`);
        }
      }
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
          checkReferences(value, `${path}.${key}`);
        }
      }
    };

    bundle.entry.forEach((entry: any, index: number) => {
      checkReferences(entry.resource, `entry[${index}].resource`);
    });

    if (issues.length > 0) {
      throw new BundleValidationError('FHIR Bundle validation failed', issues);
    }
  }
}
