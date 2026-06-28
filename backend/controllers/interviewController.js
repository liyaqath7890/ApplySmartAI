import { InterviewSession, InterviewQuestion, Job, User } from '../routes/models/index.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const createSession = async (req, res) => {
  try {
    const { jobId, interviewType, difficultyLevel } = req.body;
    
    const session = await InterviewSession.create({
      candidateId: req.user.id,
      jobId,
      interviewType: interviewType || 'mixed',
      difficultyLevel: difficultyLevel || 'intermediate',
      status: 'pending',
      totalQuestions: 10,
      currentQuestionIndex: 0
    });

    const job = jobId ? await Job.findByPk(jobId) : null;
    const user = await User.findByPk(req.user.id, { include: ['candidateProfile'] });
    
    const questions = await generateQuestions(job, user, interviewType, difficultyLevel);
    
    for (let i = 0; i < questions.length; i++) {
      await InterviewQuestion.create({
        interviewSessionId: session.id,
        question: questions[i].question,
        questionType: questions[i].type,
        difficultyLevel: difficultyLevel || 'intermediate',
        expectedAnswer: questions[i].expectedAnswer,
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
      feedback: feedback.feedback
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

async function generateQuestions(job, user, type, difficulty) {
  const jobContext = job 
    ? `Job Title: ${job.title}\nJob Description: ${job.description}` 
    : 'General interview';
  
  const userContext = `Candidate: ${user.firstName} ${user.lastName}`;
  
  const prompt = `Generate 10 interview questions. ${jobContext}. ${userContext}. Type: ${type}. Difficulty: ${difficulty}.
Return JSON array of {"question": string, "type": "behavioral"|"technical"|"coding"|"system_design"|"cultural", "expectedAnswer": string}.`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

async function evaluateAnswer(question, answer) {
  const prompt = `Evaluate this interview answer. Question: ${question.question}. Expected: ${question.expectedAnswer}. Answer: ${answer}.
Return JSON: {"score": 0-10, "feedback": string, "improvementTips": [string]}.`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  const content = response.choices[0].message.content;
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { score: 5, feedback: 'Answer evaluated' };
}
