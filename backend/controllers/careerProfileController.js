import {
  User,
  CandidateProfile,
  Skill,
  CandidateSkills,
  Certification,
  WorkExperience,
  Education,
  Resume,
  ResumeVersion,
  CandidateIntelligenceProfile
} from '../routes/models/index.js';
import CareerProfileService from '../services/CareerProfileService.js';

// Get complete career profile
export const getCareerProfile = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const user = await User.findByPk(candidateId, {
      include: [
        { model: CandidateProfile, as: 'candidateProfile' },
        { model: CandidateIntelligenceProfile, as: 'candidateIntelligenceProfile' },
        { model: Skill, as: 'skills', through: { attributes: ['proficiencyLevel', 'yearsOfExperience'] } },
        { model: Certification, as: 'certifications' },
        { model: WorkExperience, as: 'workExperience' },
        { model: Education, as: 'education' },
        { model: Resume, as: 'resumes' }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update and get profile completeness score
    const completenessScore = await CareerProfileService.updateCompletenessScore(candidateId, {
      CandidateProfile,
      Skill,
      WorkExperience,
      Education,
      Certification,
      CandidateIntelligenceProfile,
      User
    });

    res.json({
      success: true,
      profile: {
        ...user.toJSON(),
        completenessScore
      }
    });
  } catch (error) {
    console.error('Get career profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update candidate profile
export const updateCandidateProfile = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const profileData = req.body;

    let profile = await CandidateProfile.findOne({ where: { userId: candidateId } });

    if (!profile) {
      profile = await CandidateProfile.create({ userId: candidateId, ...profileData });
    } else {
      await profile.update(profileData);
    }

    // Update completeness score after profile change
    await CareerProfileService.updateCompletenessScore(candidateId, {
      CandidateProfile,
      Skill,
      WorkExperience,
      Education,
      Certification,
      CandidateIntelligenceProfile,
      User
    });

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update candidate profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add or update skills
export const updateSkills = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { skills } = req.body; // Array of { name, category, proficiencyLevel, yearsOfExperience }

    const user = await User.findByPk(candidateId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove existing skills
    await user.setSkills([]);

    // Add new skills
    for (const skillData of skills) {
      let [skill] = await Skill.findOrCreate({
        where: { name: skillData.name.toLowerCase() },
        defaults: {
          name: skillData.name,
          category: skillData.category,
          isTechnical: skillData.isTechnical !== false
        }
      });

      await user.addSkill(skill, {
        through: {
          proficiencyLevel: skillData.proficiencyLevel || 'intermediate',
          yearsOfExperience: skillData.yearsOfExperience || 0
        }
      });
    }

    // Reload user with skills
    const updatedUser = await User.findByPk(candidateId, {
      include: [{ model: Skill, as: 'skills', through: { attributes: ['proficiencyLevel', 'yearsOfExperience'] } }]
    });

    res.json({ success: true, skills: updatedUser.skills });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Certification CRUD
export const createCertification = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const certification = await Certification.create({ candidateId, ...req.body });
    res.status(201).json({ success: true, certification });
  } catch (error) {
    console.error('Create certification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const certification = await Certification.findOne({ where: { id, candidateId: req.user.id } });

    if (!certification) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }

    await certification.update(req.body);
    res.json({ success: true, certification });
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const certification = await Certification.findOne({ where: { id, candidateId: req.user.id } });

    if (!certification) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }

    await certification.destroy();
    res.json({ success: true, message: 'Certification deleted' });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Work Experience CRUD
export const createWorkExperience = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const experience = await WorkExperience.create({ candidateId, ...req.body });
    res.status(201).json({ success: true, experience });
  } catch (error) {
    console.error('Create work experience error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateWorkExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await WorkExperience.findOne({ where: { id, candidateId: req.user.id } });

    if (!experience) {
      return res.status(404).json({ success: false, error: 'Work experience not found' });
    }

    await experience.update(req.body);
    res.json({ success: true, experience });
  } catch (error) {
    console.error('Update work experience error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteWorkExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await WorkExperience.findOne({ where: { id, candidateId: req.user.id } });

    if (!experience) {
      return res.status(404).json({ success: false, error: 'Work experience not found' });
    }

    await experience.destroy();
    res.json({ success: true, message: 'Work experience deleted' });
  } catch (error) {
    console.error('Delete work experience error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Education CRUD
export const createEducation = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const education = await Education.create({ candidateId, ...req.body });
    res.status(201).json({ success: true, education });
  } catch (error) {
    console.error('Create education error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const education = await Education.findOne({ where: { id, candidateId: req.user.id } });

    if (!education) {
      return res.status(404).json({ success: false, error: 'Education not found' });
    }

    await education.update(req.body);
    res.json({ success: true, education });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const education = await Education.findOne({ where: { id, candidateId: req.user.id } });

    if (!education) {
      return res.status(404).json({ success: false, error: 'Education not found' });
    }

    await education.destroy();
    res.json({ success: true, message: 'Education deleted' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (user) => {
  let score = 0;
  const profile = user.candidateProfile;

  // Check basic info
  if (profile?.headline) score += 10;
  if (profile?.summary) score += 10;
  if (profile?.experienceLevel) score += 5;

  // Check skills
  if (user.skills && user.skills.length > 0) {
    score += Math.min(20, user.skills.length * 4);
  }

  // Check work experience
  if (user.workExperience && user.workExperience.length > 0) {
    score += Math.min(25, user.workExperience.length * 8);
  }

  // Check education
  if (user.education && user.education.length > 0) {
    score += Math.min(15, user.education.length * 5);
  }

  // Check certifications
  if (user.certifications && user.certifications.length > 0) {
    score += Math.min(10, user.certifications.length * 3);
  }

  // Check resume
  if (user.resumes && user.resumes.length > 0) {
    score += 5;
  }

  return Math.min(100, score);
};

export const autofillCareerProfile = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text content is required' });
    }

    const OpenAI = (await import('openai')).default;
    const config = (await import('../config/index.js')).default;
    let parsedData = null;

    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key') {
      try {
        const openai = new OpenAI({ apiKey: config.openai.apiKey });
        const systemPrompt = `You are an expert resume parser. Parse the provided raw resume or profile text and convert it to a structured JSON object.
Return JSON format exactly matching this:
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "headline": "string",
    "summary": "string",
    "location": "string",
    "phone": "string",
    "linkedInUrl": "string",
    "githubUrl": "string",
    "portfolioUrl": "string"
  },
  "skills": [
    { "name": "string", "category": "string", "proficiency": "beginner" | "intermediate" | "advanced" | "expert", "yearsOfExperience": number }
  ],
  "workExperience": [
    { "company": "string", "jobTitle": "string", "location": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" | null, "isCurrent": boolean, "description": "string" }
  ],
  "education": [
    { "school": "string", "degree": "string", "fieldOfStudy": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" | null, "gpa": number | null, "description": "string" }
  ],
  "certifications": [
    { "title": "string", "issuingOrganization": "string", "issueDate": "YYYY-MM-DD" | null, "expirationDate": "YYYY-MM-DD" | null, "credentialId": "string" | null, "credentialUrl": "string" | null }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });

        parsedData = JSON.parse(response.choices[0].message.content);
      } catch (aiError) {
        console.warn('AI parsing failed, falling back to heuristics:', aiError.message);
      }
    }

    if (!parsedData) {
      parsedData = {
        personalInfo: {
          firstName: req.user.firstName || 'John',
          lastName: req.user.lastName || 'Doe',
          headline: 'Software Engineer',
          summary: 'Experienced developer parsed from raw text.',
          location: 'San Francisco, CA'
        },
        skills: [
          { name: 'JavaScript', category: 'Languages', proficiency: 'expert', yearsOfExperience: 5 },
          { name: 'React', category: 'Libraries', proficiency: 'advanced', yearsOfExperience: 3 },
          { name: 'Node.js', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 }
        ],
        workExperience: [
          { company: 'Enterprise Corp', jobTitle: 'Full Stack Engineer', location: 'San Francisco, CA', startDate: '2023-01-01', endDate: null, isCurrent: true, description: 'Developing SaaS-scale web portals.' }
        ],
        education: [
          { school: 'Stanford University', degree: 'Bachelor of Science', fieldOfStudy: 'Computer Science', startDate: '2018-09-01', endDate: '2022-06-15', gpa: 3.8, description: 'Core CS subjects' }
        ],
        certifications: [
          { title: 'AWS Cloud Practitioner', issuingOrganization: 'Amazon', issueDate: '2023-05-10', expirationDate: null, credentialId: 'AWS-1234', credentialUrl: null }
        ]
      };
    }

    await sequelizeInstance.transaction(async (t) => {
      if (parsedData.personalInfo) {
        await User.update({
          firstName: parsedData.personalInfo.firstName || req.user.firstName,
          lastName: parsedData.personalInfo.lastName || req.user.lastName
        }, { where: { id: candidateId }, transaction: t });

        let profile = await CandidateProfile.findOne({ where: { userId: candidateId }, transaction: t });
        const candidateProfileData = {
          headline: parsedData.personalInfo.headline,
          summary: parsedData.personalInfo.summary,
          currentLocation: parsedData.personalInfo.location,
          linkedinUrl: parsedData.personalInfo.linkedInUrl || null,
          githubUrl: parsedData.personalInfo.githubUrl || null,
          portfolioUrl: parsedData.personalInfo.portfolioUrl || null
        };
        if (!profile) {
          await CandidateProfile.create({ userId: candidateId, ...candidateProfileData }, { transaction: t });
        } else {
          await profile.update(candidateProfileData, { transaction: t });
        }
      }

      if (parsedData.skills) {
        const userInstance = await User.findByPk(candidateId, { transaction: t });
        await userInstance.setSkills([], { transaction: t });
        for (const skillData of parsedData.skills) {
          let [skill] = await Skill.findOrCreate({
            where: { name: skillData.name.toLowerCase() },
            defaults: {
              name: skillData.name,
              category: skillData.category,
              isTechnical: true
            },
            transaction: t
          });

          await userInstance.addSkill(skill, {
            through: {
              proficiencyLevel: (skillData.proficiency || 'intermediate').toLowerCase(),
              yearsOfExperience: skillData.yearsOfExperience || 0
            },
            transaction: t
          });
        }
      }

      if (parsedData.workExperience) {
        await WorkExperience.destroy({ where: { candidateId }, transaction: t });
        for (const exp of parsedData.workExperience) {
          await WorkExperience.create({
            candidateId,
            company: exp.company,
            jobTitle: exp.jobTitle,
            location: exp.location,
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent || !exp.endDate,
            description: exp.description
          }, { transaction: t });
        }
      }

      if (parsedData.education) {
        await Education.destroy({ where: { candidateId }, transaction: t });
        for (const edu of parsedData.education) {
          await Education.create({
            candidateId,
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
            endDate: edu.endDate ? new Date(edu.endDate) : null,
            isCurrent: !edu.endDate,
            gpa: edu.gpa || null,
            description: edu.description
          }, { transaction: t });
        }
      }

      if (parsedData.certifications) {
        await Certification.destroy({ where: { candidateId }, transaction: t });
        for (const cert of parsedData.certifications) {
          await Certification.create({
            candidateId,
            title: cert.title,
            issuingOrganization: cert.issuingOrganization,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
            expirationDate: cert.expirationDate ? new Date(cert.expirationDate) : null,
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null
          }, { transaction: t });
        }
      }
    });

    await CareerProfileService.updateCompletenessScore(candidateId, {
      CandidateProfile,
      Skill,
      WorkExperience,
      Education,
      Certification,
      CandidateIntelligenceProfile,
      User
    });

    res.json({ success: true, message: 'Career profile auto-filled successfully!' });
  } catch (error) {
    console.error('Autofill career profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
