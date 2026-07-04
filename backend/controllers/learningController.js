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
  
  const systemPrompt = `Analyze skill gaps between a candidate's skills and the target job requirements.
  Return JSON with this schema:
  {
    "gaps": [
      {
        "skill": "string",
        "current": "none|beginner|intermediate|advanced|expert",
        "required": "beginner|intermediate|advanced|expert",
        "level": "low|medium|high|critical",
        "priority": 1-10,
        "resources": ["string"]
      }
    ],
    "summary": "string",
    "recommendations": ["string"]
  }`;

  const userPrompt = `User Skills: ${userSkills}
${job ? `Job Skills Required: ${jobSkills}\nJob Description: ${job.description}` : 'General career growth'}

Provide the skill gap analysis.`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

// AI-generate a full learning path based on candidate's skill gaps
export const generateRecommendedPath = async (req, res) => {
  try {
    const { targetRole, skillGaps } = req.body;
    const user = await User.findByPk(req.user.id, { include: ['skills', 'candidateProfile'] });

    const systemPrompt = `You are an expert career coach. Generate a comprehensive, structured learning path.
    Return JSON:
    {
      "title": "string",
      "targetRole": "string",
      "estimatedDuration": "string",
      "steps": [
        {
          "title": "string",
          "description": "string",
          "resourceType": "course|book|project|certification|tutorial",
          "resourceUrl": "string",
          "provider": "string",
          "estimatedHours": 10,
          "order": 1,
          "skillsCovered": ["string"]
        }
      ]
    }`;

    const userPrompt = `Candidate: ${user.firstName} ${user.lastName}
Current Skills: ${user.skills?.map(s => s.name).join(', ') || 'None'}
Experience Level: ${user.candidateProfile?.experienceLevel || 'mid'}
Target Role: ${targetRole || user.candidateProfile?.careerGoal || 'Senior Software Engineer'}
Skill Gaps to Address: ${(skillGaps || []).join(', ')}

Generate a practical learning path with real, available online resources.`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const pathData = JSON.parse(response.choices[0].message.content);
    
    // Persist the AI-generated path to the database
    const path = await LearningPath.create({
      candidateId: req.user.id,
      title: pathData.title,
      description: `AI-generated path for ${pathData.targetRole}`,
      goal: targetRole || 'Career Advancement',
      status: 'planning',
      aiGenerated: true
    });

    for (let i = 0; i < (pathData.steps || []).length; i++) {
      const step = pathData.steps[i];
      await LearningStep.create({
        learningPathId: path.id,
        title: step.title,
        description: step.description,
        resourceType: step.resourceType || 'course',
        resourceUrl: step.resourceUrl || '',
        estimatedDuration: step.estimatedHours || 10,
        orderIndex: step.order || i + 1
      });
    }

    res.status(201).json({ success: true, path, pathData });
  } catch (error) {
    console.error('Generate learning path error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getSkillGaps = async (req, res) => {
  try {
    const gaps = await SkillGap.findAll({
      where: { candidateId: req.user.id },
      order: [['priority', 'DESC']]
    });
    res.json({ success: true, gaps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
