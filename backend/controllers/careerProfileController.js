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
