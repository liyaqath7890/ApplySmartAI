import { CareerRoadmap, CareerMilestone, User } from '../routes/models/index.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const generateRoadmap = async (req, res) => {
  try {
    const { targetRole, currentRole, timelineYears } = req.body;
    const user = await User.findByPk(req.user.id, { include: ['candidateProfile'] });

    const roadmapData = await generateRoadmapData(user, targetRole, currentRole, timelineYears);
    
    const roadmap = await CareerRoadmap.create({
      candidateId: user.id,
      title: `Roadmap to ${targetRole}`,
      description: roadmapData.description,
      currentRole,
      targetRole,
      timelineYears: timelineYears || 3,
      status: 'active',
      progressPercentage: 0,
      aiGenerated: true
    });

    for (let i = 0; i < roadmapData.milestones.length; i++) {
      await CareerMilestone.create({
        careerRoadmapId: roadmap.id,
        title: roadmapData.milestones[i].title,
        description: roadmapData.milestones[i].description,
        milestoneType: roadmapData.milestones[i].type,
        targetDate: roadmapData.milestones[i].targetDate,
        orderIndex: i
      });
    }

    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await CareerRoadmap.findAll({
      where: { candidateId: req.user.id },
      include: [{ model: CareerMilestone, as: 'milestones', order: [['orderIndex', 'ASC']] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { isCompleted } = req.body;

    const milestone = await CareerMilestone.findByPk(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found' });
    }

    await milestone.update({ isCompleted, completedDate: isCompleted ? new Date() : null });
    
    const roadmap = await CareerRoadmap.findByPk(milestone.careerRoadmapId);
    const allMilestones = await CareerMilestone.findAll({ where: { careerRoadmapId: roadmap.id } });
    const completed = allMilestones.filter(m => m.isCompleted).length;
    const progress = Math.round((completed / allMilestones.length) * 100);
    
    await roadmap.update({
      progressPercentage: progress,
      status: progress === 100 ? 'completed' : 'active'
    });

    res.json({ success: true, milestone, roadmap: { progressPercentage: progress, status: roadmap.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function generateRoadmapData(user, targetRole, currentRole, years) {
  const prompt = `Create a career roadmap.
User: ${user.firstName} ${user.lastName}
Current Role: ${currentRole || 'Not specified'}
Target Role: ${targetRole}
Timeline: ${years || 3} years

Return JSON:
{
  "description": string,
  "milestones": [
    {
      "title": string,
      "description": string,
      "type": "skill"|"role"|"certification"|"project"|"networking",
      "targetDate": "YYYY-MM-DD"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { description: 'Career roadmap', milestones: [] };
}
