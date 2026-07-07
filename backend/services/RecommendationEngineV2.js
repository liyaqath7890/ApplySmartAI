import logger from '../utils/logger.js';
import { generateAIResponse } from './openAiService.js';

/**
 * RecommendationEngineV2
 * Advanced matching algorithm evaluating complete candidate profile attributes vs jobs.
 */
export class RecommendationEngineV2 {
  /**
   * Evaluate a candidate profile against a job description.
   * @param {Object} candidate - User Sequelize instance loaded with associations
   * @param {Object} job - ExternalJob or Job instance
   */
  async evaluate(candidate, job) {
    const profile = candidate.candidateProfile || {};
    const candidateSkills = (candidate.skills || []).map(s => (s.name || s).toLowerCase());
    const candidateExps = candidate.workExperience || [];
    const candidateEds = candidate.education || [];
    const candidateCerts = candidate.certifications || [];
    const candidateRoadmaps = candidate.careerRoadmaps || [];

    // Extract preferences
    const prefCities = (profile.preferredCities || []).map(c => c.toLowerCase());
    const prefCountries = (profile.preferredCountries || []).map(c => c.toLowerCase());
    const remotePref = (profile.remoteAvailability || '').toLowerCase(); // e.g. 'remote', 'hybrid', 'on-site'
    const expectedSalaryMin = profile.expectedSalaryMin || 0;

    const jobTitle = (job.title || '').toLowerCase();
    const jobDesc = (job.description || '').toLowerCase();
    const jobLoc = (job.location || '').toLowerCase();
    const jobWT = (job.workType || 'on-site').toLowerCase();
    const jobSalMin = job.salaryMin || 0;

    // ── 1. Calculate Skill Score ───────────────────────────────────────────────
    let skillMatches = 0;
    const missingSkills = [];
    const jobRequiredSkills = (job.skills || job.requirements || []).map(s => s.toLowerCase());
    
    if (jobRequiredSkills.length > 0) {
      for (const skill of jobRequiredSkills) {
        if (candidateSkills.includes(skill)) {
          skillMatches++;
        } else {
          missingSkills.push(skill);
        }
      }
    } else {
      // Fallback: search description for candidate skills
      for (const skill of candidateSkills) {
        if (jobDesc.includes(skill)) {
          skillMatches++;
        }
      }
    }
    const skillScore = jobRequiredSkills.length > 0 
      ? (skillMatches / jobRequiredSkills.length) * 100 
      : (skillMatches > 0 ? Math.min(100, skillMatches * 10) : 50);

    // ── 2. Calculate Remote Match Score ──────────────────────────────────────────
    let remoteScore = 100;
    if (remotePref && jobWT) {
      if (remotePref === 'remote' && jobWT !== 'remote') remoteScore = 40;
      else if (remotePref === 'hybrid' && jobWT === 'on-site') remoteScore = 50;
      else if (remotePref === 'on-site' && jobWT === 'remote') remoteScore = 70;
    }

    // ── 3. Calculate Location Match Score ─────────────────────────────────────────
    let locationScore = 100;
    if (prefCities.length > 0 || prefCountries.length > 0) {
      const cityMatch = prefCities.some(c => jobLoc.includes(c));
      const countryMatch = prefCountries.some(c => jobLoc.includes(c));
      if (!cityMatch && !countryMatch) {
        locationScore = jobWT === 'remote' ? 90 : 30; // Remote job offsets location mismatch
      }
    }

    // ── 4. Calculate Salary Match Score ───────────────────────────────────────────
    let salaryScore = 100;
    if (expectedSalaryMin > 0 && jobSalMin > 0) {
      if (jobSalMin < expectedSalaryMin) {
        const pct = (jobSalMin / expectedSalaryMin);
        salaryScore = Math.max(10, Math.round(pct * 100));
      }
    }

    // ── 5. Combined Match Score ──────────────────────────────────────────────────
    const finalMatchScore = Math.round(
      (skillScore * 0.5) + 
      (remoteScore * 0.2) + 
      (locationScore * 0.15) + 
      (salaryScore * 0.15)
    );

    // Calculate probabilities
    const interviewProbability = Math.round(finalMatchScore * 0.85);
    const atsSuccessProbability = Math.round(skillScore * 0.95);
    const offerProbability = Math.round(finalMatchScore * 0.70);

    // Default suggestions & recommendations
    const learningRecommendations = missingSkills.map(s => `Learn and build a project with ${s}`);
    const resumeSuggestions = missingSkills.map(s => `Incorporate experience or training related to ${s} on your resume`);

    // AI refinement step if configured
    let aiMatch = null;
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      try {
        const systemPrompt = `You are a Career Engine AI. Evaluate this match and generate personalized learning roadmaps and resume tips.
        Candidate profile skills: ${candidateSkills.join(', ')}
        Job required skills: ${jobRequiredSkills.join(', ')}
        Missing skills: ${missingSkills.join(', ')}
        Job Title: ${job.title}

        Generate learning recommendations, resume improvements, and explain overall score in JSON:
        {
          "learningRecommendations": ["Detailed course or action"],
          "resumeSuggestions": ["Specific resume formatting/content tweak"],
          "explanation": "Why this match makes sense"
        }`;
        
        const responseText = await generateAIResponse(systemPrompt, "Synthesize recommendations.", true);
        aiMatch = JSON.parse(responseText);
      } catch (err) {
        logger.warn(`AI recommendations refinement skipped: ${err.message}`);
      }
    }

    return {
      matchPercentage: finalMatchScore,
      interviewProbability,
      atsSuccessProbability,
      offerProbability,
      skillGap: missingSkills,
      learningRecommendations: aiMatch?.learningRecommendations || learningRecommendations,
      resumeImprovementSuggestions: aiMatch?.resumeSuggestions || resumeSuggestions,
      explanation: aiMatch?.explanation || 'Match score computed based on skills, location, work type, and salary preferences.'
    };
  }
}

export default new RecommendationEngineV2();
