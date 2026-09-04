import { SoapNote } from '../../../domain/types.js';
import { ResponseParseError, SoapValidationError } from '../../../domain/errors.js';

export class GeminiResponseParser {
  parse(rawResponse: string): SoapNote {
    let parsed: any;
    try {
      // Remove markdown JSON formatting if present
      const cleaned = rawResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new ResponseParseError('Failed to parse Gemini response as JSON.');
    }

    this.validate(parsed);

    return parsed as SoapNote;
  }

  private validate(data: any): asserts data is SoapNote {
    const details: string[] = [];

    if (!data || typeof data !== 'object') {
      throw new SoapValidationError('Response is not a valid object.', ['Root must be an object']);
    }

    if (!data.subjective) details.push('Missing subjective section');
    if (!data.objective) details.push('Missing objective section');
    if (!data.assessment) details.push('Missing assessment section');
    if (!data.plan) details.push('Missing plan section');

    if (data.assessment && !['Low', 'Moderate', 'High', 'Critical'].includes(data.assessment.clinicalRiskTier)) {
      details.push(`Invalid clinicalRiskTier: ${data.assessment.clinicalRiskTier}`);
    }

    if (details.length > 0) {
      throw new SoapValidationError('Invalid SOAP note structure.', details);
    }
  }
}
