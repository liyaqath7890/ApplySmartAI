import { generateAIResponse } from './openAiService.js';
import {
  JobAnalysisV2,
  JobPrediction,
  CandidateProfile,
  Skill,
  ExternalJob,
  Job,
  User,
  WorkExperience,
  Education,
  Certification,
  CareerRoadmap
} from '../routes/models/index.js';
import RecommendationEngineV2 from './RecommendationEngineV2.js';

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
    // Fetch candidate details with all associations needed by RecommendationEngineV2
    const candidate = await User.findByPk(candidateId, {
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: Skill, as: 'skills' },
        { model: WorkExperience, as: 'workExperience' },
        { model: Education, as: 'education' },
        { model: Certification, as: 'certifications' },
        { model: CareerRoadmap, as: 'careerRoadmaps' }
      ]
    });
    
    if (!candidate) throw new Error('Candidate not found');
    const candidateProfile = candidate.candidateProfile;
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

    // Compute matching recommendations using upgraded Recommendation Engine V2
    const recommendation = await RecommendationEngineV2.evaluate(candidate, job);

    const matchResponse = {
      atsScore: recommendation.atsSuccessProbability,
      matchPercentage: recommendation.matchPercentage,
      missingSkills: recommendation.skillGap,
      strengths: recommendation.resumeImprovementSuggestions, // map suggestions as strengths for UI compatibility
      weaknesses: recommendation.skillGap,
      interviewProbability: recommendation.interviewProbability,
      recruiterResponseProbability: recommendation.offerProbability
    };

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
      estimatedSalary: job.salaryMax || job.salaryMin || 0,
      factors: { 
        strengths: recommendation.resumeImprovementSuggestions, 
        weaknesses: recommendation.skillGap,
        explanation: recommendation.explanation,
        learningRecommendations: recommendation.learningRecommendations
      }
    });

    // Update candidate profile AI Analysis
    const updatedAiAnalysis = {
      ...candidateProfile.aiAnalysis,
      lastMatchedJobId: jobId,
      lastMatchScore: matchResponse.matchPercentage,
      recentStrengths: recommendation.resumeImprovementSuggestions
    };
    await candidateProfile.update({
      atsScore: matchResponse.atsScore,
      aiAnalysis: updatedAiAnalysis
    });

    return {
      analysisRecord,
      matchResponse,
      jobAnalysisData,
      recommendation
    };
  }
}

export default new CandidateIntelligenceService();
