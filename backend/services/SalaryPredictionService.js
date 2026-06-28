import OpenAI from 'openai';
import config from '../config/index.js';
import { User, Job, JobPrediction, WorkExperience } from '../routes/models/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class SalaryPredictionService {
  /**
   * Predict salary for a candidate for a specific job
   */
  async predictSalary(candidateId, jobId, experienceLevel) {
    try {
      const candidate = await User.findByPk(candidateId, {
        include: [
          { model: CandidateProfile, as: 'candidateProfile' },
          { model: WorkExperience, as: 'workExperience' }
        ]
      });

      const job = await Job.findByPk(jobId);

      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }

      // Get candidate's current salary if available
      const currentSalary = candidate.candidateProfile?.currentSalary;
      const expectedSalary = candidate.candidateProfile?.expectedSalary;
      
      // Calculate years of experience
      const yearsOfExperience = this.calculateYearsOfExperience(candidate.workExperience);
      
      // Get location
      const location = candidate.candidateProfile?.location || job.location;
      
      // Predict salary using AI
      const prediction = await this.generateSalaryPrediction({
        jobTitle: job.title,
        jobDescription: job.description,
        company: job.company,
        location,
        yearsOfExperience,
        currentSalary,
        expectedSalary,
        experienceLevel: experienceLevel || this.determineExperienceLevel(yearsOfExperience)
      });

      // Compare with job's salary range if available
      const jobSalaryRange = job.salaryRange;
      const comparison = jobSalaryRange ? this.compareWithJobRange(prediction, jobSalaryRange) : null;

      return {
        predictedSalary: prediction,
        jobSalaryRange,
        comparison,
        factors: {
          experienceLevel: experienceLevel || this.determineExperienceLevel(yearsOfExperience),
          yearsOfExperience,
          location,
          marketRate: prediction.marketRate || 'N/A'
        },
        negotiationRange: this.calculateNegotiationRange(prediction),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Salary prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate years of experience
   */
  calculateYearsOfExperience(workExperience) {
    if (!workExperience || workExperience.length === 0) return 0;

    return workExperience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  /**
   * Determine experience level from years
   */
  determineExperienceLevel(years) {
    if (years < 1) return 'entry';
    if (years < 3) return 'junior';
    if (years < 5) return 'mid';
    if (years < 8) return 'senior';
    if (years < 12) return 'lead';
    return 'executive';
  }

  /**
   * Generate salary prediction using AI
   */
  async generateSalaryPrediction(params) {
    try {
      const {
        jobTitle,
        jobDescription,
        company,
        location,
        yearsOfExperience,
        currentSalary,
        expectedSalary,
        experienceLevel
      } = params;

      const prompt = `
        Predict the appropriate salary range for this job candidate.
        
        Job Details:
        - Title: ${jobTitle}
        - Company: ${company || 'Not specified'}
        - Description: ${jobDescription || 'Not specified'}
        - Location: ${location}
        
        Candidate Details:
        - Years of Experience: ${yearsOfExperience}
        - Experience Level: ${experienceLevel}
        - Current Salary: ${currentSalary || 'Not specified'}
        - Expected Salary: ${expectedSalary || 'Not specified'}
        
        Provide:
        - Predicted salary range (min, max, median)
        - Market rate comparison (below/above/at market)
        - Confidence level (0-100)
        - Key factors influencing the prediction
        
        Return in JSON format:
        {
          "min": 80000,
          "max": 120000,
          "median": 100000,
          "marketRate": "at market",
          "confidence": 85,
          "factors": ["factor1", "factor2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultPrediction(experienceLevel);
    } catch (error) {
      logger.error(`AI salary prediction error: ${error.message}`);
      return this.getDefaultPrediction(experienceLevel);
    }
  }

  /**
   * Get default prediction based on experience level
   */
  getDefaultPrediction(experienceLevel) {
    const ranges = {
      entry: { min: 40000, max: 60000, median: 50000 },
      junior: { min: 55000, max: 80000, median: 67500 },
      mid: { min: 75000, max: 110000, median: 92500 },
      senior: { min: 100000, max: 150000, median: 125000 },
      lead: { min: 130000, max: 180000, median: 155000 },
      executive: { min: 160000, max: 250000, median: 205000 }
    };

    return ranges[experienceLevel] || ranges.mid;
  }

  /**
   * Compare predicted salary with job's salary range
   */
  compareWithJobRange(prediction, jobRange) {
    const { min: predMin, max: predMax, median: predMedian } = prediction;
    const { min: jobMin, max: jobMax } = jobRange;

    if (predMedian >= jobMin && predMedian <= jobMax) {
      return {
        status: 'within_range',
        message: 'Predicted salary is within job range',
        difference: 0
      };
    }

    if (predMedian < jobMin) {
      return {
        status: 'below_range',
        message: 'Predicted salary is below job range',
        difference: jobMin - predMedian,
        recommendation: 'negotiate_up'
      };
    }

    if (predMedian > jobMax) {
      return {
        status: 'above_range',
        message: 'Predicted salary is above job range',
        difference: predMedian - jobMax,
        recommendation: 'consider_negotiation'
      };
    }

    return { status: 'unknown' };
  }

  /**
   * Calculate negotiation range
   */
  calculateNegotiationRange(prediction) {
    const { min, max, median } = prediction;
    const range = max - min;
    
    return {
      conservative: Math.round(median - (range * 0.1)),
      target: median,
      aggressive: Math.round(median + (range * 0.1)),
      maxReasonable: Math.round(max + (range * 0.05))
    };
  }

  /**
   * Get salary benchmarks for a role
   */
  async getSalaryBenchmarks(jobTitle, location, experienceLevel) {
    try {
      const prompt = `
        Provide salary benchmarks for this role.
        
        Role: ${jobTitle}
        Location: ${location}
        Experience Level: ${experienceLevel}
        
        Provide percentiles (10th, 25th, 50th, 75th, 90th) and industry average.
        
        Return in JSON format:
        {
          "percentiles": {
            "10th": 50000,
            "25th": 60000,
            "50th": 75000,
            "75th": 90000,
            "90th": 110000
          },
          "industryAverage": 75000,
          "locationAdjustment": "+5%"
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      logger.error(`Salary benchmarks error: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyze salary trends for a role
   */
  async analyzeSalaryTrends(jobTitle, location) {
    try {
      const prompt = `
        Analyze salary trends for this role over the past 3 years.
        
        Role: ${jobTitle}
        Location: ${location}
        
        Provide:
        - Year-over-year growth rate
        - Current market trend (rising/stable/declining)
        - Future outlook (1-2 years)
        - Factors affecting the trend
        
        Return in JSON format:
        {
          "yoyGrowth": 5.2,
          "currentTrend": "rising",
          "futureOutlook": "positive",
          "factors": ["factor1", "factor2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      logger.error(`Salary trends analysis error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get compensation breakdown suggestions
   */
  async getCompensationBreakdown(baseSalary, jobTitle, location) {
    try {
      const prompt = `
        Suggest a compensation breakdown for this base salary.
        
        Base Salary: ${baseSalary}
        Role: ${jobTitle}
        Location: ${location}
        
        Provide breakdown for:
        - Base salary percentage
        - Bonus percentage
        - Equity/Stock options (if applicable)
        - Benefits value
        
        Return in JSON format:
        {
          "baseSalary": 85000,
          "bonus": {
            "percentage": 10,
            "amount": 8500
          },
          "equity": {
            "percentage": 5,
            "description": "RSUs or stock options"
          },
          "benefits": {
            "healthInsurance": 5000,
            "retirement": 4000,
            "other": 2000
          },
          "totalCompensation": 104500
        }
      `;

      const response = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      logger.error(`Compensation breakdown error: ${error.message}`);
      return null;
    }
  }

  /**
   * Store salary prediction
   */
  async storePrediction(candidateId, jobId, prediction) {
    try {
      await JobPrediction.create({
        candidateId,
        jobId,
        predictionData: prediction,
        predictionType: 'salary',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    } catch (error) {
      logger.error(`Error storing salary prediction: ${error.message}`);
    }
  }
}

export default new SalaryPredictionService();
