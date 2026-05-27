const express = require("express");
const {
  getInterviewById,
  getInterviewReview,
  getInterviewerInterviews,
  getRecruiterInterviews,
  acceptCandidate,
  rejectCandidate,
  submitFeedback,
  updateEmailStatus
} = require("../controllers/interviewController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/interviewer", authorizeRoles("interviewer"), getInterviewerInterviews);
router.get("/recruiter", authorizeRoles("admin", "recruiter"), getRecruiterInterviews);
router.put("/:id/email-status", authorizeRoles("admin", "recruiter", "interviewer"), updateEmailStatus);
router.get("/:id/review", authorizeRoles("admin", "recruiter"), getInterviewReview);
router.post("/:id/accept", authorizeRoles("admin", "recruiter"), acceptCandidate);
router.post("/:id/reject", authorizeRoles("admin", "recruiter"), rejectCandidate);
router.get("/:id", authorizeRoles("admin", "recruiter", "interviewer"), getInterviewById);
router.post("/:id/feedback", authorizeRoles("interviewer"), submitFeedback);
router.put("/:id/feedback", authorizeRoles("interviewer"), submitFeedback);

module.exports = router;
