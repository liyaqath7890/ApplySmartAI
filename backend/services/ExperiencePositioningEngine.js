class ExperiencePositioningEngine {
  positionExperience(candidateType, experience, projects, skills) {
    const positioning = {
      professionalSummary: '',
      resumeSummary: '',
      linkedinSummary: '',
      recruiterIntroduction: ''
    };

    switch (candidateType) {
      case 'FRESHER':
        positioning.professionalSummary = 'Passionate developer with hands-on project experience in modern web technologies.';
        positioning.linkedinSummary = 'Recent graduate with a focus on building practical, user-centric applications. Skilled in React, JavaScript, and eager to contribute to a dynamic team.';
        break;
      case 'INTERN':
        positioning.professionalSummary = 'Developer with practical industry experience from internships, contributing to real-world projects.';
        positioning.linkedinSummary = 'Internship-trained developer with experience in agile teams and production environments.';
        break;
      case 'STARTUP_EMPLOYEE':
        positioning.professionalSummary = 'Versatile developer with startup experience, adept at fast-paced product development.';
        positioning.linkedinSummary = 'Startup veteran with experience in end-to-end product development and scaling applications.';
        break;
      case 'CAREER_SWITCHER':
        positioning.professionalSummary = 'Career switcher bringing unique perspectives from previous industries, now focused on software development.';
        break;
      case 'RETURN_TO_WORK':
        positioning.professionalSummary = 'Returning professional with strong foundational skills and recent upskilling in modern technologies.';
        break;
      case 'JUNIOR_PROFESSIONAL':
        positioning.professionalSummary = 'Junior software engineer with professional experience building production applications.';
        break;
    }

    return positioning;
  }

  positionGap(gapActivities) {
    let explanation = 'During this time, I focused on:';
    const activities = [];

    if (gapActivities?.skillDevelopment) {
      activities.push('Developing new technical skills');
    }
    if (gapActivities?.internships) {
      activities.push('Gaining practical internship experience');
    }
    if (gapActivities?.freelance) {
      activities.push('Completing freelance projects');
    }
    if (gapActivities?.personalProjects) {
      activities.push('Building personal projects to strengthen skills');
    }
    if (gapActivities?.certifications) {
      activities.push('Earning industry certifications');
    }

    if (activities.length > 0) {
      explanation += ' ' + activities.join(', ') + '.';
    } else {
      explanation = 'During this period, I took time to focus on personal growth and skill development.';
    }

    return {
      recruiterExplanation: explanation,
      interviewAnswer: explanation
    };
  }
}

export default new ExperiencePositioningEngine();
