import { InterviewSession, InterviewQuestion, Job, User } from '../routes/models/index.js';
import InterviewPrepAgent from '../services/agents/InterviewPrepAgent.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const createSession = async (req, res) => {
  try {
    const { jobId, interviewType, difficultyLevel, questionCount = 10, roles = [] } = req.body;
    
    const session = await InterviewSession.create({
      candidateId: req.user.id,
      jobId,
      interviewType: interviewType || 'mixed',
      difficultyLevel: difficultyLevel || 'intermediate',
      status: 'pending',
      totalQuestions: questionCount,
      currentQuestionIndex: 0
    });

    const job = jobId ? await Job.findByPk(jobId) : null;
    const user = await User.findByPk(req.user.id, { include: ['candidateProfile'] });
    
    const questions = await generateQuestions(job, user, interviewType, difficultyLevel, questionCount, roles);
    
    for (let i = 0; i < questions.length; i++) {
      await InterviewQuestion.create({
        interviewSessionId: session.id,
        question: questions[i].question,
        questionType: questions[i].type,
        difficultyLevel: difficultyLevel || 'intermediate',
        expectedAnswer: questions[i].expectedAnswer,
        hints: questions[i].hints || [],
        orderIndex: i
      });
    }

    res.status(201).json({ success: true, session, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findByPk(sessionId, {
      include: [
        { model: InterviewQuestion, as: 'questions', order: [['orderIndex', 'ASC']] },
        { model: Job, as: 'targetJob' }
      ]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { answer } = req.body;

    const question = await InterviewQuestion.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    const feedback = await evaluateAnswer(question, answer);
    await question.update({
      candidateAnswer: answer,
      score: feedback.score,
      feedback: feedback.feedback,
      improvementTips: feedback.improvementTips || []
    });

    const session = await InterviewSession.findByPk(sessionId);
    const allQuestions = await InterviewQuestion.findAll({ where: { interviewSessionId: sessionId } });
    const answeredCount = allQuestions.filter(q => q.candidateAnswer).length;
    const avgScore = allQuestions.filter(q => q.score).reduce((sum, q) => sum + q.score, 0) / Math.max(1, answeredCount);
    
    await session.update({
      currentQuestionIndex: answeredCount,
      overallScore: avgScore,
      status: answeredCount >= allQuestions.length ? 'completed' : 'in_progress'
    });

    res.json({ success: true, question, feedback, nextQuestion: answeredCount < allQuestions.length ? allQuestions[answeredCount] : null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.findAll({
      where: { candidateId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: Job, as: 'targetJob' }]
    });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getWeakAreas = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const sessions = await InterviewSession.findAll({
      where: { candidateId, status: 'completed' },
      include: [{ model: InterviewQuestion, as: 'questions' }]
    });

    if (!sessions.length) {
      return res.json({ success: true, weakAreas: [], message: 'Complete at least one interview session to identify weak areas.' });
    }

    // Aggregate all answered questions across sessions
    const allQuestions = sessions.flatMap(s => s.questions || []).filter(q => q.candidateAnswer);
    
    if (!allQuestions.length) {
      return res.json({ success: true, weakAreas: [], message: 'No answered questions found.' });
    }

    const systemPrompt = `You are an expert interview coach analyzing a candidate's performance across multiple interview sessions.
    Based on the question types, scores, and feedback provided, identify weak areas and provide improvement recommendations.
    Return JSON:
    {
      "weakAreas": [{ "topic": "string", "score": 0-10, "description": "string", "frequency": 1 }],
      "strengths": [{ "topic": "string", "score": 0-10, "description": "string" }],
      "recommendations": [{ "priority": "high|medium|low", "action": "string", "resource": "string" }],
      "overallTrend": "improving|declining|stable",
      "nextSteps": ["string"]
    }`;

    const questionsData = allQuestions.map(q => ({
      type: q.questionType,
      score: q.score,
      feedback: q.feedback
    }));

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this performance data: ${JSON.stringify(questionsData)}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, ...analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const QUESTION_TYPE_PROMPTS = {
  behavioral: 'Focus on STAR-method behavioral questions (Situation, Task, Action, Result). Cover teamwork, leadership, conflict resolution, and decision-making.',
  technical: 'Focus on technical knowledge, problem-solving, and programming concepts relevant to the job role.',
  hr: 'Focus on HR/culture-fit questions: career goals, salary expectations, strengths/weaknesses, motivation, and work style.',
  system_design: 'Focus on system design questions: scalability, databases, APIs, microservices, caching, and distributed systems.',
  coding: 'Focus on coding challenges, data structures, algorithms, and time/space complexity.',
  mixed: 'Include a balanced mix of behavioral, technical, and HR questions.'
};

async function generateQuestions(job, user, type = 'mixed', difficulty = 'intermediate', count = 10, roles = []) {
  const jobContext = job 
    ? `Job Title: ${job.title}\nJob Description: ${job.description}\nJob Requirements: ${job.requirements?.join(', ') || 'Not specified'}` 
    : 'General interview for a software engineering role';
  
  const userContext = user?.candidateProfile 
    ? `Candidate: ${user.firstName} ${user.lastName}, Headline: ${user.candidateProfile.headline || 'Not specified'}, Experience Level: ${user.candidateProfile.experienceLevel || 'mid'}`
    : `Candidate: ${user?.firstName} ${user?.lastName}`;

  const typeInstruction = QUESTION_TYPE_PROMPTS[type] || QUESTION_TYPE_PROMPTS.mixed;
  const rolesContext = roles.length > 0 ? `Focus especially on these question categories: ${roles.join(', ')}.` : '';

  const systemPrompt = `You are an expert technical interviewer. ${typeInstruction} ${rolesContext}
  Difficulty: ${difficulty}. Generate exactly ${count} high-quality interview questions.
  Return a valid JSON array with this exact format:
  [{"question": "string", "type": "behavioral|technical|hr|system_design|coding|cultural", "expectedAnswer": "string", "hints": ["string"]}]`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${jobContext}\n${userContext}` }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  // Handle both direct array and wrapped object
  return Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
}

async function evaluateAnswer(question, answer) {
  const systemPrompt = `You are an expert interview coach evaluating candidate answers. Be constructive and specific.
  Return JSON: {"score": 0-10, "feedback": "string", "improvementTips": ["string"], "keyPointsMissed": ["string"], "keyPointsCovered": ["string"]}`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Question: ${question.question}\nExpected Answer: ${question.expectedAnswer}\nCandidate Answer: ${answer}\n\nEvaluate this answer.` }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}


