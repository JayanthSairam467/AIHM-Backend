import type { ClinicalScribeModel, GenerateSoapInput } from '../../../application/ports/ClinicalScribeModel.js';
import type { SoapNote } from '../../../domain/types.js';
import { GeminiClient } from './GeminiClient.js';
import { GeminiPromptBuilder } from './GeminiPromptBuilder.js';
import { GeminiResponseParser } from './GeminiResponseParser.js';

export class GeminiAdapter implements ClinicalScribeModel {
  private readonly client: GeminiClient;
  private readonly promptBuilder: GeminiPromptBuilder;
  private readonly responseParser: GeminiResponseParser;

  constructor(apiKey: string, private readonly model: string) {
    this.client = new GeminiClient(apiKey);
    this.promptBuilder = new GeminiPromptBuilder();
    this.responseParser = new GeminiResponseParser();
  }

  async generateSoap(input: GenerateSoapInput): Promise<SoapNote> {
    const prompt = this.promptBuilder.build(input);
    const rawResponse = await this.client.generateContent(prompt, this.model);
    return this.responseParser.parse(rawResponse);
  }
}
