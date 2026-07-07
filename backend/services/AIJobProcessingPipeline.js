import { generateAIResponse } from './openAiService.js';
import logger from '../utils/logger.js';

/**
 * AI Job Processing Pipeline
 * Automatically extracts structural and semantic metadata from job descriptions.
 */
export class AIJobProcessingPipeline {
  /**
   * Process a job and extract structural and semantic metadata.
   * @param {Object} jobRecord - ExternalJob Sequelize instance
   * @param {Object} candidate - Candidate Profile / User instance (optional)
   */
  async processJob(jobRecord, candidate = null) {
    logger.info(`[AIJobProcessingPipeline] Processing job ${jobRecord.id} - "${jobRecord.title}"`);

    const title = jobRecord.title || '';
    const description = jobRecord.description || '';
    const locationStr = jobRecord.location || '';

    // ── 1. Fast Rule-Based Metadata Extraction ─────────────────────────────────────
    const ruleMetadata = this.extractRuleBasedMetadata(title, description, locationStr);

    // Populate initial metadata on record
    jobRecord.workType = ruleMetadata.workType;
    jobRecord.internship = ruleMetadata.internship;
    jobRecord.fresherEligible = ruleMetadata.fresherEligible;
    jobRecord.experience = ruleMetadata.experience;
    jobRecord.education = ruleMetadata.education;
    jobRecord.city = ruleMetadata.city;
    jobRecord.state = ruleMetadata.state;
    jobRecord.country = ruleMetadata.country;
    jobRecord.department = ruleMetadata.department;

    if (ruleMetadata.salaryMin && !jobRecord.salaryMin) {
      jobRecord.salaryMin = ruleMetadata.salaryMin;
    }
    if (ruleMetadata.salaryMax && !jobRecord.salaryMax) {
      jobRecord.salaryMax = ruleMetadata.salaryMax;
    }

    // ── 2. AI Refinement & Matching (if Candidate is present) ────────────────────────
    if (candidate) {
      try {
        const aiResult = await this.runAIMatchAndAnalysis(jobRecord, candidate);
        if (aiResult) {
          jobRecord.matchScore = aiResult.matchPercentage || 0;
          jobRecord.missingSkills = aiResult.missingSkills || [];
          jobRecord.aiAnalysis = {
            explanation: aiResult.strengths?.join('\n') || '',
            matchDetails: aiResult,
            resumeSuggestions: aiResult.resumeSuggestions || [],
            coverLetterSuggestions: aiResult.coverLetterSuggestions || [],
            coverLetterStrategy: aiResult.coverLetterStrategy || '',
            skillGapAnalysis: aiResult.skillGapAnalysis || [],
            learningRecommendations: aiResult.learningRecommendations || [],
            interviewDifficulty: aiResult.interviewDifficulty || 'Medium',
            expectedInterviewRounds: aiResult.expectedInterviewRounds || 3,
            salaryInsight: aiResult.salaryInsight || '',
            hiringProbability: aiResult.hiringProbability || 'Medium'
          };
        }
      } catch (err) {
        logger.error(`[AIJobProcessingPipeline] AI Refinement failed for job ${jobRecord.id}: ${err.message}`);
      }
    }

    // Save updated record
    await jobRecord.save();
    logger.info(`[AIJobProcessingPipeline] Completed processing for job ${jobRecord.id}`);
    return jobRecord;
  }

  /**
   * Fast rule-based heuristics to extract basic metadata
   */
  extractRuleBasedMetadata(title, description, locationStr) {
    const textToScan = `${title} ${description}`.toLowerCase();
    
    // Remote detection
    let workType = 'on-site';
    if (textToScan.includes('remote') || textToScan.includes('work from home') || textToScan.includes('wfh')) {
      workType = 'remote';
    } else if (textToScan.includes('hybrid')) {
      workType = 'hybrid';
    }

    // Internship detection
    const internship = textToScan.includes('intern') || textToScan.includes('internship') || textToScan.includes('co-op');

    // Fresher friendly / Graduate Program detection
    const isGraduate = textToScan.includes('graduate program') || textToScan.includes('grad program') || textToScan.includes('graduate rotation');
    const fresherEligible = textToScan.includes('fresher') || textToScan.includes('entry level') || 
                            textToScan.includes('no experience') || isGraduate;

    // Experience detection
    let experience = 'Entry';
    const expMatch = textToScan.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (expMatch && expMatch[1]) {
      const years = parseInt(expMatch[1]);
      if (years >= 5) experience = 'Senior';
      else if (years >= 3) experience = 'Mid';
      else experience = 'Junior';
    }

    // Education extraction
    const education = [];
    if (textToScan.includes('bachelor') || textToScan.includes('b.s') || textToScan.includes('b.tech')) {
      education.push("Bachelor's");
    }
    if (textToScan.includes('master') || textToScan.includes('m.s') || textToScan.includes('m.tech')) {
      education.push("Master's");
    }
    if (textToScan.includes('phd') || textToScan.includes('ph.d') || textToScan.includes('doctorate')) {
      education.push("Ph.D.");
    }

    // Department detection
    let department = 'Engineering';
    if (textToScan.includes('marketing') || textToScan.includes('seo') || textToScan.includes('growth')) {
      department = 'Marketing';
    } else if (textToScan.includes('sales') || textToScan.includes('account executive')) {
      department = 'Sales';
    } else if (textToScan.includes('design') || textToScan.includes('ux') || textToScan.includes('ui')) {
      department = 'Design';
    } else if (textToScan.includes('product manager') || textToScan.includes('pm')) {
      department = 'Product';
    }

    // Location parsing
    let city = '', state = '', country = 'United States';
    if (locationStr) {
      const parts = locationStr.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        city = parts[0];
        state = parts[1];
        country = parts[2];
      } else if (parts.length === 2) {
        city = parts[0];
        state = parts[1];
      } else {
        city = parts[0];
      }
    }

    return {
      workType,
      internship,
      fresherEligible,
      experience,
      education,
      city,
      state,
      country,
      department
    };
  }

  /**
   * Run OpenAI to calculate Match metrics, suggestions, and skill gap
   */
  async runAIMatchAndAnalysis(jobRecord, candidate) {
    const candidateProfile = candidate.candidateProfile || {};
    const candidateSkills = candidate.skills || [];
    const skillsList = candidateSkills.map(s => s.name || s).join(', ');

    const systemPrompt = `You are an AI Job Matching Assistant. Analyze the candidate profile against the job description.
    Candidate Profile:
    - Headline: ${candidateProfile.headline || ''}
    - Summary: ${candidateProfile.summary || ''}
    - Experience Years: ${candidateProfile.experience || 0}
    - Skills: ${skillsList}

    Job Description:
    - Title: ${jobRecord.title}
    - Description: ${jobRecord.description}

    Compute:
    - Match Percentage (0 to 100)
    - ATS score (0 to 100)
    - Missing skills list
    - Strengths list
    - Resume improvement suggestions list
    - Cover letter strategy (detailed text explaining strategy)
    - Skill gap analysis list
    - Learning recommendations list (specific recommendations/courses)
    - Interview difficulty ("Easy", "Medium", "Hard")
    - Expected interview rounds (number e.g. 3 or 4)
    - Salary insight (text description comparing expected salary vs role)
    - Hiring probability ("Low", "Medium", "High")

    Output strictly in JSON:
    {
      "matchPercentage": 85,
      "atsScore": 80,
      "missingSkills": ["React Native", "Swift"],
      "strengths": ["Strong Node.js background", "Years of backend experience"],
      "resumeSuggestions": ["Add AWS serverless architectures", "Highlight SQL optimization"],
      "coverLetterStrategy": "Focus on the team's scale challenges, emphasize Postgres performance tuning, and highlight React Native experience.",
      "skillGapAnalysis": ["Take a React Native introductory course", "Build a small iOS demo project"],
      "learningRecommendations": ["React Native Basics - Udemy", "iOS Development Bootcamp - Coursera"],
      "interviewDifficulty": "Medium",
      "expectedInterviewRounds": 3,
      "salaryInsight": "The role matches average market salary. The candidate can negotiate in the higher percentile due to strong system design skills.",
      "hiringProbability": "High"
    }`;

    try {
      const responseText = await generateAIResponse(systemPrompt, "Perform analysis.", true);
      return JSON.parse(responseText);
    } catch (e) {
      logger.error(`[AIJobProcessingPipeline] Failed to parse AI Response: ${e.message}`);
      return null;
    }
  }
}

export default new AIJobProcessingPipeline();
