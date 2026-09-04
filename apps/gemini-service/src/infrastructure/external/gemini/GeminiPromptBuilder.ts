import type { GenerateSoapInput } from '../../../application/ports/ClinicalScribeModel.js';

export class GeminiPromptBuilder {
  build(input: GenerateSoapInput): string {
    let prompt = `You are an expert clinical medical scribe. Your task is to generate a comprehensive, structured SOAP note from the provided medical consultation transcript.

`;

    if (input.patientContext) {
      prompt += `Patient Background:\n`;
      if (input.patientContext.name) prompt += `- Name: ${input.patientContext.name}\n`;
      if (input.patientContext.age !== undefined) prompt += `- Age: ${input.patientContext.age}\n`;
      if (input.patientContext.sex) prompt += `- Sex: ${input.patientContext.sex}\n`;
      if (input.patientContext.mrn) prompt += `- MRN: ${input.patientContext.mrn}\n`;
      if (input.patientContext.allergies && input.patientContext.allergies.length > 0) {
        prompt += `- Allergies: ${input.patientContext.allergies.join(', ')}\n`;
      }
      if (input.patientContext.currentMedications && input.patientContext.currentMedications.length > 0) {
        prompt += `- Current Medications: ${input.patientContext.currentMedications.join(', ')}\n`;
      }
      prompt += `\n`;
    }

    if (input.specialty) {
      prompt += `Specialty Context: ${input.specialty}\n\n`;
    }

    prompt += `Instructions:
1. Subjective: Summarize the chief complaint, history of present illness (HPI), review of systems (ROS), and any reported medications or allergies mentioned in the transcript. Include the patient background if applicable.
2. Objective: Extract any vital signs, physical exam findings, and lab/diagnostic results mentioned or observed. Use standard medical terminology.
3. Assessment: Provide the primary diagnosis with its corresponding ICD-10 code. List any differential diagnoses. Provide a clinical rationale. Determine the clinical risk tier ('Low', 'Moderate', 'High', or 'Critical').
4. Plan: List prescribed medications with precise dosages, frequencies, and duration. Detail any diagnostic orders, patient education, follow-up instructions, and red flag warnings.
5. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping, no extra text.

Transcript:
"""
${input.transcript}
"""
`;

    return prompt;
  }
}
