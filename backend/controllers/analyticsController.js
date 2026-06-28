import { Analytics, Job, Application, User } from '../routes/models/index.js';
import { Op } from 'sequelize';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const getDashboardStats = async (req, res) => {
  try {
    const candidateId = req.user.id;
    
    // Import needed models
    const { InterviewSession, Resume } = await import('../routes/models/index.js');

    // Application stats by status
    const [totalApps, interviewCount, offerCount, rejectedCount, appliedCount] = await Promise.all([
      Application.count({ where: { candidateId } }),
      Application.count({ where: { candidateId, status: 'interview' } }),
      Application.count({ where: { candidateId, status: { [Op.in]: ['offer', 'accepted'] } } }),
      Application.count({ where: { candidateId, status: 'rejected' } }),
      Application.count({ where: { candidateId, status: 'applied' } }),
    ]);

    // Interview scores
    const completedSessions = await InterviewSession.findAll({
      where: { candidateId, status: 'completed' },
      attributes: ['overallScore'],
    });
    const avgInterviewScore = completedSessions.length
      ? completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedSessions.length
      : 0;

    // Resume ATS score (primary or most recent)
    const primaryResume = await Resume.findOne({
      where: { candidateId },
      order: [['createdAt', 'DESC']],
    });

    // Applications in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApps = await Application.count({
      where: { candidateId, createdAt: { [Op.gte]: thirtyDaysAgo } }
    });

    // Conversion rates
    const interviewRate = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0;
    const offerRate = interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0;

    const stats = {
      totalApplications: totalApps,
      applicationsByStatus: {
        applied: appliedCount,
        interview: interviewCount,
        offer: offerCount,
        rejected: rejectedCount
      },
      interviewConversionRate: interviewRate,
      offerConversionRate: offerRate,
      avgInterviewScore: Math.round(avgInterviewScore * 10) / 10,
      totalInterviewSessions: completedSessions.length,
      primaryResumeAtsScore: primaryResume?.atsScore || 0,
      applicationsLast30Days: recentApps
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSalaryPrediction = async (req, res) => {
  try {
    const { jobTitle, location, experience } = req.query;
    
    const prediction = await predictSalary(jobTitle, location, experience);
    
    const analytics = await Analytics.create({
      analyticsType: 'salary_prediction',
      data: prediction
    });

    res.json({ success: true, prediction, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMarketDemand = async (req, res) => {
  try {
    const { skill } = req.query;
    const demand = await analyzeMarketDemand(skill);
    
    res.json({ success: true, demand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSkillTrends = async (req, res) => {
  try {
    const trends = await getSkillTrendsData();
    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function predictSalary(title, location, experience) {
  const prompt = `Predict salary range. Job Title: ${title}, Location: ${location}, Experience: ${experience} years.
Return JSON: {"min": number, "max": number, "median": number, "currency": "USD", "factors": [string]}`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { min: 50000, max: 150000, median: 90000 };
}

async function analyzeMarketDemand(skill) {
  const prompt = `Analyze market demand for skill: ${skill}.
Return JSON: {"demand": "high"|"medium"|"low", "growth": "increasing"|"stable"|"decreasing", "averageSalary": number, "trendingRoles": [string], "geography": [string]}`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { demand: 'medium' };
}

async function getSkillTrendsData() {
  return {
    trending: ['AI/ML', 'Cloud Computing', 'Cybersecurity', 'Data Science', 'DevOps'],
    declining: ['Legacy Systems', 'Manual Testing'],
    emerging: ['Generative AI', 'Quantum Computing', 'Edge Computing']
  };
}
