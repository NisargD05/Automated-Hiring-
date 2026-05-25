const Candidate = require("../models/Candidate");
const CandidateEvaluation = require("../models/CandidateEvaluation");
const CandidateResume = require("../models/CandidateResume");
const Job = require("../models/Job");
const { parseCandidateResume, rankCandidate: requestCandidateRanking } = require("../services/aiServiceClient");
const logger = require("../utils/logger");

const populateCandidateQuery = (query) =>
  query
    .populate("job", "roleName department skills seniorityLevel mandatoryRequirements experienceRequired status")
    .populate("resumeDocument")
    .populate("latestEvaluation");

const normalizeCandidateInput = (body) => ({
  name: body.name?.trim(),
  email: body.email?.trim().toLowerCase(),
  phone: body.phone?.trim(),
  job: body.jobId || body.job,
  currentCompany: body.currentCompany?.trim() || "",
  yearsOfExperience:
    body.yearsOfExperience === "" || body.yearsOfExperience === undefined
      ? null
      : Number(body.yearsOfExperience),
  source: body.source?.trim() || "Manual upload",
  notes: body.notes?.trim() || ""
});

const ensureApprovedJob = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    const error = new Error("Selected job was not found");
    error.status = 404;
    throw error;
  }

  if (job.status !== "approved") {
    const error = new Error("Candidates can only be ranked against approved jobs");
    error.status = 400;
    throw error;
  }

  logger.info("[JD Fetcher] Job found", {
    jobId: job._id.toString(),
    roleName: job.roleName,
    requiredSkillsCount: String(job.skills || "")
      .split(/[,;\n]+/)
      .map((skill) => skill.trim())
      .filter(Boolean).length,
    mandatoryRequirementsCount: String(job.mandatoryRequirements || "")
      .split(/[,;\n]+/)
      .map((requirement) => requirement.trim())
      .filter(Boolean).length,
    approvedJdLength: (job.approvedJD || "").length
  });

  return job;
};

const formatJobPayload = (job) => ({
  _id: job._id.toString(),
  roleName: job.roleName,
  department: job.department,
  requiredSkills: job.skills,
  mandatoryRequirements: job.mandatoryRequirements,
  seniorityLevel: job.seniorityLevel,
  experienceRequired: job.experienceRequired,
  fullJDText: job.approvedJD || job.generatedJD || ""
});

const createCandidate = async (req, res) => {
  try {
    const payload = normalizeCandidateInput(req.body);

    if (!payload.name || !payload.email || !payload.phone || !payload.job) {
      return res.status(400).json({
        message: "Candidate name, email, phone number, and approved job are required"
      });
    }

    await ensureApprovedJob(payload.job);

    const candidate = await Candidate.create({
      ...payload,
      createdBy: req.user._id
    });

    const hydrated = await populateCandidateQuery(Candidate.findById(candidate._id));
    res.status(201).json({ message: "Candidate created", candidate: hydrated });
  } catch (error) {
    logger.error("Failed to create candidate", {
      userId: req.user?._id?.toString(),
      error: error.message
    });
    res.status(error.status || 500).json({ message: error.message || "Failed to create candidate" });
  }
};

const uploadResume = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF is required" });
    }

    await ensureApprovedJob(candidate.job);

    candidate.rankingStatus = "parsing";
    candidate.rankingError = "";
    await candidate.save();

    const parsed = await parseCandidateResume({
      filePath: req.file.path,
      originalFileName: req.file.originalname
    });

    logger.info("[Resume Parser] AI service returned parsed resume", {
      candidateId: candidate._id.toString(),
      resumeTextLength: (parsed.resumeText || "").length,
      skillsCount: parsed.parsedSections?.skills?.length || 0,
      projectsCount: parsed.parsedSections?.projects?.length || 0,
      experienceCount: parsed.parsedSections?.experience?.length || 0
    });

    const resume = await CandidateResume.create({
      candidate: candidate._id,
      job: candidate.job,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      resumeText: parsed.resumeText || "",
      parsedSections: parsed.parsedSections || {},
      parserMetadata: {
        characterCount: parsed.characterCount || 0,
        extractionEngine: parsed.extractionEngine || "pdfplumber/pypdf",
        parsedAt: new Date()
      }
    });

    candidate.resumeDocument = resume._id;
    candidate.rankingStatus = "ready";
    candidate.latestEvaluation = null;
    await candidate.save();

    const hydrated = await populateCandidateQuery(Candidate.findById(candidate._id));
    res.json({ message: "Resume uploaded and parsed", candidate: hydrated });
  } catch (error) {
    await Candidate.findByIdAndUpdate(req.params.id, {
      rankingStatus: "failed",
      rankingError: error.message
    });

    logger.error("Failed to upload candidate resume", {
      candidateId: req.params.id,
      error: error.message,
      details: error.details
    });
    res.status(error.status || 500).json({
      message: error.message || "Failed to upload and parse resume",
      error: error.message,
      details: error.details || null
    });
  }
};

const saveEvaluation = async ({ candidate, job, ranking }) => {
  const evaluation = await CandidateEvaluation.create({
    candidate: candidate._id,
    job: job._id,
    score: Number(ranking.score) || 0,
    matchesWithJD: ranking.matchesWithJD || [],
    missingWithJD: ranking.missingWithJD || [],
    missingLinks: ranking.missingLinks || [],
    strengths: ranking.strengths || [],
    weaknesses: ranking.weaknesses || [],
    recommendation: ranking.recommendation || "Review",
    rankingReason: ranking.rankingReason || "",
    companyContext: ranking.companyContext || [],
    rawModelOutput: ranking.rawModelOutput || ranking
  });

  candidate.latestEvaluation = evaluation._id;
  candidate.rankingStatus = "ranked";
  candidate.rankingError = "";
  await candidate.save();

  return evaluation;
};

const rankSingleCandidate = async (candidateId) => {
  const candidate = await Candidate.findById(candidateId).populate("resumeDocument");

  if (!candidate) {
    const error = new Error("Candidate not found");
    error.status = 404;
    throw error;
  }

  if (!candidate.resumeDocument || !candidate.resumeDocument.resumeText) {
    const error = new Error("Upload and parse a resume before ranking this candidate");
    error.status = 400;
    throw error;
  }

  const job = await ensureApprovedJob(candidate.job);
  candidate.rankingStatus = "ranking";
  candidate.rankingError = "";
  candidate.latestEvaluation = null;
  await candidate.save();

  const ranking = await requestCandidateRanking({
    candidate: {
      _id: candidate._id.toString(),
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      currentCompany: candidate.currentCompany,
      yearsOfExperience: candidate.yearsOfExperience,
      source: candidate.source,
      notes: candidate.notes
    },
    resume: {
      resumeText: candidate.resumeDocument.resumeText,
      parsedSections: candidate.resumeDocument.parsedSections || {}
    },
    job: formatJobPayload(job)
  });

  logger.info("[Candidate Ranking] AI service returned ranking", {
    candidateId: candidate._id.toString(),
    jobId: job._id.toString(),
    score: ranking.score,
    recommendation: ranking.recommendation,
    matchesCount: ranking.matchesWithJD?.length || 0,
    missingCount: ranking.missingWithJD?.length || 0,
    strengthsCount: ranking.strengths?.length || 0,
    weaknessesCount: ranking.weaknesses?.length || 0
  });

  await saveEvaluation({ candidate, job, ranking });
  return populateCandidateQuery(Candidate.findById(candidate._id));
};

const rankCandidate = async (req, res) => {
  try {
    const candidate = await rankSingleCandidate(req.params.id);
    res.json({ message: "Candidate ranked", candidate });
  } catch (error) {
    await Candidate.findByIdAndUpdate(req.params.id, {
      rankingStatus: "failed",
      rankingError: error.message,
      latestEvaluation: null
    });
    res.status(error.status || 500).json({ message: error.message || "Failed to rank candidate" });
  }
};

const rankAllCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    await ensureApprovedJob(jobId);

    const candidates = await Candidate.find({ job: jobId, resumeDocument: { $exists: true, $ne: null } });
    const rankedCandidates = [];
    const failures = [];

    for (const candidate of candidates) {
      try {
        rankedCandidates.push(await rankSingleCandidate(candidate._id));
      } catch (error) {
        failures.push({ candidateId: candidate._id.toString(), message: error.message });
        await Candidate.findByIdAndUpdate(candidate._id, {
          rankingStatus: "failed",
          rankingError: error.message,
          latestEvaluation: null
        });
      }
    }

    res.json({
      message: "Candidate ranking completed",
      rankedCount: rankedCandidates.length,
      failedCount: failures.length,
      failures,
      candidates: rankedCandidates
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Failed to rank candidates" });
  }
};

const getCandidates = async (req, res) => {
  try {
    const filter = {};
    const sort = {};

    if (req.query.jobId) {
      filter.job = req.query.jobId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    let candidates = await populateCandidateQuery(Candidate.find(filter).sort({ createdAt: -1 }));

    if (req.query.sort === "score") {
      candidates = candidates.sort((a, b) => {
        return (b.latestEvaluation?.score || -1) - (a.latestEvaluation?.score || -1);
      });
    } else if (sort.createdAt) {
      candidates = candidates.sort(sort);
    }

    res.json({ candidates });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidates", error: error.message });
  }
};

const shortlistCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.status = req.body.status === "rejected" ? "rejected" : "shortlisted";
    await candidate.save();

    const hydrated = await populateCandidateQuery(Candidate.findById(candidate._id));
    res.json({ message: "Candidate status updated", candidate: hydrated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update candidate", error: error.message });
  }
};

module.exports = {
  createCandidate,
  uploadResume,
  rankCandidate,
  rankAllCandidates,
  getCandidates,
  shortlistCandidate
};
