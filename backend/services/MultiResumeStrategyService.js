import { generateAIResponse } from './openAiService.js';

class MultiResumeStrategyService {
  async generateTailoredResume(candidateProfile, job, skills, experience, education, projects) {
    const jobDescription = job.description || job.requirements?.join(', ') || '';
    
    if (!jobDescription) {
      throw new Error('Job description is missing.');
    }

    const systemPrompt = `You are an expert Executive Resume Writer and ATS Optimization AI. 
    You are given a candidate's profile, skills, experience, and education, and a target Job Description.
    Your goal is to rewrite the candidate's resume summary, experience bullet points, and highlight specific skills to perfectly align with the target job description while remaining 100% truthful.
    Do not invent experience. Reframe existing experience to highlight ATS keywords.

    Return the result strictly as a JSON object matching this schema:
    {
      "summary": "Tailored professional summary...",
      "skills": ["Highly relevant skill 1", "Relevant skill 2"],
      "experience": [
        {
          "company": "Company A",
          "title": "Role",
          "bullets": ["Tailored bullet 1", "Tailored bullet 2"]
        }
      ],
      "atsKeywords": ["keyword1", "keyword2"],
      "atsScore": 95
    }`;

    const userPrompt = `
    Job Description:
    ${jobDescription}

    Candidate Profile:
    Summary: ${candidateProfile?.summary}
    Skills: ${skills?.map(s => s.name || s).join(', ')}
    Experience: ${JSON.stringify(experience || [])}
    Education: ${JSON.stringify(education || [])}
    Projects: ${JSON.stringify(projects || [])}
    `;

    try {
      const response = await generateAIResponse(systemPrompt, userPrompt, true);
      const tailoredData = JSON.parse(response);
      return tailoredData;
    } catch (error) {
      console.error('Error generating tailored resume:', error);
      throw new Error('Failed to generate tailored resume');
    }
  }
}

export default new MultiResumeStrategyService();
