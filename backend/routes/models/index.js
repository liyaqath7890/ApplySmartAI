import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import User from './User.js';
import CandidateProfile from './CandidateProfile.js';
import RecruiterProfile from './RecruiterProfile.js';
import Job from './Job.js';
import Application from './Application.js';
import Skill from './Skill.js';
import Resume from './Resume.js';
import Interview from './Interview.js';
import ResumeTemplate from './ResumeTemplate.js';
import ResumeVersion from './ResumeVersion.js';
import CoverLetter from './CoverLetter.js';
import InterviewSession from './InterviewSession.js';
import InterviewQuestion from './InterviewQuestion.js';
import SkillGap from './SkillGap.js';
import LearningPath from './LearningPath.js';
import LearningStep from './LearningStep.js';
import CareerRoadmap from './CareerRoadmap.js';
import CareerMilestone from './CareerMilestone.js';
import JobEmbedding from './JobEmbedding.js';
import ResumeEmbedding from './ResumeEmbedding.js';
import AutonomousAgent from './AutonomousAgent.js';
import AgentActivity from './AgentActivity.js';
import AgentTask from './AgentTask.js';
import Portfolio from './Portfolio.js';
import PortfolioProject from './PortfolioProject.js';
import PersonalBrand from './PersonalBrand.js';
import Subscription from './Subscription.js';
import Plan from './Plan.js';
import Conversation from './Conversation.js';
import ConversationParticipant from './ConversationParticipant.js';
import Message from './Message.js';
import Notification from './Notification.js';
import Analytics from './Analytics.js';
import Certification from './Certification.js';
import WorkExperience from './WorkExperience.js';
import Education from './Education.js';
import JobPlatformCredential from './JobPlatformCredential.js';
import ExternalJob from './ExternalJob.js';
import CareerTwin from './CareerTwin.js';
import Recruiter from './Recruiter.js';
import RecruiterInteraction from './RecruiterInteraction.js';
import InterviewPreparation from './InterviewPreparation.js';
import JobPrediction from './JobPrediction.js';
import AgentMemory from './AgentMemory.js';
import CandidateIntelligenceProfile from './CandidateIntelligenceProfile.js';
import ResumeVersionV2 from './ResumeVersionV2.js';
import JobAnalysisV2 from './JobAnalysisV2.js';
import InterviewPrepV2 from './InterviewPrepV2.js';
import ApplicationPackage from './ApplicationPackage.js';
import Company from './Company.js';
import SavedCompany from './SavedCompany.js';


// User associations
User.hasOne(CandidateProfile, { foreignKey: 'userId', as: 'candidateProfile' });
CandidateProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(RecruiterProfile, { foreignKey: 'userId', as: 'recruiterProfile' });
RecruiterProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Job associations
RecruiterProfile.hasMany(Job, { foreignKey: 'recruiterId', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });

// Application associations
Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

CandidateProfile.hasMany(Application, { foreignKey: 'candidateId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Resume associations
CandidateProfile.hasMany(Resume, { foreignKey: 'candidateId', as: 'resumes' });
Resume.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

Resume.hasMany(ResumeVersion, { foreignKey: 'resumeId', as: 'versions' });
ResumeVersion.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
ResumeVersion.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' });

Resume.hasOne(ResumeEmbedding, { foreignKey: 'resumeId', as: 'embedding' });
ResumeEmbedding.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });

// Interview associations
Application.hasMany(Interview, { foreignKey: 'applicationId', as: 'interviews' });
Interview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
Interview.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
Interview.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });
Interview.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

// AI Interview Simulator associations
User.hasMany(InterviewSession, { foreignKey: 'candidateId', as: 'interviewSessions' });
InterviewSession.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
InterviewSession.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' });

InterviewSession.hasMany(InterviewQuestion, { foreignKey: 'interviewSessionId', as: 'questions' });
InterviewQuestion.belongsTo(InterviewSession, { foreignKey: 'interviewSessionId', as: 'session' });

// Job Embedding associations
Job.hasOne(JobEmbedding, { foreignKey: 'jobId', as: 'embedding' });
JobEmbedding.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

// Cover Letter associations
User.hasMany(CoverLetter, { foreignKey: 'candidateId', as: 'coverLetters' });
CoverLetter.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
CoverLetter.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' });

// Skill Gap associations
User.hasMany(SkillGap, { foreignKey: 'candidateId', as: 'skillGaps' });
SkillGap.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
SkillGap.belongsTo(Job, { foreignKey: 'jobId', as: 'targetJob' });

// Learning Path associations
User.hasMany(LearningPath, { foreignKey: 'candidateId', as: 'learningPaths' });
LearningPath.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

LearningPath.hasMany(LearningStep, { foreignKey: 'learningPathId', as: 'steps' });
LearningStep.belongsTo(LearningPath, { foreignKey: 'learningPathId', as: 'path' });

// Career Roadmap associations
User.hasMany(CareerRoadmap, { foreignKey: 'candidateId', as: 'careerRoadmaps' });
CareerRoadmap.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

CareerRoadmap.hasMany(CareerMilestone, { foreignKey: 'careerRoadmapId', as: 'milestones' });
CareerMilestone.belongsTo(CareerRoadmap, { foreignKey: 'careerRoadmapId', as: 'roadmap' });

// Autonomous Agent associations
User.hasMany(AutonomousAgent, { foreignKey: 'candidateId', as: 'agents' });
AutonomousAgent.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

AutonomousAgent.hasMany(AgentActivity, { foreignKey: 'agentId', as: 'activities' });
AgentActivity.belongsTo(AutonomousAgent, { foreignKey: 'agentId', as: 'agent' });
AgentActivity.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

AutonomousAgent.hasMany(AgentTask, { foreignKey: 'agentId', as: 'tasks' });
AgentTask.belongsTo(AutonomousAgent, { foreignKey: 'agentId', as: 'agent' });

// Portfolio associations
User.hasMany(Portfolio, { foreignKey: 'candidateId', as: 'portfolios' });
Portfolio.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

Portfolio.hasMany(PortfolioProject, { foreignKey: 'portfolioId', as: 'projects' });
PortfolioProject.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });

// Personal Brand associations
User.hasMany(PersonalBrand, { foreignKey: 'candidateId', as: 'personalBrands' });
PersonalBrand.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Subscription & Plan associations
Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Conversation & Message associations
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
ConversationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Skill associations (many-to-many through join tables)
// CandidateSkills join table
const CandidateSkills = sequelize.define('CandidateSkills', {
  proficiencyLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'intermediate'
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { underscored: true, freezeTableName: true });

User.belongsToMany(Skill, { through: CandidateSkills, as: 'skills', foreignKey: 'candidateId' });
Skill.belongsToMany(User, { through: CandidateSkills, as: 'candidates', foreignKey: 'skillId' });

// JobSkills join table
const JobSkills = sequelize.define('JobSkills', {
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, { underscored: true, freezeTableName: true });

Job.belongsToMany(Skill, { through: JobSkills, as: 'requiredSkills', foreignKey: 'jobId' });
Skill.belongsToMany(Job, { through: JobSkills, as: 'jobs', foreignKey: 'skillId' });

// New model associations
User.hasMany(Certification, { foreignKey: 'candidateId', as: 'certifications' });
Certification.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(WorkExperience, { foreignKey: 'candidateId', as: 'workExperience' });
WorkExperience.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(Education, { foreignKey: 'candidateId', as: 'education' });
Education.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(JobPlatformCredential, { foreignKey: 'candidateId', as: 'jobPlatformCredentials' });
JobPlatformCredential.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(ExternalJob, { foreignKey: 'candidateId', as: 'externalJobs' });
ExternalJob.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Application Package associations
User.hasMany(ApplicationPackage, { foreignKey: 'candidateId', as: 'applicationPackages' });
ApplicationPackage.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
ApplicationPackage.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
ApplicationPackage.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });
ApplicationPackage.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
ApplicationPackage.belongsTo(CoverLetter, { foreignKey: 'coverLetterId', as: 'coverLetter' });

// Application associations
Application.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });
ExternalJob.hasMany(Application, { foreignKey: 'externalJobId', as: 'applications' });

Application.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Resume.hasMany(Application, { foreignKey: 'resumeId', as: 'applications' });

Application.belongsTo(CoverLetter, { foreignKey: 'coverLetterId', as: 'coverLetterDocument' });
CoverLetter.hasMany(Application, { foreignKey: 'coverLetterId', as: 'applications' });

// Advanced Candidate Intelligence Model Associations
User.hasOne(CandidateIntelligenceProfile, { foreignKey: 'candidateId', as: 'candidateIntelligenceProfile' });
CandidateIntelligenceProfile.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Career Twin associations
User.hasOne(CareerTwin, { foreignKey: 'candidateId', as: 'careerTwin' });
CareerTwin.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Recruiter associations
User.hasMany(Recruiter, { foreignKey: 'candidateId', as: 'recruiters' });
Recruiter.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// Recruiter Interaction associations
User.hasMany(RecruiterInteraction, { foreignKey: 'candidateId', as: 'recruiterInteractions' });
RecruiterInteraction.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
RecruiterInteraction.belongsTo(Recruiter, { foreignKey: 'recruiterId', as: 'recruiter' });
RecruiterInteraction.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
RecruiterInteraction.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });

// Interview Preparation associations
User.hasMany(InterviewPreparation, { foreignKey: 'candidateId', as: 'interviewPreparations' });
InterviewPreparation.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
InterviewPreparation.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

// Job Prediction associations
User.hasMany(JobPrediction, { foreignKey: 'candidateId', as: 'jobPredictions' });
JobPrediction.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
JobPrediction.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobPrediction.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });

// Agent Memory associations
User.hasMany(AgentMemory, { foreignKey: 'candidateId', as: 'agentMemories' });
AgentMemory.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(ResumeVersionV2, { foreignKey: 'candidateId', as: 'resumeVersionsV2' });
ResumeVersionV2.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
ResumeVersionV2.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
ResumeVersionV2.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });

User.hasMany(JobAnalysisV2, { foreignKey: 'candidateId', as: 'jobAnalysesV2' });
JobAnalysisV2.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
JobAnalysisV2.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobAnalysisV2.belongsTo(ExternalJob, { foreignKey: 'externalJobId', as: 'externalJob' });

User.hasMany(InterviewPrepV2, { foreignKey: 'candidateId', as: 'interviewPrepsV2' });
InterviewPrepV2.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
InterviewPrepV2.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

// Company & SavedCompany associations
Company.belongsToMany(CandidateProfile, { through: SavedCompany, as: 'savedCompaniesList', foreignKey: 'companyId' });
CandidateProfile.belongsToMany(Company, { through: SavedCompany, as: 'savedCompaniesList', foreignKey: 'candidateProfileId' });
Company.hasMany(ExternalJob, { foreignKey: 'companyId', as: 'externalJobs' });
ExternalJob.belongsTo(Company, { foreignKey: 'companyId', as: 'companyDetails' });

// Export all models
export {
  sequelize,
  User,
  CandidateProfile,
  RecruiterProfile,
  Job,
  Application,
  Skill,
  Resume,
  Interview,
  CandidateSkills,
  JobSkills,
  ResumeTemplate,
  ResumeVersion,
  CoverLetter,
  InterviewSession,
  InterviewQuestion,
  SkillGap,
  LearningPath,
  LearningStep,
  CareerRoadmap,
  CareerMilestone,
  JobEmbedding,
  ResumeEmbedding,
  AutonomousAgent,
  AgentActivity,
  AgentTask,
  Portfolio,
  PortfolioProject,
  PersonalBrand,
  Subscription,
  Plan,
  Conversation,
  ConversationParticipant,
  Message,
  Notification,
  Analytics,
  Certification,
  WorkExperience,
  Education,
  JobPlatformCredential,
  ExternalJob,
  CareerTwin,
  Recruiter,
  RecruiterInteraction,
  InterviewPreparation,
  JobPrediction,
  AgentMemory,
  CandidateIntelligenceProfile,
  ResumeVersionV2,
  JobAnalysisV2,
  InterviewPrepV2,
  ApplicationPackage,
  Company,
  SavedCompany
};

export default {
  sequelize,
  User,
  CandidateProfile,
  RecruiterProfile,
  Job,
  Application,
  Skill,
  Resume,
  Interview,
  CandidateSkills,
  JobSkills,
  ResumeTemplate,
  ResumeVersion,
  CoverLetter,
  InterviewSession,
  InterviewQuestion,
  SkillGap,
  LearningPath,
  LearningStep,
  CareerRoadmap,
  CareerMilestone,
  JobEmbedding,
  ResumeEmbedding,
  AutonomousAgent,
  AgentActivity,
  AgentTask,
  Portfolio,
  PortfolioProject,
  PersonalBrand,
  Subscription,
  Plan,
  Conversation,
  ConversationParticipant,
  Message,
  Notification,
  Analytics,
  Certification,
  WorkExperience,
  Education,
  JobPlatformCredential,
  ExternalJob,
  CareerTwin,
  Recruiter,
  RecruiterInteraction,
  InterviewPreparation,
  JobPrediction,
  AgentMemory,
  CandidateIntelligenceProfile,
  ResumeVersionV2,
  JobAnalysisV2,
  InterviewPrepV2,
  ApplicationPackage,
  Company,
  SavedCompany
};
