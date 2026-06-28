import OpenAI from 'openai';
import config from '../../config/index.js';
import { InterviewSession, InterviewQuestion, Job, User } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class InterviewAgent {
  async execute(agent, inputData) {
    const { jobId, candidateId, interviewType = 'mixed', difficulty = 'intermediate' } = inputData;
    
    const job = jobId ? await Job.findByPk(jobId) : null;
    const user = await User.findByPk(candidateId || agent.candidateId, {
      include: ['candidateProfile']
    });

    if (!user) {
      throw new Error('User not found');
    }

    const questions = await this.generateInterviewQuestions(job, user, interviewType, difficulty);
    
    const session = await InterviewSession.create({
      candidateId: user.id,
      jobId: job?.id || null,
      interviewType,
      difficultyLevel: difficulty,
      status: 'pending',
      totalQuestions: questions.length,
      currentQuestionIndex: 0
    });

    for (let i = 0; i < questions.length; i++) {
      await InterviewQuestion.create({
        interviewSessionId: session.id,
        question: questions[i].question,
        questionType: questions[i].type,
        difficultyLevel: difficulty,
        expectedAnswer: questions[i].expectedAnswer,
        orderIndex: i
      });
    }

    return {
      session: session.toJSON(),
      questions: questions
    };
  }

  async generateInterviewQuestions(job, user, type, difficulty) {
    const jobContext = job 
      ? `Job Title: ${job.title}\nJob Description: ${job.description}\nRequirements: ${job.requirements?.join(', ')}`
      : 'General interview questions';

    const userContext = `Candidate Name: ${user.firstName} ${user.lastName}\n${user.candidateProfile?.summary ? `Background: ${user.candidateProfile.summary}` : ''}`;

    let questionTypes = [];
    switch (type) {
      case 'behavioral':
        questionTypes = ['Tell me about a time when...', 'Describe a situation where...', 'Give me an example of...'];
        break;
      case 'technical':
        questionTypes = ['Explain...', 'How would you...', 'What is the difference between...'];
        break;
      default:
        questionTypes = ['behavioral', 'technical', 'situational'];
    }

    const prompt = `
      Generate 10 interview questions for the following context.
      
      ${jobContext}
      ${userContext}
      
      Interview Type: ${type}
      Difficulty: ${difficulty}
      
      Return a JSON array of:
      [{ question: string, type: 'behavioral'|'technical'|'coding'|'system_design'|'cultural', expectedAnswer: string }]
    `;

    const response = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }
}

export default InterviewAgent;
