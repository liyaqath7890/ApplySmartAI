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

// Calculate ATS score
const calculateATSScore = (content) => {
  let score = 0;
  const suggestions = [];

  // Check for keywords
  const keywords = ['experience', 'skills', 'education', 'projects', 'achievements', 'summary', 'contact'];
  let keywordCount = 0;
  keywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      keywordCount++;
    }
  });
  score += (keywordCount / keywords.length) * 30;

  // Check for bullet points
  const bulletPoints = content.match(/[•●-]/g);
  if (bulletPoints && bulletPoints.length > 5) {
    score += 20;
  } else {
    suggestions.push('Use more bullet points to highlight achievements');
  }

  // Check for action verbs
  const actionVerbs = ['achieved', 'built', 'created', 'developed', 'led', 'managed', 'improved', 'increased', 'decreased'];
  let verbCount = 0;
  actionVerbs.forEach(verb => {
    if (content.toLowerCase().includes(verb)) {
      verbCount++;
    }
  });
  score += (verbCount / actionVerbs.length) * 30;

  // Check length
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 800) {
    score += 20;
  } else if (wordCount < 300) {
    suggestions.push('Resume is too short - aim for 300-800 words');
  } else {
    suggestions.push('Resume is too long - aim for 300-800 words');
  }

  return { score: Math.round(score), suggestions };
};

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

export { upload };
