import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobPipelineStore } from '../store/jobPipelineStore';
import { applicationService } from '../api/services/applicationService';

// 1. Mock applicationService methods
vi.mock('../api/services/applicationService', () => {
  return {
    applicationService: {
      getPipeline: vi.fn().mockResolvedValue({
        data: {
          imported: [
            {
              id: 'app-123',
              title: 'React Dev',
              company: 'Vercel',
              status: 'imported',
              appliedAt: '2026-07-06T12:00:00Z',
              documentsUsed: { notes: 'Great match' }
            }
          ],
          resume_generated: [],
          cover_letter_generated: [],
          ready_to_apply: [],
          applied: [],
          assessment: [],
          interview_scheduled: [],
          interview_completed: [],
          hr_round: [],
          technical_round: [],
          final_round: [],
          offer: [],
          rejected: [],
          withdrawn: []
        },
        counts: { imported: 1 },
        total: 1
      }),
      updateStatus: vi.fn().mockResolvedValue({ success: true }),
      updateTrackingDetails: vi.fn().mockResolvedValue({ success: true }),
      saveJob: vi.fn().mockResolvedValue({ success: true })
    }
  };
});

describe('Zustand Job Pipeline Store Tests', () => {
  beforeEach(() => {
    // Reset state
    useJobPipelineStore.setState({
      applications: [],
      isLoading: false
    });
  });

  it('should fetch and map applications pipeline from API', async () => {
    const store = useJobPipelineStore.getState();
    await store.fetchPipeline();

    const updatedApplications = useJobPipelineStore.getState().applications;
    expect(updatedApplications.length).toBe(1);
    expect(updatedApplications[0].jobTitle).toBe('React Dev');
    expect(updatedApplications[0].companyName).toBe('Vercel');
    expect(updatedApplications[0].status).toBe('imported');
    expect(updatedApplications[0].notes).toBe('Great match');
  });

  it('should optimistically update application stage', async () => {
    useJobPipelineStore.setState({
      applications: [
        {
          id: 'app-123',
          status: 'imported',
          jobTitle: 'React Dev',
          companyName: 'Vercel',
          appliedDate: new Date()
        }
      ]
    });

    const store = useJobPipelineStore.getState();
    await store.updateApplicationStage('app-123', 'interview_scheduled');

    const updatedApplications = useJobPipelineStore.getState().applications;
    expect(updatedApplications[0].status).toBe('interview_scheduled');
    expect(applicationService.updateStatus).toHaveBeenCalledWith('app-123', 'interview_scheduled');
  });
});
