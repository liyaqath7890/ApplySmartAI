import { LearningPath, LearningStep, SkillGap, User, Job } from '../routes/models/index.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const analyzeSkillGaps = async (req, res) => {
  try {
    const { jobId } = req.body;
    const user = await User.findByPk(req.user.id, { include: ['skills', 'candidateProfile'] });
    const job = jobId ? await Job.findByPk(jobId, { include: ['requiredSkills'] }) : null;

    const gapAnalysis = await generateGapAnalysis(user, job);
    
    for (const gap of gapAnalysis.gaps) {
      await SkillGap.create({
        candidateId: user.id,
        jobId: job?.id || null,
        skillName: gap.skill,
        currentProficiency: gap.current,
        requiredProficiency: gap.required,
        gapLevel: gap.level,
        learningResources: gap.resources,
        priority: gap.priority
      });
    }

    res.json({ success: true, analysis: gapAnalysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLearningPath = async (req, res) => {
  try {
    const { title, description, goal, steps, jobId } = req.body;
    
    const path = await LearningPath.create({
      candidateId: req.user.id,
      title,
      description,
      goal,
      jobId,
      status: 'planning'
    });

    for (const step of steps) {
      await LearningStep.create({
        learningPathId: path.id,
        title: step.title,
        description: step.description,
        resourceType: step.resourceType,
        resourceUrl: step.resourceUrl,
        estimatedDuration: step.estimatedHours,
        orderIndex: step.order
      });
    }

    res.status(201).json({ success: true, path });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLearningPaths = async (req, res) => {
  try {
    const paths = await LearningPath.findAll({
      where: { candidateId: req.user.id },
      include: [{ model: LearningStep, as: 'steps', order: [['orderIndex', 'ASC']] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, paths });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStepProgress = async (req, res) => {
  try {
    const { stepId } = req.params;
    const { isCompleted } = req.body;

    const step = await LearningStep.findByPk(stepId);
    if (!step) {
      return res.status(404).json({ success: false, error: 'Step not found' });
    }

    await step.update({ isCompleted, completedAt: isCompleted ? new Date() : null });
    
    const path = await LearningPath.findByPk(step.learningPathId);
    const allSteps = await LearningStep.findAll({ where: { learningPathId: path.id } });
    const completed = allSteps.filter(s => s.isCompleted).length;
    const progress = Math.round((completed / allSteps.length) * 100);
    
    await path.update({
      progressPercentage: progress,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planning'
    });

    res.json({ success: true, step, path: { progressPercentage: progress, status: path.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function generateGapAnalysis(user, job) {
  const userSkills = user.skills?.map(s => s.name).join(', ') || 'None';
  const jobSkills = job?.requiredSkills?.map(s => s.name).join(', ') || 'Not specified';
  
  const prompt = `Analyze skill gaps.
User Skills: ${userSkills}
${job ? `Job Skills Required: ${jobSkills}\nJob Description: ${job.description}` : 'General career growth'}

Return JSON:
{
  "gaps": [
    {
      "skill": string,
      "current": "none"|"beginner"|"intermediate"|"advanced"|"expert",
      "required": "beginner"|"intermediate"|"advanced"|"expert",
      "level": "low"|"medium"|"high"|"critical",
      "priority": 1-10,
      "resources": [string]
    }
  ],
  "summary": string,
  "recommendations": [string]
}`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { gaps: [], summary: 'Analysis complete' };
}
