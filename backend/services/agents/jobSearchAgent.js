import OpenAI from 'openai';
import { Sequelize } from 'sequelize';
import config from '../../config/index.js';
import { Job, JobEmbedding } from '../../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class JobSearchAgent {
  async execute(agent, inputData) {
    const { keywords, location, remote, experienceLevel, jobType } = inputData;
    
    let query = { where: { status: 'active' } };
    
    if (keywords) {
      query.where[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.iLike]: `%${keywords}%` } },
        { description: { [Sequelize.Op.iLike]: `%${keywords}%` } }
      ];
    }
    if (location) {
      query.where.location = { [Sequelize.Op.iLike]: `%${location}%` };
    }
    if (remote !== undefined) {
      query.where.isRemote = remote;
    }
    if (experienceLevel) {
      query.where.experienceLevel = experienceLevel;
    }
    if (jobType) {
      query.where.employmentType = jobType;
    }

    const jobs = await Job.findAll({
      ...query,
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    return {
      count: jobs.length,
      jobs: jobs.map(job => job.toJSON())
    };
  }
}

export default JobSearchAgent;
