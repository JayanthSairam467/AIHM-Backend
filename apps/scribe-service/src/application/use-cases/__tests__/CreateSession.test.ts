import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSession } from '../CreateSession.js';
import type { SessionRepository } from '../../../infrastructure/repositories/types.js';

describe('CreateSession Use Case', () => {
  let mockSessionRepo: ReturnType<typeof vi.fn>;
  let useCase: CreateSession;

  beforeEach(() => {
    mockSessionRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      incrementMessageCount: vi.fn(),
      findByPatientId: vi.fn(),
    } as unknown as typeof mockSessionRepo;
    
    useCase = new CreateSession(mockSessionRepo as unknown as SessionRepository);
  });

  it('should successfully create a new session', async () => {
    const input = {
      patientId: 'patient-123',
      practitionerId: 'prac-456',
      specialty: 'cardiology',
    };

    const mockCreatedSession = {
      id: 'session-uuid',
      patient_id: input.patientId,
      practitioner_id: input.practitionerId,
      status: 'active',
      specialty: input.specialty,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      patient_context: null
    };

    (mockSessionRepo.create as any).mockResolvedValue(mockCreatedSession);

    const result = await useCase.execute(input);

    expect(mockSessionRepo.create).toHaveBeenCalledTimes(1);
    const createCallArgs = (mockSessionRepo.create as any).mock.calls[0][0];
    
    expect(createCallArgs).toMatchObject({
      patientId: input.patientId,
      practitionerId: input.practitionerId,
      specialty: input.specialty,
    });
    
    expect(createCallArgs.id).toBeDefined();
    
    expect(result).toMatchObject({
      id: mockCreatedSession.id,
      patientId: input.patientId,
      practitionerId: input.practitionerId,
      specialty: input.specialty,
      status: 'active',
      messageCount: 0
    });
  });

  it('should throw an error if patientId is missing', async () => {
    const input = {
      patientId: '',
      practitionerId: 'prac-456',
    };
    await expect(useCase.execute(input)).rejects.toThrow();
  });
});
