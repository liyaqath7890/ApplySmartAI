# AI Job Agent Database Schema Report

## Overview

This report contains the database schema, associations, and migration recommendations for the AI Job Agent application.

## Key Changes Made

### 1. Added `underscored: true` to All Models
All models now have `underscored: true` option, ensuring:
- Database columns use snake_case (e.g., `candidate_id`, `job_id`)
- Sequelize automatically converts between camelCase in JavaScript and snake_case in PostgreSQL
- Consistent naming across the entire schema

### 2. Fixed Foreign Key References
Corrected the model names in foreign key references (using singular model names instead of plural):
- `model: 'Users'` → `model: 'User'`
- `model: 'Jobs'` → `model: 'Job'`
- `model: 'ExternalJobs'` → `model: 'ExternalJob'`
- `model: 'Interviews'` → `model: 'Interview'`

### 3. Added Missing Associations
Added associations for:
- CareerTwin
- Recruiter
- RecruiterInteraction
- InterviewPreparation
- JobPrediction
- AgentMemory


## Model Associations Map

Here is a complete list of all associations between models:

### User Associations
- User.hasOne(CandidateProfile, { foreignKey: 'userId', as: 'candidateProfile' })
- User.hasOne(RecruiterProfile, { foreignKey: 'userId', as: 'recruiterProfile' })
- User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' })
- User.hasOne(CandidateIntelligenceProfile, { foreignKey: 'candidateId', as: 'candidateIntelligenceProfile' })
- User.hasOne(CareerTwin, { foreignKey: 'candidateId', as: 'careerTwin' })
- User.hasMany(Resume, { foreignKey: 'candidateId', as: 'resumes' })
- User.hasMany(Application, { foreignKey: 'candidateId', as: 'applications' })
- User.hasMany(Interview, { foreignKey: 'candidateId', as: 'interviews' })
- User.hasMany(CoverLetter, { foreignKey: 'candidateId', as: 'coverLetters' })
- User.hasMany(SkillGap, { foreignKey: 'candidateId', as: 'skillGaps' })
- User.hasMany(LearningPath, { foreignKey: 'candidateId', as: 'learningPaths' })
- User.hasMany(CareerRoadmap, { foreignKey: 'candidateId', as: 'careerRoadmaps' })
- User.hasMany(AutonomousAgent, { foreignKey: 'candidateId', as: 'agents' })
- User.hasMany(Portfolio, { foreignKey: 'candidateId', as: 'portfolios' })
- User.hasMany(PersonalBrand, { foreignKey: 'candidateId', as: 'personalBrands' })
- User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })
- User.hasMany(Certification, { foreignKey: 'candidateId', as: 'certifications' })
- User.hasMany(WorkExperience, { foreignKey: 'candidateId', as: 'workExperience' })
- User.hasMany(Education, { foreignKey: 'candidateId', as: 'education' })
- User.hasMany(JobPlatformCredential, { foreignKey: 'candidateId', as: 'jobPlatformCredentials' })
- User.hasMany(ExternalJob, { foreignKey: 'candidateId', as: 'externalJobs' })
- User.hasMany(ApplicationPackage, { foreignKey: 'candidateId', as: 'applicationPackages' })
- User.hasMany(Recruiter, { foreignKey: 'candidateId', as: 'recruiters' })
- User.hasMany(RecruiterInteraction, { foreignKey: 'candidateId', as: 'recruiterInteractions' })
- User.hasMany(InterviewPreparation, { foreignKey: 'candidateId', as: 'interviewPreparations' })
- User.hasMany(JobPrediction, { foreignKey: 'candidateId', as: 'jobPredictions' })
- User.hasMany(AgentMemory, { foreignKey: 'candidateId', as: 'agentMemories' })
- User.hasMany(ResumeVersionV2, { foreignKey: 'candidateId', as: 'resumeVersionsV2' })
- User.hasMany(JobAnalysisV2, { foreignKey: 'candidateId', as: 'jobAnalysesV2' })
- User.hasMany(InterviewPrepV2, { foreignKey: 'candidateId', as: 'interviewPrepsV2' })
- User.belongsToMany(Skill, { through: CandidateSkills, as: 'skills', foreignKey: 'candidateId' })

### Job Associations
- Job.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' })
- Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' })
- Job.hasMany(ResumeVersion, { foreignKey: 'jobId', as: 'targetResumeVersions' })
- Job.hasMany(CoverLetter, { foreignKey: 'jobId', as: 'targetCoverLetters' })
- Job.hasMany(SkillGap, { foreignKey: 'jobId', as: 'targetSkillGaps' })
- Job.hasMany(InterviewSession, { foreignKey: 'jobId', as: 'targetInterviewSessions' })
- Job.hasMany(Interview, { foreignKey: 'jobId', as: 'interviews' })
- Job.hasMany(ApplicationPackage, { foreignKey: 'jobId', as: 'applicationPackages' })
- Job.hasMany(RecruiterInteraction, { foreignKey: 'jobId', as: 'recruiterInteractions' })
- Job.hasMany(JobPrediction, { foreignKey: 'jobId', as: 'jobPredictions' })
- Job.hasMany(ResumeVersionV2, { foreignKey: 'jobId', as: 'resumeVersionsV2' })
- Job.hasMany(JobAnalysisV2, { foreignKey: 'jobId', as: 'jobAnalysesV2' })
- Job.hasOne(JobEmbedding, { foreignKey: 'jobId', as: 'embedding' })
- Job.belongsToMany(Skill, { through: JobSkills, as: 'requiredSkills', foreignKey: 'jobId' })

### CandidateProfile Associations
- CandidateProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' })
- CandidateProfile.hasMany(Resume, { foreignKey: 'candidateId', as: 'resumes' })
- CandidateProfile.hasMany(Application, { foreignKey: 'candidateId', as: 'applications' })

### RecruiterProfile Associations
- RecruiterProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' })
- RecruiterProfile.hasMany(Job, { foreignKey: 'recruiterId', as: 'jobs' })

### Resume Associations
- Resume.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' })
- Resume.hasMany(ResumeVersion, { foreignKey: 'resumeId', as: 'versions' })
- Resume.hasMany(Application, { foreignKey: 'resumeId', as: 'applications' })
- Resume.hasOne(ResumeEmbedding, { foreignKey: 'resumeId', as: 'embedding' })
- Resume.hasMany(ApplicationPackage, { foreignKey: 'resumeId', as: 'applicationPackages' })

### ResumeVersion Associations
- ResumeVersion.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' })
- ResumeVersion.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' })

### CoverLetter Associations
- CoverLetter.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' })
- CoverLetter.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' })
- CoverLetter.hasMany(Application, { foreignKey: 'coverLetterId', as: 'applications' })
- CoverLetter.hasMany(ApplicationPackage, { foreignKey: 'coverLetterId', as: 'applicationPackages' })

### Application Associations
- Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' })
- Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' })
- Application.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' })
- Application.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' })
- Application.belongsTo(CoverLetter, { foreignKey: 'coverLetterId', as: 'coverLetterDocument' })
- Application.hasMany(Interview, { foreignKey: 'applicationId', as: 'interviews' })

### Interview Associations
- Interview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' })
- Interview.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' })
- Interview.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' })
- Interview.belongsTo(Job, { foreignKey: 'jobId', as: 'job' })
- Interview.hasMany(InterviewPreparation, { foreignKey: 'interviewId', as: 'interviewPreparations' })
- Interview.hasMany(InterviewPrepV2, { foreignKey: 'interviewId', as: 'interviewPrepsV2' })

### Skill Associations
- Skill.belongsToMany(User, { through: CandidateSkills, as: 'candidates', foreignKey: 'skillId' })
- Skill.belongsToMany(Job, { through: JobSkills, as: 'jobs', foreignKey: 'skillId' })

### ExternalJob Associations
- ExternalJob.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' })
- ExternalJob.hasMany(Application, { foreignKey: 'externalJobId', as: 'applications' })
- ExternalJob.hasMany(ApplicationPackage, { foreignKey: 'externalJobId', as: 'applicationPackages' })
- ExternalJob.hasMany(RecruiterInteraction, { foreignKey: 'externalJobId', as: 'recruiterInteractions' })
- ExternalJob.hasMany(JobPrediction, { foreignKey: 'externalJobId', as: 'jobPredictions' })
- ExternalJob.hasMany(ResumeVersionV2, { foreignKey: 'externalJobId', as: 'resumeVersionsV2' })
- ExternalJob.hasMany(JobAnalysisV2, { foreignKey: 'externalJobId', as: 'jobAnalysesV2' })


## Migration Recommendations

### For New Installations
No special migration needed—just run:
```javascript
await sequelize.sync();
```

### For Existing Databases
If you have an existing database with data:
1. First backup your data
2. Create migration scripts to rename columns from camelCase to snake_case (e.g., `candidateId` → `candidate_id`)
3. Run migrations
4. Verify data integrity


## Testing the Sync

To test the database sync, run:

```bash
cd backend
node test-sync.js
```

## File Changes Summary

- All model files: Added `underscored: true` option
- `CandidateIntelligenceProfile.js`: Fixed model references in foreign keys
- `ResumeVersionV2.js`: Fixed model references in foreign keys
- `JobAnalysisV2.js`: Fixed model references in foreign keys
- `InterviewPrepV2.js`: Fixed model references in foreign keys
- `models/index.js`: Added missing associations for CareerTwin, Recruiter, RecruiterInteraction, InterviewPreparation, JobPrediction, and AgentMemory
- Created `test-sync.js`: Simple script to test sequelize.sync()
- Created this `DATABASE_SCHEMA_REPORT.md`: Full documentation of changes
