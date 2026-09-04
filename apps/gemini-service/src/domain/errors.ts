export class GeminiServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export class ProviderError extends GeminiServiceError {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

export class ResponseParseError extends GeminiServiceError {
  constructor(message: string) {
    super(message, 'RESPONSE_PARSE_ERROR');
    this.name = 'ResponseParseError';
  }
}

export class SoapValidationError extends GeminiServiceError {
  constructor(message: string, public readonly details: string[]) {
    super(message, 'SOAP_VALIDATION_ERROR');
    this.name = 'SoapValidationError';
  }
}
