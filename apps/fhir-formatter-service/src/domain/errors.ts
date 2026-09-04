export class FhirFormatterError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FhirFormatterError';
  }
}

export class MappingError extends FhirFormatterError {
  constructor(resourceType: string, message: string) {
    super(`Failed to map ${resourceType}: ${message}`, 'MAPPING_ERROR');
    this.name = 'MappingError';
  }
}

export class BundleValidationError extends FhirFormatterError {
  constructor(message: string, public readonly issues: string[]) {
    super(message, 'BUNDLE_VALIDATION_ERROR');
    this.name = 'BundleValidationError';
  }
}
