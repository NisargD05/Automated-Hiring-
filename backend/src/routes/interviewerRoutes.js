const express = require("express");
const {
  getMyAssignment,
  getMyAssignments,
  getMySchedules,
  seedInterviewerDemo,
  selectInterviewSlot
} = require("../controllers/interviewerController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("interviewer"));

router.get("/assignments", getMyAssignments);
router.get("/assignments/:assignmentId", getMyAssignment);
router.post("/assignments/:assignmentId/select-slot", selectInterviewSlot);
router.get("/schedules", getMySchedules);
router.post("/seed-demo", seedInterviewerDemo);

module.exports = router;
