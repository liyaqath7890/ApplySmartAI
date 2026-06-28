import { Application, Job, User, CoverLetter, Resume } from '../../routes/models/index.js';

class ApplicationAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId } = inputData;
    
    const job = await Job.findByPk(jobId);
    const user = await User.findByPk(candidateId || agent.candidateId);

    if (!job || !user) {
      throw new Error('Job or user not found');
    }

    const existing = await Application.findOne({
      where: { candidateId: user.id, jobId: job.id }
    });

    if (existing) {
      return { alreadyApplied: true, application: existing.toJSON() };
    }

    const coverLetter = await CoverLetter.findOne({
      where: { candidateId: user.id, jobId: job.id }
    });

    const resume = await Resume.findOne({
      where: { candidateId: user.id, isPrimary: true }
    });

    const application = await Application.create({
      candidateId: user.id,
      jobId: job.id,
      resumeId: resume?.id,
      coverLetterId: coverLetter?.id,
      status: 'applied',
      appliedAt: new Date()
    });

    return { application: application.toJSON(), success: true };
  }
}

export default ApplicationAgent;
