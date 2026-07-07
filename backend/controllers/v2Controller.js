import AgentOrchestrator from '../services/agentOrchestrator.js';
import CareerTwinAgent from '../services/agents/CareerTwinAgent.js';
import RecruiterAgent from '../services/agents/RecruiterAgent.js';
import RejectionAnalysisAgent from '../services/agents/RejectionAnalysisAgent.js';
import OpportunityRadarAgent from '../services/agents/OpportunityRadarAgent.js';
import InterviewPrepAgent from '../services/agents/InterviewPrepAgent.js';
import LearningPathAgentV2 from '../services/agents/LearningPathAgentV2.js';
import { generateAIResponse } from '../services/openAiService.js';
import {
  CareerTwin,
  Recruiter,
  RecruiterInteraction,
  InterviewPreparation,
  JobPrediction,
  AgentMemory,
  User,
  CandidateProfile,
  Certification,
  WorkExperience,
  Education,
  Application,
  Interview,
  Skill
} from '../routes/models/index.js';

const orchestrator = new AgentOrchestrator();
orchestrator.registerAgent('careerTwinAgent', new CareerTwinAgent());
orchestrator.registerAgent('recruiterAgent', new RecruiterAgent());
orchestrator.registerAgent('rejectionAnalysisAgent', new RejectionAnalysisAgent());
orchestrator.registerAgent('opportunityRadarAgent', new OpportunityRadarAgent());
orchestrator.registerAgent('interviewPrepAgent', new InterviewPrepAgent());
orchestrator.registerAgent('learningPathAgentV2', new LearningPathAgentV2());

// Career Twin Endpoints
export const getCareerTwin = async (req, res) => {
  try {
    let careerTwin = await CareerTwin.findOne({ where: { candidateId: req.user.id } });
    if (!careerTwin) {
      careerTwin = await CareerTwin.create({ candidateId: req.user.id });
    }
    res.json({ success: true, careerTwin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCareerTwin = async (req, res) => {
  try {
    let careerTwin = await CareerTwin.findOne({ where: { candidateId: req.user.id } });
    if (!careerTwin) {
      careerTwin = await CareerTwin.create({ candidateId: req.user.id });
    }
    await careerTwin.update(req.body);
    res.json({ success: true, careerTwin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const analyzeWeaknesses = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const careerTwinAgent = orchestrator.getAgent('careerTwinAgent');
    const candidate = await User.findByPk(candidateId, {
      include: ['candidateProfile', 'skills', 'workExperience', 'education']
    });
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    
    const result = await careerTwinAgent.generateCareerTwin(candidate);
    res.json({ success: true, analysis: result.weaknessAnalysis, skillGapAnalysis: result.skillGapAnalysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGrowthRecommendations = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const careerTwinAgent = orchestrator.getAgent('careerTwinAgent');
    const candidate = await User.findByPk(candidateId, {
      include: ['candidateProfile', 'skills', 'workExperience', 'education']
    });
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    
    const result = await careerTwinAgent.generateCareerTwin(candidate);
    res.json({ success: true, recommendations: result.growthRecommendations, marketPositioning: result.marketPositioning });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Recruiter Endpoints
export const getRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.findAll({
      where: { candidateId: req.user.id },
      include: [
        { model: Company, as: 'companyDetails' },
        { model: Application, as: 'linkedApplication' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, recruiters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }
    await recruiter.update(req.body);
    res.json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }
    await recruiter.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Recruiter Interactions
export const getRecruiterInteractions = async (req, res) => {
  try {
    const where = { candidateId: req.user.id };
    if (req.query.recruiterId) where.recruiterId = req.query.recruiterId;
    const interactions = await RecruiterInteraction.findAll({ where, include: ['recruiter'] });
    res.json({ success: true, interactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRecruiterInteraction = async (req, res) => {
  try {
    const interaction = await RecruiterInteraction.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, interaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateOutreachMessage = async (req, res) => {
  try {
    const { recruiterId, role, channel = 'email' } = req.body;
    const candidate = await User.findByPk(req.user.id, { include: ['candidateProfile', 'skills'] });
    const recruiter = recruiterId ? await Recruiter.findByPk(recruiterId) : null;

    const OpenAI = (await import('openai')).default;
    const config = (await import('../config/index.js')).default;
    let message;

    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key') {
      try {
        const openai = new OpenAI({ apiKey: config.openai.apiKey });
        const systemPrompt = `You are an expert career coach writing a personalized recruiter outreach message.
        Write a concise, professional, and compelling outreach template. The channel format is: ${channel}.
        If channel is 'linkedin', make it extremely punchy (under 300 characters, no subject header, conversational).
        Return JSON format: {"subject": "string", "content": "string"}`;

        const userPrompt = `Candidate: ${candidate.firstName} ${candidate.lastName}
        Headline: ${candidate.candidateProfile?.headline || 'Software Engineer'}
        Skills: ${candidate.skills?.map(s => s.name).join(', ')}
        Recruiter: ${recruiter?.name || 'Hiring Manager'} at ${recruiter?.company || 'the company'}
        Role: ${role || 'Software Engineer'}
        Write a personalized outreach template.`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        message = JSON.parse(response.choices[0].message.content);
      } catch (aiError) {
        console.warn('AI outreach generation failed, falling back to templates:', aiError.message);
      }
    }

    if (!message) {
      const recruiterName = recruiter?.name || 'Hiring Manager';
      const companyName = recruiter?.company || 'the team';
      const candidateName = `${candidate.firstName} ${candidate.lastName}`;
      const candidateTitle = candidate.candidateProfile?.headline || 'Software Engineer';
      const targetRole = role || 'Software Engineer';
      const techSkills = candidate.skills?.slice(0, 3).map(s => s.name).join(', ') || 'modern software engineering';

      if (channel === 'linkedin') {
        message = {
          subject: 'LinkedIn Connection Request',
          content: `Hi ${recruiterName}, saw you're hiring for ${targetRole} positions at ${companyName}. As a ${candidateTitle} skilled in ${techSkills}, I'd love to connect and share how my background aligns. Best, ${candidateName}.`
        };
      } else {
        message = {
          subject: `Interest in ${targetRole} opportunities at ${companyName} - ${candidateName}`,
          content: `Hi ${recruiterName},\n\nI hope you're having a great week.\n\nI recently came across the ${targetRole} position at ${companyName} and was immediately drawn to it. As a ${candidateTitle} specializing in ${techSkills}, I've spent the past few years building high-performing, scalable applications.\n\nI'd love to connect and share more about how my experience matches what you are looking for at ${companyName}. I have attached my resume for your review.\n\nThanks so much for your time and consideration.\n\nBest regards,\n\n${candidateName}\n${candidate.email}`
        };
      }
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Networking Contact Endpoints
export const getNetworkingContacts = async (req, res) => {
  try {
    const contacts = await NetworkingContact.findAll({
      where: { candidateId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNetworkingContact = async (req, res) => {
  try {
    const contact = await NetworkingContact.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNetworkingContact = async (req, res) => {
  try {
    const contact = await NetworkingContact.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    await contact.update(req.body);
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNetworkingContact = async (req, res) => {
  try {
    const contact = await NetworkingContact.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    await contact.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Daily AI Career Coach Endpoints
export const getDailyCoachPlan = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    let report = await CoachReport.findOne({
      where: { candidateId, date: today, type: 'daily' }
    });

    if (report) {
      return res.json({ success: true, report });
    }

    const candidate = await User.findByPk(candidateId, {
      include: ['candidateProfile', 'skills', 'workExperience', 'education', 'certifications']
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const [applications, savedCompanies, learningPaths] = await Promise.all([
      Application.findAll({ where: { candidateId } }),
      Company.findAll({
        include: [{ model: CandidateProfile, as: 'savedCompaniesList', where: { userId: candidateId } }]
      }),
      LearningPath.findAll({ where: { candidateId } })
    ]);

    const localPlan = generateLocalCoachPlan(candidate, applications, savedCompanies, learningPaths);
    let planData = localPlan;

    const OpenAI = (await import('openai')).default;
    const config = (await import('../config/index.js')).default;
    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key') {
      try {
        const openai = new OpenAI({ apiKey: config.openai.apiKey });
        const systemPrompt = `You are a strict, top-tier Career Coach. You are generating today's actionable job search checklist and priorities based on candidate profile, application history, and skills. Return JSON: {
          "todayPriorities": ["string"],
          "jobsToApply": [{"title": "string", "company": "string", "matchScore": 88, "location": "string", "salary": "string"}],
          "skillsToImprove": ["string"],
          "companiesToFollow": ["string"],
          "interviewPractice": "string",
          "resumeSuggestions": ["string"],
          "networkingSuggestions": ["string"],
          "dailyChecklist": [{"id": "string", "text": "string", "completed": false}],
          "weeklyReview": "string",
          "monthlyReview": "string"
        }`;

        const userPrompt = `
          Candidate: ${candidate.firstName} ${candidate.lastName}
          Headline: ${candidate.candidateProfile?.headline || ''}
          Skills: ${candidate.skills?.map(s => s.name).join(', ')}
          Applications count: ${applications.length}
          Saved companies count: ${savedCompanies.length}
          Learning paths: ${learningPaths.map(p => p.title).join(', ')}
        `;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        });

        planData = JSON.parse(response.choices[0].message.content);
      } catch (aiErr) {
        console.warn('AI Career Coach generation failed, utilizing heuristics fallback:', aiErr.message);
      }
    }

    report = await CoachReport.create({
      candidateId,
      type: 'daily',
      date: today,
      content: planData,
      checklist: planData.dailyChecklist || []
    });

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCoachChecklist = async (req, res) => {
  try {
    const { reportId, checklist } = req.body;
    const report = await CoachReport.findOne({ where: { id: reportId, candidateId: req.user.id } });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Coach report not found' });
    }
    await report.update({ checklist });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateLocalCoachPlan = (candidate, applications, savedCompanies, learningPaths) => {
  const name = candidate.firstName || 'Candidate';
  const skills = candidate.skills?.map(s => s.name) || [];
  const appCount = applications?.length || 0;
  
  const learningSkills = learningPaths?.map(lp => lp.title) || [];
  const skillToImprove = learningSkills[0] || (skills.includes('React') ? 'Next.js' : 'React');
  
  const companyToFollow = savedCompanies[0]?.name || 'Stripe';
  const jobTitle = candidate.candidateProfile?.headline || 'Software Engineer';

  const todayPriorities = [
    `Follow up on your applications at ${applications[0]?.companyName || 'your targets'}.`,
    `Spend 30 minutes learning ${skillToImprove} to close your current skill gaps.`,
    `Reach out to 1 new recruiter or connection on LinkedIn.`
  ];

  const jobsToApply = [
    { title: `${jobTitle}`, company: 'Linear', matchScore: 92, location: 'Remote', salary: '$120k - $150k' },
    { title: `Senior ${jobTitle}`, company: 'Notion', matchScore: 88, location: 'Hybrid', salary: '$140k - $170k' }
  ];

  const dailyChecklist = [
    { id: 'item-1', text: 'Review today\'s recommended jobs', completed: false },
    { id: 'item-2', text: `Complete 1 practice module for ${skillToImprove}`, completed: false },
    { id: 'item-3', text: `Check follow-ups due today`, completed: false },
    { id: 'item-4', text: 'Update resume if needed', completed: false }
  ];

  return {
    todayPriorities,
    jobsToApply,
    skillsToImprove: [skillToImprove, 'System Design', 'Cloud Architecture'],
    companiesToFollow: [companyToFollow, 'Linear', 'Vercel'],
    interviewPractice: `Focus on behavioral questions related to conflicts and leadership. Practice using the STAR method for your ${jobTitle} experience.`,
    resumeSuggestions: [
      `Tailor the skills section of your resume to highlight ${skillToImprove} in your bullet points.`,
      'Quantify the impact of your experience at your current/previous role.'
    ],
    networkingSuggestions: [
      `Connect with engineering leads at ${companyToFollow}.`,
      'Request a referral for the open role at Notion.'
    ],
    dailyChecklist,
    weeklyReview: `You submitted ${appCount} applications this week. Keep up the velocity!`,
    monthlyReview: 'Steady progress in application response rate. Keep sharpening system design prep.'
  };
};

// Smart Calendar Endpoints
export const getCalendarEvents = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const [interviews, recruiters, applications, contacts] = await Promise.all([
      Interview.findAll({ where: { candidateId } }),
      Recruiter.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } }),
      Application.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } }),
      NetworkingContact.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } })
    ]);

    const events = [];

    interviews.forEach(interview => {
      events.push({
        id: interview.id,
        title: `Interview: ${interview.company || 'Company'} - ${interview.type || 'Round'}`,
        start: interview.date || interview.createdAt,
        end: new Date(new Date(interview.date || interview.createdAt).getTime() + 60 * 60 * 1000).toISOString(),
        type: 'interview',
        description: interview.notes || `Interview scheduled for the ${interview.type || 'job'} role.`,
        status: interview.status || 'scheduled'
      });
    });

    recruiters.forEach(rec => {
      events.push({
        id: rec.id,
        title: `Follow Up: Recruiter ${rec.name} (${rec.company || 'Unknown'})`,
        start: rec.followUpDate,
        type: 'recruiter_follow_up',
        description: rec.notes || `Touch base with recruiter ${rec.name} about role.`,
        status: 'pending'
      });
    });

    applications.forEach(app => {
      events.push({
        id: app.id,
        title: `Application Review: ${app.recruiter || 'Hiring Team'}`,
        start: app.followUpDate,
        type: 'application_follow_up',
        description: `Follow up on your application status. Current: ${app.status}`,
        status: 'pending'
      });
    });

    contacts.forEach(contact => {
      events.push({
        id: contact.id,
        title: `Network Outreach: ${contact.name} (${contact.company || 'LinkedIn'})`,
        start: contact.followUpDate,
        type: 'networking_follow_up',
        description: contact.notes || `Catch up with ${contact.name} regarding referrals.`,
        status: 'pending'
      });
    });

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportCalendarIcs = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const [interviews, recruiters, applications, contacts] = await Promise.all([
      Interview.findAll({ where: { candidateId } }),
      Recruiter.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } }),
      Application.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } }),
      NetworkingContact.findAll({ where: { candidateId, followUpDate: { [sequelize.Sequelize.Op.ne]: null } } })
    ]);

    const events = [];

    interviews.forEach(i => {
      events.push({
        id: i.id,
        title: `Interview: ${i.company || 'Company'}`,
        start: i.date || i.createdAt,
        type: 'interview',
        description: i.notes || 'Interview session'
      });
    });

    recruiters.forEach(r => {
      events.push({
        id: r.id,
        title: `Follow Up: Recruiter ${r.name}`,
        start: r.followUpDate,
        type: 'recruiter_follow_up',
        description: `Touch base with ${r.name} (${r.company})`
      });
    });

    applications.forEach(a => {
      events.push({
        id: a.id,
        title: `Application Review`,
        start: a.followUpDate,
        type: 'application_follow_up',
        description: `Check status for applied role.`
      });
    });

    contacts.forEach(c => {
      events.push({
        id: c.id,
        title: `Outreach: ${c.name}`,
        start: c.followUpDate,
        type: 'networking_follow_up',
        description: `Follow up with ${c.name}`
      });
    });

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ApplySmartAI//CareerOS Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end || new Date(start.getTime() + 60 * 60 * 1000));
      
      const startStr = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endStr = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const stampStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${event.type}-${event.id}@career-os.com`);
      ics.push(`DTSTAMP:${stampStr}`);
      ics.push(`DTSTART:${startStr}`);
      ics.push(`DTEND:${endStr}`);
      ics.push(`SUMMARY:${event.title}`);
      ics.push(`DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`);
      ics.push('STATUS:CONFIRMED');
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    const icsString = ics.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="career-calendar.ics"');
    res.send(icsString);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Interview Preparation
export const getInterviewPreparation = async (req, res) => {
  try {
    let prep = await InterviewPreparation.findOne({
      where: { interviewId: req.params.interviewId, candidateId: req.user.id },
      include: ['interview']
    });
    if (!prep) {
      prep = await InterviewPreparation.create({
        interviewId: req.params.interviewId,
        candidateId: req.user.id
      });
    }
    res.json({ success: true, preparation: prep });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createInterviewPreparation = async (req, res) => {
  try {
    const prep = await InterviewPreparation.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, preparation: prep });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Job Predictions
export const getJobPredictions = async (req, res) => {
  try {
    const predictions = await JobPrediction.findAll({ where: { candidateId: req.user.id } });
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const predictJob = async (req, res) => {
  try {
    const prediction = await JobPrediction.create({
      candidateId: req.user.id,
      jobId: req.body.jobId,
      externalJobId: req.body.externalJobId,
      matchScore: Math.floor(Math.random() * 100),
      interviewProbability: Math.random() * 100,
      recruiterResponseProbability: Math.random() * 100,
      offerProbability: Math.random() * 100,
      explanation: {
        strengths: ['Strong JavaScript skills'],
        weaknesses: ['Limited cloud experience'],
        recommendations: ['Learn AWS basics']
      }
    });
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Analytics (Module 12)
export const getAnalytics = async (req, res) => {
  try {
    const [applicationsCount, interviewsCount, offersCount] = await Promise.all([
      Application.count({ where: { candidateId: req.user.id } }),
      Interview.count({ where: { candidateId: req.user.id } }),
      Application.count({ where: { candidateId: req.user.id, status: 'offer' } })
    ]);
    
    const applicationsTrend = [
      { name: 'Jan', applications: Math.max(0, applicationsCount - 5) },
      { name: 'Feb', applications: Math.max(0, applicationsCount - 3) },
      { name: 'Mar', applications: applicationsCount }
    ];

    const analytics = {
      applicationsCount,
      interviewsCount,
      offersCount,
      responseRate: applicationsCount > 0 ? Math.round((interviewsCount / applicationsCount) * 100) : 0,
      interviewRate: interviewsCount > 0 ? Math.round((offersCount / interviewsCount) * 100) : 0,
      offerRate: applicationsCount > 0 ? Math.round((offersCount / applicationsCount) * 100) : 0,
      applicationsTrend
    };
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Career Copilot (Module 13)
export const careerCopilotChat = async (req, res) => {
  try {
    const { message, path = '' } = req.body;
    const candidateId = req.user.id;

    // Fetch candidate details with profile and skills
    const candidate = await User.findByPk(candidateId, {
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: Skill, as: 'skills' }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const skillsList = candidate.skills?.map(s => s.name) || [];
    const headline = candidate.candidateProfile?.headline || 'Professional Job Seeker';
    const atsScore = candidate.candidateProfile?.atsScore || 70;

    const OpenAI = (await import('openai')).default;
    const config = (await import('../config/index.js')).default;
    const hasRealAI = config.openai.apiKey && config.openai.apiKey !== 'dummy-key' && config.openai.apiKey !== 'dummy-key-for-development';

    if (hasRealAI) {
      const systemPrompt = `You are a helpful, expert AI Career Copilot inside a Career Operating System.
      Candidate Details:
      - Name: ${candidate.firstName} ${candidate.lastName}
      - Headline: ${headline}
      - ATS Match Score: ${atsScore}%
      - Current Skills: ${skillsList.join(', ')}
      - Current App Workspace Section: ${path}

      Provide helpful, highly specific, and contextual career advice based on the user's message and workspace section. Use clean markdown formatting.`;

      const aiMsg = await generateAIResponse(systemPrompt, message);
      return res.json({ success: true, message: aiMsg });
    }

    // Dynamic Heuristics engine fallback
    let contextResponse = `Hi ${candidate.firstName}! As your Career Copilot, I'm tracking your profile as a **${headline}**. `;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('resume') || path.includes('resume')) {
      contextResponse += `To optimize your resume (currently at ${atsScore}% ATS compatibility), consider detailing projects featuring your top skills: **${skillsList.slice(0, 3).join(', ') || 'React/Node'}**.`;
    } else if (lowerMessage.includes('interview') || path.includes('interview') || path.includes('prep')) {
      contextResponse += `I recommend practicing STAR structures for technical behaviors. Focus on explaining the Situation, Task, Action, and specific metrics (Results) to stand out to recruiters.`;
    } else if (lowerMessage.includes('learn') || path.includes('learning')) {
      contextResponse += `Checking your skill gaps: we should target **System Design and Cloud Services** next. Try completing a practice module in your Learning tab.`;
    } else if (lowerMessage.includes('recruit') || path.includes('recruiter') || path.includes('crm')) {
      contextResponse += `You have logged outreach priorities. Remember to follow up with engaged contacts within 3 days. Use the template templates to generate cold intro formats.`;
    } else {
      contextResponse += `I've analyzed your profile and active pipelines. Focus on submitting at least 2 applications today, tracking recruiter followups, and keeping your skills checklists updated!`;
    }

    res.json({ success: true, message: contextResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
