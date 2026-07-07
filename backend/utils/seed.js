import './loadEnv.js';
import { sequelize, Company, ExternalJob, User, CandidateProfile } from '../routes/models/index.js';

const companiesData = [
  {
    name: 'Google',
    website: 'https://google.com',
    careerPageUrl: 'https://google.com/careers',
    atsPlatform: 'greenhouse',
    industry: 'Technology',
    category: 'Search & Cloud',
    companySize: '10,000+ employees',
    headquarters: 'Mountain View, CA',
    foundedYear: 1998,
    remoteAvailability: 'hybrid',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.5,
    description: 'Google LLC is an American multinational technology company that specializes in Internet-related services and products.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Microsoft',
    website: 'https://microsoft.com',
    careerPageUrl: 'https://careers.microsoft.com',
    atsPlatform: 'lever',
    industry: 'Technology',
    category: 'Software & Cloud',
    companySize: '10,000+ employees',
    headquarters: 'Redmond, WA',
    foundedYear: 1975,
    remoteAvailability: 'hybrid',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.4,
    description: 'Microsoft Corporation is an American multinational technology corporation producing computer software, consumer electronics, and personal computers.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Meta',
    website: 'https://meta.com',
    careerPageUrl: 'https://meta.com/careers',
    atsPlatform: 'ashby',
    industry: 'Technology',
    category: 'Social Media',
    companySize: '10,000+ employees',
    headquarters: 'Menlo Park, CA',
    foundedYear: 2004,
    remoteAvailability: 'remote',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: false,
    experiencedHiring: true,
    companyRating: 4.1,
    description: 'Meta Platforms, Inc. builds technologies that help people connect, find communities, and grow businesses.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'NVIDIA',
    website: 'https://nvidia.com',
    careerPageUrl: 'https://nvidia.com/careers',
    atsPlatform: 'greenhouse',
    industry: 'Semiconductors',
    category: 'AI & Hardware',
    companySize: '10,000+ employees',
    headquarters: 'Santa Clara, CA',
    foundedYear: 1993,
    remoteAvailability: 'hybrid',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.7,
    description: 'NVIDIA Corporation is an American multinational technology company incorporated in Delaware and based in Santa Clara, California.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Stripe',
    website: 'https://stripe.com',
    careerPageUrl: 'https://stripe.com/jobs',
    atsPlatform: 'lever',
    industry: 'Financial Technology',
    category: 'Payments',
    companySize: '5,000-10,000 employees',
    headquarters: 'San Francisco, CA',
    foundedYear: 2010,
    remoteAvailability: 'remote',
    hybridAvailability: true,
    onsiteAvailability: false,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.2,
    description: 'Stripe is a financial infrastructure platform for the internet. Millions of companies use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Amazon',
    website: 'https://amazon.com',
    careerPageUrl: 'https://amazon.jobs',
    atsPlatform: 'workday',
    industry: 'Technology',
    category: 'E-commerce & Cloud',
    companySize: '10,000+ employees',
    headquarters: 'Seattle, WA',
    foundedYear: 1994,
    remoteAvailability: 'onsite',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 3.8,
    description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Adobe',
    website: 'https://adobe.com',
    careerPageUrl: 'https://adobe.com/careers',
    atsPlatform: 'lever',
    industry: 'Technology',
    category: 'Creative Software',
    companySize: '10,000+ employees',
    headquarters: 'San Jose, CA',
    foundedYear: 1982,
    remoteAvailability: 'hybrid',
    hybridAvailability: true,
    onsiteAvailability: true,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.3,
    description: 'Adobe Inc. is an American multinational computer software company. It has historically focused upon the creation of multimedia and creativity software products.',
    hiringStatus: 'Actively Hiring'
  },
  {
    name: 'Atlassian',
    website: 'https://atlassian.com',
    careerPageUrl: 'https://atlassian.com/careers',
    atsPlatform: 'lever',
    industry: 'Technology',
    category: 'Collaboration Tools',
    companySize: '5,000-10,000 employees',
    headquarters: 'Sydney, Australia',
    foundedYear: 2002,
    remoteAvailability: 'remote',
    hybridAvailability: true,
    onsiteAvailability: false,
    internshipAvailability: true,
    fresherFriendly: true,
    experiencedHiring: true,
    companyRating: 4.3,
    description: 'Atlassian Corporation is an American-Australian software company that develops products for software developers, project managers and other software development teams.',
    hiringStatus: 'Actively Hiring'
  }
];

const jobsData = [
  {
    title: 'Senior Software Engineer - Frontend',
    companyName: 'Google',
    location: 'Mountain View, CA',
    salary: '$150,000 - $210,000',
    salaryMin: 150000,
    salaryMax: 210000,
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    workType: 'Hybrid',
    jobUrl: 'https://google.com/careers/jobs/frontend-senior',
    skills: ['React', 'TypeScript', 'HTML5', 'CSS3', 'Vite', 'TailwindCSS'],
    description: 'Google is looking for a Senior Frontend Engineer to build the next generation of creative user interfaces.',
    matchScore: 92
  },
  {
    title: 'Full Stack Engineer - Cloud Services',
    companyName: 'Microsoft',
    location: 'Redmond, WA',
    salary: '$130,000 - $185,000',
    salaryMin: 130000,
    salaryMax: 185000,
    employmentType: 'Full-time',
    experienceLevel: 'Mid',
    workType: 'Hybrid',
    jobUrl: 'https://microsoft.com/careers/jobs/cloud-fullstack',
    skills: ['C#', '.NET', 'React', 'TypeScript', 'Azure', 'SQL Server'],
    description: 'Join Azure Cloud Management portal team to develop high-performance telemetry visualization layers.',
    matchScore: 84
  },
  {
    title: 'Staff AI/ML Infrastructure Engineer',
    companyName: 'NVIDIA',
    location: 'Santa Clara, CA',
    salary: '$180,000 - $260,000',
    salaryMin: 180000,
    salaryMax: 260000,
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    workType: 'On-site',
    jobUrl: 'https://nvidia.com/careers/jobs/ai-infrastructure',
    skills: ['Python', 'C++', 'CUDA', 'Docker', 'Kubernetes', 'PyTorch'],
    description: 'Develop low-latency scaling layers for large language model deployment configurations on DGX clusters.',
    matchScore: 96
  },
  {
    title: 'Software Engineer - Checkout Core',
    companyName: 'Stripe',
    location: 'Remote',
    salary: '$140,000 - $190,000',
    salaryMin: 140000,
    salaryMax: 190000,
    employmentType: 'Full-time',
    experienceLevel: 'Mid',
    workType: 'Remote',
    jobUrl: 'https://stripe.com/careers/jobs/checkout-core',
    skills: ['Ruby on Rails', 'Go', 'React', 'REST APIs', 'PostgreSQL'],
    description: 'Stripe is looking for a Full Stack engineer to support our global core Checkout framework.',
    matchScore: 88
  },
  {
    title: 'React Native Mobile Developer',
    companyName: 'Meta',
    location: 'Menlo Park, CA',
    salary: '$160,000 - $220,000',
    salaryMin: 160000,
    salaryMax: 220000,
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    workType: 'Hybrid',
    jobUrl: 'https://meta.com/careers/jobs/rn-mobile',
    skills: ['React Native', 'TypeScript', 'iOS', 'Android', 'GraphQL'],
    description: 'Optimize video renderer pipelines for Instagram Threads using React Native and Web Assembly overlays.',
    matchScore: 78
  },
  {
    title: 'Associate DevOps Engineer',
    companyName: 'Atlassian',
    location: 'Remote',
    salary: '$95,000 - $130,000',
    salaryMin: 95000,
    salaryMax: 130000,
    employmentType: 'Full-time',
    experienceLevel: 'Entry',
    workType: 'Remote',
    jobUrl: 'https://atlassian.com/careers/jobs/associate-devops',
    skills: ['Python', 'AWS', 'Terraform', 'GitHub Actions', 'Linux'],
    description: 'Junior role supporting Cloud Infrastructure automation templates for Jira and Confluence.',
    matchScore: 72
  }
];

const seed = async () => {
  try {
    console.log('⚡ Starting database seed script...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection verified.');

    // Seeding Companies
    const seededCompanies = [];
    for (const comp of companiesData) {
      const [company, created] = await Company.findOrCreate({
        where: { name: comp.name },
        defaults: comp
      });
      if (created) {
        console.log(`➕ Seeding Company: "${comp.name}"`);
      } else {
        console.log(`ℹ️ Company "${comp.name}" already exists. Skipping.`);
      }
      seededCompanies.push(company);
    }

    // Get candidate profile id for external job links
    const profile = await CandidateProfile.findOne();
    const candidateId = profile ? profile.id : null;

    // Seeding External Jobs
    for (const job of jobsData) {
      const compRecord = seededCompanies.find(c => c.name === job.companyName);
      if (!compRecord) continue;

      const [extJob, created] = await ExternalJob.findOrCreate({
        where: {
          platform: compRecord.atsPlatform,
          externalJobId: `seed-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        },
        defaults: {
          platform: compRecord.atsPlatform,
          externalJobId: `seed-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: job.title,
          company: job.companyName,
          location: job.location,
          description: job.description,
          salary: job.salary,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          workType: job.workType,
          jobUrl: job.jobUrl,
          postedDate: new Date(),
          isExpired: false,
          matchScore: job.matchScore,
          skills: job.skills,
          atsPlatform: compRecord.atsPlatform,
          companyId: compRecord.id
        }
      });

      if (created) {
        console.log(`➕ Seeding External Job: "${job.title}" @ "${job.companyName}"`);
      } else {
        console.log(`ℹ️ External Job "${job.title}" already exists. Skipping.`);
      }
    }

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seed();
