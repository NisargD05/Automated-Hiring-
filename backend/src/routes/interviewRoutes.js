const express = require("express");
const {
  getInterviewById,
  getInterviewerInterviews,
  getRecruiterInterviews,
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
router.get("/:id", authorizeRoles("admin", "recruiter", "interviewer"), getInterviewById);
router.put("/:id/feedback", authorizeRoles("interviewer"), submitFeedback);

module.exports = router;
