const express = require("express");
const {
  createCandidate,
  getCandidates,
  rankAllCandidates,
  rankCandidate,
  shortlistCandidate,
  uploadResume
} = require("../controllers/candidateController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const uploadPdf = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin", "recruiter"));

router.post("/", createCandidate);
router.get("/", getCandidates);
router.post("/rank-all", rankAllCandidates);
router.post("/:id/upload-resume", uploadPdf.resume.single("resume"), uploadResume);
router.post("/:id/rank", rankCandidate);
router.put("/:id/shortlist", shortlistCandidate);

module.exports = router;
