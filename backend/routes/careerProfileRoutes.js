import express from 'express';
import {
  getCareerProfile,
  updateCandidateProfile,
  updateSkills,
  createCertification,
  updateCertification,
  deleteCertification,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  createEducation,
  updateEducation,
  deleteEducation
} from '../controllers/careerProfileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Career Profile
router.get('/', getCareerProfile);
router.put('/', updateCandidateProfile);

// Skills
router.put('/skills', updateSkills);

// Certifications
router.post('/certifications', createCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Work Experience
router.post('/experience', createWorkExperience);
router.put('/experience/:id', updateWorkExperience);
router.delete('/experience/:id', deleteWorkExperience);

// Education
router.post('/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

export default router;
