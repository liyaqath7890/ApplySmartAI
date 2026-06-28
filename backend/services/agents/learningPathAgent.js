import OpenAI from 'openai';
import config from '../../config/index.js';
import { LearningPath, LearningStep, SkillGap, User, Job } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class LearningPathAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId, skillGaps } = inputData;
    
    const job = jobId ? await Job.findByPk(jobId) : null;
    const user = await User.findByPk(candidateId || agent.candidateId);

    if (!user) {
      throw new Error('User not found');
    }

    const learningPath = await this.createLearningPath(user, job, skillGaps);
    return learningPath;
  }

  async createLearningPath(user, job, gaps) {
    const jobContext = job 
      ? `Target Job: ${job.title}\nDescription: ${job.description}`
      : 'General career growth';

    const prompt = `
      Create a structured learning path.
      
      User: ${user.firstName} ${user.lastName}
      ${jobContext}
      ${gaps ? `Skill Gaps to Address: ${JSON.stringify(gaps)}` : ''}
      
      Return JSON:
      {
        title: string,
        description: string,
        goal: string,
        durationWeeks: number,
        steps: [
          {
            title: string,
            description: string,
            resourceType: 'course'|'tutorial'|'book'|'video'|'project',
            estimatedHours: number,
            resources: [string],
            order: number
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const pathData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!pathData) {
      throw new Error('Failed to generate learning path');
    }

    const path = await LearningPath.create({
      candidateId: user.id,
      title: pathData.title,
      description: pathData.description,
      goal: pathData.goal,
      status: 'planning'
    });

    for (const step of pathData.steps) {
      await LearningStep.create({
        learningPathId: path.id,
        title: step.title,
        description: step.description,
        resourceType: step.resourceType,
        estimatedDuration: step.estimatedHours,
        orderIndex: step.order
      });
    }

    return path.toJSON();
  }
}

export default LearningPathAgent;
