import { Analytics, Job, Application, User } from '../routes/models/index.js';
import { Op } from 'sequelize';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const getDashboardStats = async (req, res) => {
  try {
    const { role } = req.user;
    let stats = {};

    if (role === 'candidate') {
      const applications = await Application.count({ where: { candidateId: req.user.id } });
      const interviews = await Application.count({ 
        where: { candidateId: req.user.id, status: 'interview' } 
      });
      
      stats = {
        applications,
        interviews,
        offers: 0,
        applicationRate: 0
      };
    } else if (role === 'recruiter') {
      const jobs = await Job.count({ where: { recruiterId: req.user.id } });
      const totalApps = await Application.count({
        include: [{ model: Job, as: 'job', where: { recruiterId: req.user.id } }]
      });
      
      stats = { jobs, totalApplications: totalApps };
    }

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
