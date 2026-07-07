import {
  User,
  Resume,
  ResumeVersion,
  ResumeTemplate,
  CandidateProfile,
  WorkExperience,
  Education,
  Certification,
  Skill,
  CandidateSkills,
  ExternalJob
} from '../routes/models/index.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
    }
  }
});


// Get all resumes for a candidate
export const getResumes = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const resumes = await Resume.findAll({
      where: { candidateId },
      include: [
        { model: ResumeVersion, as: 'versions', order: [['versionNumber', 'DESC']] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, resumes });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload a resume
export const uploadResume = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Create resume
    const resume = await Resume.create({
      candidateId,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      fileType: path.extname(file.originalname).toLowerCase().slice(1)
    });

    // Create initial version
    await ResumeVersion.create({
      resumeId: resume.id,
      versionNumber: 1,
      title: 'Initial Version',
      isCurrent: true
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate a resume for a specific job
export const generateResume = async (req, res) => {
  try {
    const { jobId, templateId } = req.body;
    const candidateId = req.user.id;

    // Get candidate's profile data
    const candidate = await User.findByPk(candidateId, {
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: WorkExperience, as: 'workExperience', order: [['orderIndex', 'DESC'], ['startDate', 'DESC']] },
        { model: Education, as: 'education', order: [['orderIndex', 'DESC'], ['startDate', 'DESC']] },
        { model: Certification, as: 'certifications' },
        { model: Skill, as: 'skills', through: { attributes: ['proficiencyLevel', 'yearsOfExperience'] } }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Get job if provided
    let job = null;
    if (jobId) {
      job = await ExternalJob.findOne({ where: { id: jobId, candidateId } });
      if (!job) {
        job = await Job.findByPk(jobId);
      }
    }

    // Build resume content
    const resumeContent = {
      personalInfo: {
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        headline: candidate.candidateProfile?.headline || '',
        summary: candidate.candidateProfile?.summary || '',
        linkedinUrl: candidate.candidateProfile?.linkedinUrl || '',
        githubUrl: candidate.candidateProfile?.githubUrl || '',
        portfolioUrl: candidate.candidateProfile?.portfolioUrl || ''
      },
      experience: candidate.workExperience?.map(exp => ({
        company: exp.company,
        position: exp.jobTitle,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
        achievements: exp.achievements || []
      })) || [],
      education: candidate.education?.map(edu => ({
        school: edu.school,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent,
        gpa: edu.gpa
      })) || [],
      skills: candidate.skills?.map(skill => ({
        name: skill.name,
        category: skill.category,
        proficiency: skill.CandidateSkills?.proficiencyLevel || 'intermediate'
      })) || [],
      certifications: candidate.certifications?.map(cert => ({
        name: cert.title,
        issuingOrganization: cert.issuingOrganization,
        issueDate: cert.issueDate,
        expirationDate: cert.expirationDate,
        credentialUrl: cert.credentialUrl
      })) || []
    };

    // Create a new resume version
    const resume = await Resume.create({
      candidateId,
      fileName: `${candidate.firstName.toLowerCase()}-${candidate.lastName.toLowerCase()}-resume.pdf`,
      fileUrl: '',
      fileSize: 0,
      fileType: 'pdf',
      parsedContent: resumeContent,
      isPrimary: false
    });

    const versionTitle = job ? `Tailored for ${job.company} - ${job.title}` : 'Generated Resume';
    await ResumeVersion.create({
      resumeId: resume.id,
      versionNumber: 1,
      title: versionTitle,
      content: resumeContent,
      isCurrent: true,
      jobId: jobId
    });

    res.json({
      success: true,
      resume,
      content: resumeContent
    });
  } catch (error) {
    console.error('Generate resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get resume templates
export const getResumeTemplates = async (req, res) => {
  try {
    const templates = await ResumeTemplate.findAll({
      where: { isPublic: true }
    });
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const resume = await Resume.findOne({ where: { id, candidateId } });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    await resume.destroy();
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Set primary resume
export const setPrimary = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const resume = await Resume.findOne({ where: { id, candidateId } });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Set all other resumes to not primary
    await Resume.update({ isPrimary: false }, { where: { candidateId } });
    
    // Set this one as primary
    await resume.update({ isPrimary: true });

    res.json({ success: true, resume });
  } catch (error) {
    console.error('Set primary resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get resume versions
export const getVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const resume = await Resume.findOne({ where: { id, candidateId } });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const versions = await ResumeVersion.findAll({
      where: { resumeId: id },
      order: [['versionNumber', 'DESC']]
    });

    res.json({ success: true, versions });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Analyze resume
import ATSScoringService from '../services/ATSScoringService.js';
export const analyzeResume = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const candidateId = req.user.id;

    const resume = await Resume.findOne({ where: { id: resumeId, candidateId } });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const job = { description: jobDescription };
    const analysis = await ATSScoringService.calculateATSScore(resume, job);

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Tailor resume
import ResumeVersioningService from '../services/ResumeVersioningService.js';
export const tailorResume = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const candidateId = req.user.id;

    const resume = await Resume.findOne({ where: { id: resumeId, candidateId } });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Creating a mock job to pass to ResumeVersioningService
    // Ideally we would save the job, but if it's just raw text, we simulate it
    const mockJob = await Job.create({
      recruiterId: candidateId, // just filling required fields or use a system user
      title: 'Target Job',
      description: jobDescription,
      status: 'draft'
    });

    const version = await ResumeVersioningService.createVersion(candidateId, resumeId, mockJob.id, {
      generateTailored: true,
      title: `Tailored Version`
    });
    
    // Clean up mock job
    await mockJob.destroy();

    res.json({ success: true, version });
  } catch (error) {
    console.error('Tailor resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Revert to a previous version
export const revertVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const candidateId = req.user.id;
    const version = await ResumeVersioningService.revertToVersion(versionId, candidateId);
    res.json({ success: true, version });
  } catch (error) {
    console.error('Revert version error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a specific version
export const deleteVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const candidateId = req.user.id;
    const result = await ResumeVersioningService.deleteVersion(versionId, candidateId);
    res.json({ success: true, message: 'Version deleted successfully', result });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Compare two resume versions
export const compareVersions = async (req, res) => {
  try {
    const { v1, v2 } = req.params;
    const comparison = await ResumeVersioningService.compareVersions(v1, v2);
    res.json({ success: true, comparison });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { upload };
