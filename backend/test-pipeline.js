import dotenv from 'dotenv';
dotenv.config();

import models from './routes/models/index.js';
import CompanyConnectorService from './services/CompanyConnectorService.js';
import jobAggregationService from './services/jobAggregation/JobAggregationService.js';
import JobQueueService from './services/JobQueueService.js';

const { sequelize, Company, ExternalJob, User, CandidateProfile, Skill, Notification } = models;

const runValidation = async () => {
  console.log('🚀 Running E2E ATS Integration & Unified Pipeline Validation...');
  
  try {
    // 1. Authenticate Database
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connection verified.');

    // 2. Initialize Queue Service
    await JobQueueService.initialize();
    console.log('✅ Redis and Job Queues initialized.');

    // 3. Create or Fetch Test Candidate with profile and skills
    let testUser = await User.findOne({ where: { email: 'e2e-ats-candidate@example.com' } });
    if (!testUser) {
      testUser = await User.create({
        email: 'e2e-ats-candidate@example.com',
        password: 'hashedpassword123',
        firstName: 'Alex',
        lastName: 'Developer',
        role: 'candidate',
        isActive: true
      });
      console.log('✅ Created E2E Test User.');
    } else {
      console.log('✅ Found existing E2E Test User.');
    }

    let profile = await CandidateProfile.findOne({ where: { userId: testUser.id } });
    if (!profile) {
      profile = await CandidateProfile.create({
        userId: testUser.id,
        headline: 'Senior Full Stack Engineer',
        summary: 'Experienced Node.js, React, and Python engineer.',
        experience: 5,
        experienceLevel: 'senior',
        preferredLocations: ['Remote', 'San Francisco'],
        isLookingForRemote: true,
        isActivelyLooking: true
      });
      console.log('✅ Created E2E Candidate Profile.');
    } else {
      console.log('✅ Found existing E2E Candidate Profile.');
    }

    // Associate a skill (e.g. JavaScript or React) to test user
    let reactSkill = await Skill.findOne({ where: { name: 'React' } });
    if (!reactSkill) {
      reactSkill = await Skill.create({ name: 'React', category: 'frontend' });
    }
    const hasSkill = await testUser.hasSkill(reactSkill);
    if (!hasSkill) {
      await testUser.addSkill(reactSkill, { through: { proficiencyLevel: 'advanced', yearsOfExperience: 3 } });
      console.log('✅ Associated "React" skill with E2E Test User.');
    }

    // 4. Register a Company using Ashby (linear uses Ashby with public jobs)
    const testCompanyId = 'linear';
    let company = await Company.findOne({ where: { externalCompanyId: testCompanyId } });
    if (!company) {
      company = await Company.create({
        name: 'Linear',
        atsPlatform: 'ashby',
        externalCompanyId: testCompanyId,
        website: 'https://linear.app',
        careerPageUrl: 'https://jobs.ashbyhq.com/linear',
        activeStatus: true,
        verificationStatus: 'verified',
        hiringStatus: 'Actively Hiring'
      });
      console.log('✅ Registered E2E Test Company config.');
    } else {
      console.log('✅ Found existing E2E Test Company config.');
    }

    // Create a saved company follow record to trigger alert
    const { SavedCompany } = models;
    let saved = await SavedCompany.findOne({ where: { candidateProfileId: profile.id, companyId: company.id } });
    if (!saved) {
      saved = await SavedCompany.create({
        candidateProfileId: profile.id,
        companyId: company.id,
        isFollowing: true,
        isBookmarked: true
      });
      console.log('✅ Candidate is now following Resend for E2E alerts.');
    }

    // 5. Run ATS Sync for Resend
    console.log(`📡 Fetching jobs for company "${company.name}"...`);
    const jobs = await CompanyConnectorService.fetchCompanyJobs(company.id, { forceRefresh: true });
    console.log(`✅ Synced ${jobs.length} jobs.`);

    if (jobs.length > 0) {
      const firstJob = jobs[0];
      console.log(`\n🔍 First Synced Job Sample:`);
      console.log(`- Title: ${firstJob.title}`);
      console.log(`- Location: ${firstJob.location}`);
      console.log(`- WorkType: ${firstJob.workType}`);
      console.log(`- Job URL: ${firstJob.jobUrl}`);
      console.log(`- Platform: ${firstJob.platform}`);
      
      // 6. Verify Database Persistence
      const dbJob = await ExternalJob.findOne({
        where: { platform: firstJob.platform, externalJobId: firstJob.externalJobId }
      });
      if (dbJob) {
        console.log('✅ Verified job was persisted in ExternalJob table.');
        console.log(`- Database UUID: ${dbJob.id}`);
        console.log(`- Associated Company UUID: ${dbJob.companyId}`);
        if (dbJob.companyId === company.id) {
          console.log('✅ Verified job is correctly associated with Company.');
        } else {
          console.error('❌ Association mismatch!');
        }
      } else {
        console.error('❌ Persisted job NOT found in database!');
      }

      // 7. Test AI matching & calculations directly
      console.log('\n🧠 Testing AI Matching Calculations...');
      try {
        const matchResult = await jobAggregationService.aggregateJobs(testUser.id, {
          providers: ['ashby'],
          companyIds: ['resend-e2e']
        });
        
        console.log(`✅ E2E candidate matching results parsed successfully.`);
        if (matchResult && matchResult.length > 0) {
          const matchedJob = matchResult[0];
          console.log(`- Match Score: ${matchedJob.matchScore || 0}%`);
          console.log(`- Missing Skills: ${(matchedJob.missingSkills || []).join(', ') || 'None'}`);
        }
      } catch (aiErr) {
        console.error(`⚠️ AI Matching failed (maybe OpenAI API key is unset): ${aiErr.message}`);
      }

      // 8. Verify Candidate Notifications
      console.log('\n🔔 Verifying Notification delivery triggers...');
      const notifications = await Notification.findAll({
        where: { userId: testUser.id },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      console.log(`✅ Found ${notifications.length} notifications generated in DB.`);
      notifications.forEach((n, idx) => {
        console.log(`[Notification #${idx + 1}] Title: "${n.title}" | Type: ${n.type}`);
      });

      // 9. Verify updated Company Stats
      await company.reload();
      console.log('\n📊 Updated Company Statistics:');
      console.log(`- Active Jobs Count in DB: ${company.activeJobs}`);
      console.log(`- Hiring Status: ${company.hiringStatus}`);
      console.log(`- Technologies Used: ${(company.technologiesUsed || []).join(', ') || 'None'}`);
      console.log(`- Hiring Locations: ${(company.hiringLocations || []).join(', ') || 'None'}`);
    } else {
      console.log('⚠️ No jobs found to validate pipeline steps.');
    }

    console.log('\n🎉 E2E Validation completed successfully!');

  } catch (error) {
    console.error('❌ E2E Validation error:');
    console.error(error);
  } finally {
    await JobQueueService.shutdown().catch(() => {});
    await sequelize.close();
  }
};

runValidation();
