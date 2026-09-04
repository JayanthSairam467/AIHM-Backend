import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateSoap } from '../GenerateSoap.js';
import type { SessionRepository, TaskRepository } from '../../../infrastructure/repositories/types.js';
import type { MessageQueuePort } from '../../ports/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';

describe('GenerateSoap Use Case', () => {
  let mockSessionRepo: any;
  let mockTaskRepo: any;
  let mockQueue: any;
  let useCase: GenerateSoap;

  beforeEach(() => {
    mockSessionRepo = {
      findById: vi.fn(),
    };
    
    mockTaskRepo = {
      create: vi.fn(),
    };
    
    mockQueue = {
      enqueueSoapGeneration: vi.fn(),
    };

    useCase = new GenerateSoap(
      mockSessionRepo as SessionRepository,
      mockTaskRepo as TaskRepository,
      mockQueue as MessageQueuePort
    );
  });

  it('should successfully trigger SOAP generation task', async () => {
    const input = { sessionId: 'session-123', specialty: 'cardiology', correlationId: 'corr-1' };
    
    mockSessionRepo.findById.mockResolvedValue({
      id: 'session-123',
    });
    
    // The use case calls randomUUID, we just return the object from our mock
    mockTaskRepo.create.mockImplementation(async (data: any) => ({
      id: data.id,
      status: 'pending'
    }));
    
    mockQueue.enqueueSoapGeneration.mockResolvedValue('job-789');

    const result = await useCase.execute(input);

    expect(mockSessionRepo.findById).toHaveBeenCalledWith('session-123');
    expect(mockTaskRepo.create).toHaveBeenCalled();
    
    // Capture the generated UUID from the mock calls
    const createdTaskId = mockTaskRepo.create.mock.calls[0][0].id;

    expect(mockQueue.enqueueSoapGeneration).toHaveBeenCalledWith({
      taskId: createdTaskId,
      sessionId: 'session-123',
      specialty: 'cardiology',
      correlationId: 'corr-1'
    });
    
    expect(result).toEqual({
      taskId: createdTaskId,
      jobId: 'job-789',
      status: 'pending'
    });
  });

  it('should throw NotFoundError if session does not exist', async () => {
    const input = { sessionId: 'session-123', correlationId: '1' };
    
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
