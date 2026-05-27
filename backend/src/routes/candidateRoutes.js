const express = require("express");
const {
  createCandidate,
  deleteCandidate,
  getCandidates,
  getShortlistedCandidates,
  rankAllCandidates,
  rankCandidate,
  resetCandidates,
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
router.get("/shortlisted", getShortlistedCandidates);
router.post("/rank-all", rankAllCandidates);
router.post("/reset", authorizeRoles("admin"), resetCandidates);
router.delete("/", authorizeRoles("admin"), resetCandidates);
router.post("/:id/upload-resume", uploadPdf.resume.single("resume"), uploadResume);
router.post("/:id/rank", rankCandidate);
router.put("/:id/shortlist", shortlistCandidate);
router.delete("/:id", deleteCandidate);

module.exports = router;
