import type { FhirBundle, FormatFhirInput, FhirResource } from '../../domain/types.js';
import { SoapToPatientMapper } from '../../infrastructure/mappers/SoapToPatientMapper.js';
import { SoapToPractitionerMapper } from '../../infrastructure/mappers/SoapToPractitionerMapper.js';
import { SoapToEncounterMapper } from '../../infrastructure/mappers/SoapToEncounterMapper.js';
import { SoapToConditionMapper } from '../../infrastructure/mappers/SoapToConditionMapper.js';
import { SoapToMedicationRequestMapper } from '../../infrastructure/mappers/SoapToMedicationRequestMapper.js';
import { SoapToObservationMapper } from '../../infrastructure/mappers/SoapToObservationMapper.js';
import { SoapToCompositionMapper } from '../../infrastructure/mappers/SoapToCompositionMapper.js';
import { BundleAssembler } from '../../infrastructure/bundle/BundleAssembler.js';
import { FhirBundleValidator } from '../../infrastructure/validation/FhirBundleValidator.js';

export class FormatFhirBundle {
  constructor(
    private readonly patientMapper: SoapToPatientMapper,
    private readonly practitionerMapper: SoapToPractitionerMapper,
    private readonly encounterMapper: SoapToEncounterMapper,
    private readonly conditionMapper: SoapToConditionMapper,
    private readonly medicationMapper: SoapToMedicationRequestMapper,
    private readonly observationMapper: SoapToObservationMapper,
    private readonly compositionMapper: SoapToCompositionMapper,
    private readonly bundleAssembler: BundleAssembler,
    private readonly validator: FhirBundleValidator
  ) {}

  execute(input: FormatFhirInput): FhirBundle {
    const patient = this.patientMapper.map(input);
    const practitioner = this.practitionerMapper.map(input);
    const encounter = this.encounterMapper.map(input, patient.id, practitioner.id);
    const conditions = this.conditionMapper.map(input, patient.id, encounter.id);
    const medications = this.medicationMapper.map(input, patient.id, encounter.id);
    const observations = this.observationMapper.map(input, patient.id, encounter.id);

    const resources: FhirResource[] = [
      patient,
      practitioner,
      encounter,
      ...conditions,
      ...medications,
      ...observations,
    ];

    const composition = this.compositionMapper.map(input, patient.id, practitioner.id, encounter.id, resources);
    
    // The Composition must be the first resource in a document bundle
    const allResources = [composition, ...resources];

    const bundle = this.bundleAssembler.assemble(allResources);
    
    this.validator.validate(bundle);

    return bundle;
  }
}
