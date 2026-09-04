import type { ClinicalScribeModel, GenerateSoapInput } from '../ports/ClinicalScribeModel.js';
import type { SoapNote } from '../../domain/types.js';

export class GenerateSoapUseCase {
  constructor(private readonly scribeModel: ClinicalScribeModel) {}

  async execute(input: GenerateSoapInput): Promise<SoapNote> {
    return this.scribeModel.generateSoap(input);
  }
}
