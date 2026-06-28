import { generateAIResponse } from './openAiService.js';
import {
  JobAnalysisV2,
  JobPrediction,
  CandidateProfile,
  Skill,
  ExternalJob,
  Job
} from '../routes/models/index.js';

class CandidateIntelligenceService {
  /**
   * Parse Job Description and Extract Skills using OpenAI
   */
  async parseJobDescription(jobDescription) {
    const systemPrompt = `You are an expert technical recruiter and AI. Parse the following job description and extract the required skills, preferred skills, experience requirements, education requirements, and ATS keywords. Return the result strictly in JSON format matching this schema:
    {
      "requiredSkills": ["skill1", "skill2"],
      "preferredSkills": ["skill3"],
      "experienceRequirements": { "years": 3, "level": "mid" },
      "educationRequirements": { "degree": "Bachelor's" },
      "atsKeywords": ["keyword1", "keyword2"]
    }`;
    
    const response = await generateAIResponse(systemPrompt, jobDescription, true);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse AI response for JD', e);
      return { requiredSkills: [], preferredSkills: [], experienceRequirements: {}, educationRequirements: {}, atsKeywords: [] };
    }
  }

  /**
   * Perform an AI Match Analysis between a candidate's skills/profile and a job's requirements
   */
  async matchCandidateToJob(candidateId, jobId, isExternal = false) {
    // Fetch candidate details
    const candidateProfile = await CandidateProfile.findOne({ where: { user_id: candidateId } });
    if (!candidateProfile) throw new Error('Candidate profile not found');

    // Fetch Job details
    let job;
    if (isExternal) {
      job = await ExternalJob.findByPk(jobId);
    } else {
      job = await Job.findByPk(jobId);
    }
    if (!job) throw new Error('Job not found');

    const jobDescription = job.description || job.requirements?.join(', ') || '';
    if (!jobDescription) throw new Error('Job description is empty');

    // Extract structured data from JD
    const jobAnalysisData = await this.parseJobDescription(jobDescription);

    const systemPrompt = `You are an AI Career Coach evaluating a candidate against a job description. 
    Candidate Details:
    Headline: ${candidateProfile.headline}
    Summary: ${candidateProfile.summary}
    Experience: ${candidateProfile.experience} years, level: ${candidateProfile.experienceLevel}
    
    Job Requirements:
    ${JSON.stringify(jobAnalysisData)}
    
    Analyze the match. Provide an ATS compatibility score (0-100), Match Percentage (0-100), missing skills, strength analysis, weakness analysis, interview probability (0-100), and recruiter response probability (0-100).
    Return JSON format:
    {
      "atsScore": 85,
      "matchPercentage": 82,
      "missingSkills": ["skillX", "skillY"],
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "interviewProbability": 75.5,
      "recruiterResponseProbability": 60.0
    }`;

    const matchResponseStr = await generateAIResponse(systemPrompt, "Perform analysis.", true);
    let matchResponse;
    try {
      matchResponse = JSON.parse(matchResponseStr);
    } catch (e) {
      console.error('Failed to parse AI match response', e);
      matchResponse = {
        atsScore: 50, matchPercentage: 50, missingSkills: [], strengths: [], weaknesses: [], interviewProbability: 0, recruiterResponseProbability: 0
      };
    }

    // Store in JobAnalysisV2
    const analysisRecord = await JobAnalysisV2.create({
      candidateId,
      [isExternal ? 'externalJobId' : 'jobId']: jobId,
      requiredSkills: jobAnalysisData.requiredSkills,
      preferredSkills: jobAnalysisData.preferredSkills,
      experienceRequirements: jobAnalysisData.experienceRequirements,
      educationRequirements: jobAnalysisData.educationRequirements,
      atsKeywords: jobAnalysisData.atsKeywords,
      matchScore: matchResponse.matchPercentage,
      missingSkills: matchResponse.missingSkills,
      interviewProbability: matchResponse.interviewProbability,
      recruiterResponseProbability: matchResponse.recruiterResponseProbability
    });

    // Store in JobPrediction
    await JobPrediction.create({
      candidateId,
      [isExternal ? 'externalJobId' : 'jobId']: jobId,
      predictedMatchScore: matchResponse.matchPercentage,
      successProbability: matchResponse.interviewProbability,
      estimatedSalary: job.salaryMax || job.salaryMin || 0, // Mocked for now if unavailable
      factors: { strengths: matchResponse.strengths, weaknesses: matchResponse.weaknesses }
    });

    // Update candidate profile AI Analysis
    const updatedAiAnalysis = {
      ...candidateProfile.aiAnalysis,
      lastMatchedJobId: jobId,
      lastMatchScore: matchResponse.matchPercentage,
      recentStrengths: matchResponse.strengths
    };
    await candidateProfile.update({
      atsScore: matchResponse.atsScore,
      aiAnalysis: updatedAiAnalysis
    });

    return {
      analysisRecord,
      matchResponse,
      jobAnalysisData
    };
  }
}

export default new CandidateIntelligenceService();
