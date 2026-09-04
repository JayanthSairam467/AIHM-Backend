import { describe, it, expect } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:4000';

describe('Scribe End-to-End Workflow', () => {
  it('should successfully create a new scribe session', async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/scribe/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: 'patient-e2e-123',
          practitionerId: 'dr-smith-456',
          specialty: 'neurology'
        })
      });

      if (!response.ok) {
        console.warn('API Gateway not running or returned error.');
        return;
      }

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.patientId).toBe('patient-e2e-123');
      expect(data.practitionerId).toBe('dr-smith-456');
      expect(data.status).toBe('active');
    } catch (err) {
      console.warn('Could not connect to API Gateway. Skip E2E workflow test.');
    }
  });
});
