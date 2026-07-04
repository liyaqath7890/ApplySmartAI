import openAiService from './openAiService.js';
import { Company } from '../routes/models/index.js';
import logger from '../utils/logger.js';

class CompanyInsightService {
  constructor() {
    this.insightsCache = new Map(); // simple cache, key: companyId, value: { insights, fetchedAt }
    this.cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  async getInsights(companyId) {
    const cached = this.insightsCache.get(companyId);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTTL) {
      return cached.insights;
    }

    const company = await Company.findByPk(companyId);
    if (!company) throw new Error('Company not found');

    const prompt = `You are an expert tech recruiter and AI career coach. Analyze the following company and provide insights in JSON format.
    
    Company Name: ${company.name}
    Industry: ${company.industry || 'Unknown'}
    Description: ${company.description || 'Unknown'}
    Technologies Used: ${(company.technologiesUsed || []).join(', ')}
    Active Jobs: ${company.activeJobs}
    Remote Available: ${company.remoteAvailability ? 'Yes' : 'No'}
    Hybrid Available: ${company.hybridAvailability ? 'Yes' : 'No'}
    
    Respond STRICTLY with valid JSON matching this schema:
    {
      "cultureSummary": "A 2-sentence summary of the likely company culture.",
      "hiringTrends": "A 1-sentence analysis of their current hiring trend based on open jobs.",
      "skillDemand": ["Skill1", "Skill2", "Skill3"],
      "interviewDifficulty": "Easy | Medium | Hard",
      "hiringProbability": "Low | Medium | High",
      "salaryInsights": "A 1-sentence insight on typical salary for this industry."
    }`;

    try {
      let rawJson = await openAiService.generateAIResponse(
        'You are an expert tech recruiter and AI career coach.',
        prompt,
        true
      );
      
      // Clean up markdown block if exists
      if (rawJson.startsWith('\`\`\`json')) {
        rawJson = rawJson.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
      }
      
      // Fallback if dummy API key returns empty object
      if (rawJson === '{}' || !rawJson) {
        throw new Error('Empty fallback from OpenAI');
      }
      
      const insights = JSON.parse(rawJson);
      this.insightsCache.set(companyId, { insights, fetchedAt: Date.now() });
      return insights;
    } catch (err) {
      logger.error(`CompanyInsightService: Failed to generate insights for ${companyId} - ${err.message}`);
      // Fallback
      return {
        cultureSummary: `Fast-paced environment focusing on innovation in ${company.industry || 'technology'}.`,
        hiringTrends: company.activeJobs > 10 ? 'Currently expanding their team.' : 'Stable hiring pattern.',
        skillDemand: company.technologiesUsed && company.technologiesUsed.length > 0 ? company.technologiesUsed.slice(0, 3) : ['Communication', 'Problem Solving', 'Teamwork'],
        interviewDifficulty: 'Medium',
        hiringProbability: 'Medium',
        salaryInsights: 'Competitive salaries aligned with market rates.'
      };
    }
  }
}

export default new CompanyInsightService();
