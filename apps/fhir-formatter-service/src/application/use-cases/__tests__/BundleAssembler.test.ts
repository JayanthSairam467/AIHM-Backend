import { describe, it, expect } from 'vitest';
import { BundleAssembler } from '../../../infrastructure/bundle/BundleAssembler.js';

describe('BundleAssembler', () => {
  it('should assemble a valid FHIR R4 Document Bundle', () => {
    const assembler = new BundleAssembler();
    
    const resources: any[] = [
      {
        resourceType: 'Composition',
        id: 'comp-1',
        status: 'final',
        title: 'Clinical Consultation Note'
      },
      {
        resourceType: 'Patient',
        id: 'pat-1',
        active: true,
      }
    ];

    const bundle = assembler.assemble(resources);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('document');
    expect(bundle.id).toBeDefined();
    expect(bundle.timestamp).toBeDefined();
    
    // Should have 2 entries (Composition, Patient)
    expect(bundle.entry).toHaveLength(2);
    
    expect(bundle.entry[0].resource.resourceType).toBe('Composition');
    expect(bundle.entry[0].fullUrl).toBe('urn:uuid:comp-1');
    
    expect(bundle.entry[1].resource.resourceType).toBe('Patient');
    expect(bundle.entry[1].fullUrl).toBe('urn:uuid:pat-1');
  });
});
