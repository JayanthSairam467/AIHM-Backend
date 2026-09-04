import express from 'express';
import { SoapToPatientMapper } from './infrastructure/mappers/SoapToPatientMapper.js';
import { SoapToPractitionerMapper } from './infrastructure/mappers/SoapToPractitionerMapper.js';
import { SoapToEncounterMapper } from './infrastructure/mappers/SoapToEncounterMapper.js';
import { SoapToConditionMapper } from './infrastructure/mappers/SoapToConditionMapper.js';
import { SoapToMedicationRequestMapper } from './infrastructure/mappers/SoapToMedicationRequestMapper.js';
import { SoapToObservationMapper } from './infrastructure/mappers/SoapToObservationMapper.js';
import { SoapToCompositionMapper } from './infrastructure/mappers/SoapToCompositionMapper.js';
import { BundleAssembler } from './infrastructure/bundle/BundleAssembler.js';
import { FhirBundleValidator } from './infrastructure/validation/FhirBundleValidator.js';
import { FormatFhirBundle } from './application/use-cases/FormatFhirBundle.js';
import { createRouter } from './presentation/routes/index.js';

const port = process.env.FHIR_FORMATTER_SERVICE_PORT || 3002;

const patientMapper = new SoapToPatientMapper();
const practitionerMapper = new SoapToPractitionerMapper();
const encounterMapper = new SoapToEncounterMapper();
const conditionMapper = new SoapToConditionMapper();
const medicationMapper = new SoapToMedicationRequestMapper();
const observationMapper = new SoapToObservationMapper();
const compositionMapper = new SoapToCompositionMapper();
const bundleAssembler = new BundleAssembler();
const validator = new FhirBundleValidator();

const formatFhirBundle = new FormatFhirBundle(
  patientMapper,
  practitionerMapper,
  encounterMapper,
  conditionMapper,
  medicationMapper,
  observationMapper,
  compositionMapper,
  bundleAssembler,
  validator
);

const app = express();
app.use(express.json());

const router = createRouter(formatFhirBundle);
app.use('/', router);

app.listen(port, () => {
  console.log(`[FHIR Formatter Service] Listening on port ${port}`);
});
