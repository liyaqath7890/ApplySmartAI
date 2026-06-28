class CareerProfileService {
  static calculateProfileCompleteness(profile, data) {
    const {
      skills,
      workExperience,
      education,
      certifications,
      projects
    } = data;

    let score = 0;
    const maxScore = 100;

    // Personal info (15 points)
    if (profile.headline?.trim()) score += 5;
    if (profile.summary?.trim()) score += 5;
    if (profile.currentLocation?.trim()) score += 5;

    // Contact & links (15 points)
    if (profile.linkedinUrl?.trim()) score += 5;
    if (profile.githubUrl?.trim()) score += 5;
    if (profile.portfolioUrl?.trim()) score += 5;

    // Education (15 points)
    if (education && education.length > 0) score += 15;

    // Work experience (15 points)
    if (workExperience && workExperience.length > 0) score += 15;

    // Skills (20 points)
    if (skills && skills.length >= 5) {
      score += 20;
    } else if (skills && skills.length >= 3) {
      score += 12;
    } else if (skills && skills.length > 0) {
      score += 5;
    }

    // Certifications (10 points)
    if (certifications && certifications.length > 0) score += 10;

    // Projects (10 points)
    if (projects && projects.length >= 2) {
      score += 10;
    } else if (projects && projects.length > 0) {
      score += 5;
    }

    // Career goals (5 points)
    if (profile.expectedSalary && profile.preferredRoles?.length > 0) {
      score += 5;
    }

    return Math.min(score, maxScore);
  }

  static async updateCompletenessScore(candidateId, models) {
    try {
      const [
        profile,
        skills,
        workExperience,
        education,
        certifications,
        projects
      ] = await Promise.all([
        models.CandidateProfile.findOne({
          where: { userId: candidateId }
        }),
        models.Skill.findAll({
          include: [
            {
              model: models.User,
              as: 'candidates',
              where: { id: candidateId }
            }
          ]
        }),
        models.WorkExperience.findAll({
          where: { candidateId }
        }),
        models.Education.findAll({
          where: { candidateId }
        }),
        models.Certification.findAll({
          where: { candidateId }
        }),
        // For now, projects are stored in CandidateIntelligenceProfile
        models.CandidateIntelligenceProfile.findOne({
          where: { candidateId }
        })
      ]);

      if (!profile) {
        return null;
      }

      const completenessScore = this.calculateProfileCompleteness(profile, {
        skills,
        workExperience,
        education,
        certifications,
        projects: projects?.projects || []
      });

      await profile.update({ profileCompletenessScore: completenessScore });

      return completenessScore;
    } catch (error) {
      console.error('Error updating profile completeness:', error);
      return null;
    }
  }

  static async getUnifiedProfile(candidateId, models) {
    try {
      const user = await models.User.findByPk(candidateId, {
        include: [
          { model: models.CandidateProfile, as: 'candidateProfile' },
          { model: models.Skill, as: 'skills', through: { attributes: ['proficiencyLevel', 'yearsOfExperience'] } },
          { model: models.WorkExperience, as: 'workExperience' },
          { model: models.Education, as: 'education' },
          { model: models.Certification, as: 'certifications' },
          { model: models.Resume, as: 'resumes', where: { isPrimary: true }, required: false }
        ]
      });

      if (!user) {
        throw new Error('Candidate not found');
      }

      return user;
    } catch (error) {
      console.error('Error fetching unified profile:', error);
      throw error;
    }
  }
}

export default CareerProfileService;
