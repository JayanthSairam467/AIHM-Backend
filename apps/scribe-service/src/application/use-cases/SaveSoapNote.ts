import type { SoapNoteRepository } from '@omniscribe/data-layer';
import crypto from 'crypto';

export class SaveSoapNote {
  constructor(private readonly soapNoteRepo: SoapNoteRepository) {}

  async execute(sessionId: string, soapData: any): Promise<any> {
    return await this.soapNoteRepo.create({
      id: crypto.randomUUID(),
      sessionId,
      subjective: soapData.subjective || {},
      objective: soapData.objective || {},
      assessment: soapData.assessment || {},
      plan: soapData.plan || {},
      source: 'gemini',
      version: 1
    });
  }
}
