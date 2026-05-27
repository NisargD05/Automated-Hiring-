const express = require("express");
const {
  generateInterviewPacket,
  getInterviewPacket,
  regenerateInterviewPacket
} = require("../controllers/interviewAgentController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/generate/:candidateId", authorizeRoles("admin", "recruiter", "interviewer"), generateInterviewPacket);
router.get("/:interviewId", authorizeRoles("admin", "recruiter", "interviewer"), getInterviewPacket);
router.post("/regenerate/:interviewId", authorizeRoles("admin", "recruiter", "interviewer"), regenerateInterviewPacket);

module.exports = router;
