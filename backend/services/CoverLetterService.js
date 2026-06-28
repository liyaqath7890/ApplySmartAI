import { generateAIResponse } from './openAiService.js';
import CareerProfileService from './CareerProfileService.js';
import { User, CandidateProfile, Skill, WorkExperience, Education, Certification, Resume } from '../routes/models/index.js';

class CoverLetterService {
  async generateCoverLetterContent(candidateId, job, customPrompt, tone = 'Professional', industry = 'Technology', templateType = 'Standard', feedback = '') {
    const unifiedProfile = await CareerProfileService.getUnifiedProfile(candidateId, {
      User, CandidateProfile, Skill, WorkExperience, Education, Certification, Resume
    });

    const jobDescription = job?.description || job?.requirements?.join(', ') || 'No job description provided.';
    
    let templateInstructions = '';
    if (templateType === 'Creative') templateInstructions = 'Use a creative, narrative-driven format that hooks the reader.';
    else if (templateType === 'Executive') templateInstructions = 'Use an executive format focusing heavily on business impact, metrics, and leadership.';
    else templateInstructions = 'Use a standard professional business letter format.';

    const systemPrompt = `You are an expert Executive Career Coach and Cover Letter Generator for the ${industry} industry. 
    Write a highly targeted, persuasive, and ATS-optimized cover letter.
    Use a ${tone} tone. Keep it concise, engaging, and truthful to the candidate's profile.
    Focus on mapping the candidate's specific skills and experience to the job requirements.
    Do not include placeholder text like [Company Name], infer it from the job data or omit gracefully.
    ${templateInstructions}`;

    const userPrompt = `
    Job Data:
    Title: ${job?.title || 'Unknown Title'}
    Company: ${job?.company || 'Unknown Company'}
    Description: ${jobDescription}

    Candidate Profile:
    Name: ${unifiedProfile.firstName} ${unifiedProfile.lastName}
    Headline: ${unifiedProfile.candidateProfile?.headline}
    Summary: ${unifiedProfile.candidateProfile?.summary}
    Skills: ${unifiedProfile.skills?.map(s => s.name || s).join(', ')}
    Experience: ${JSON.stringify(unifiedProfile.workExperience || [])}
    
    Custom User Instructions: ${customPrompt || 'None'}
    ${feedback ? `\n    PREVIOUS GENERATION FEEDBACK (incorporate this strictly): ${feedback}` : ''}
    
    Please write the cover letter now. Return ONLY the text of the cover letter.`;

    const content = await generateAIResponse(systemPrompt, userPrompt, false);
    return content;
  }
}

export default new CoverLetterService();
