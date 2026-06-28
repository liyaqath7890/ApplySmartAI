class PersonalAICareerAgent {
  generateDailyReport(applications, jobs, interviews, recruiters) {
    const highMatchJobs = jobs.filter(j => j.matchScore > 75);
    return {
      jobsFound: jobs.length,
      highMatchJobs: highMatchJobs.length,
      applicationsSubmitted: applications.filter(a => a.status === 'submitted' || a.status === 'pending').length,
      recruitersContacted: recruiters.length,
      interviewsScheduled: interviews.filter(i => i.status === 'scheduled').length,
      skillsRecommended: ['TypeScript', 'Testing'],
      timestamp: new Date().toISOString()
    };
  }

  prioritizeOpportunities(jobs, candidateProfile, projects) {
    return jobs
      .map(job => {
        let score = job.matchScore || 0;

        // Boost for relevant projects
        if (projects?.some(p => job.atsKeywords?.some(k => p.technologies?.includes(k)))) {
          score += 10;
        }

        // Boost for internship experience
        if (candidateProfile?.candidateType === 'INTERN' && job.title?.toLowerCase().includes('intern')) {
          score += 15;
        }

        // Don't penalize too heavily for lack of formal experience
        return { ...job, priorityScore: Math.min(score, 100) };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

export default new PersonalAICareerAgent();
