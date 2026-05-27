const Interview = require("../models/Interview");
const InterviewFeedback = require("../models/InterviewFeedback");
const InterviewRequest = require("../models/InterviewRequest");
const Candidate = require("../models/Candidate");
const logger = require("../utils/logger");

const interviewPopulate = [
  {
    path: "candidateId",
    select: "name email phone currentCompany yearsOfExperience status resumeDocument latestEvaluation notes",
    populate: [
      { path: "resumeDocument", select: "originalFileName resumeText parsedSections filePath" },
      { path: "latestEvaluation" }
    ]
  },
  { path: "jobId", select: "roleName department location skills mandatoryRequirements experienceRequired approvedJD" },
  { path: "recruiterId", select: "name email role" },
  { path: "interviewerId", select: "name email role" },
  { path: "requestId", select: "roundType duration notes preferredWindow status" },
  { path: "feedbackId" }
];

const getInterviewerInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      interviewerId: req.user._id,
      status: { $ne: "cancelled" }
    })
      .populate(interviewPopulate)
      .sort({ scheduledAt: 1 });

    logger.info("[Interview] interviewer interviews fetched", {
      interviewerId: req.user._id.toString(),
      count: interviews.length
    });

    res.json({ success: true, interviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load interviews", error: error.message });
  }
};

const getRecruiterInterviews = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { recruiterId: req.user._id };
    const interviews = await Interview.find(filter)
      .populate(interviewPopulate)
      .sort({ scheduledAt: -1 });

    logger.info("[Interview] recruiter interviews fetched", {
      userId: req.user._id.toString(),
      role: req.user.role,
      count: interviews.length
    });

    res.json({ success: true, interviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load recruiter interviews", error: error.message });
  }
};

const getInterviewById = async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === "interviewer") {
      filter.interviewerId = req.user._id;
    } else if (req.user.role === "recruiter") {
      filter.recruiterId = req.user._id;
    }

    const interview = await Interview.findOne(filter).populate(interviewPopulate);

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    res.json({ success: true, interview });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load interview", error: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewerId: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    if (interview.feedbackId) {
      return res.status(409).json({ success: false, message: "Feedback has already been submitted" });
    }

    const {
      technicalRating,
      communicationRating,
      problemSolvingRating,
      cultureFitRating,
      recommendation,
      notes
    } = req.body;

    if (!technicalRating || !communicationRating || !problemSolvingRating || !cultureFitRating || !recommendation || !notes?.trim()) {
      return res.status(400).json({ success: false, message: "All ratings, recommendation, and detailed notes are required" });
    }

    const feedback = await InterviewFeedback.create({
      interviewId: interview._id,
      interviewerId: req.user._id,
      candidateId: interview.candidateId,
      technicalRating: Number(technicalRating),
      communicationRating: Number(communicationRating),
      problemSolvingRating: Number(problemSolvingRating),
      cultureFitRating: Number(cultureFitRating),
      recommendation,
      notes: notes.trim()
    });

    interview.feedbackId = feedback._id;
    interview.status = recommendation;
    interview.interviewStatus = recommendation;
    await interview.save();

    await InterviewRequest.findByIdAndUpdate(interview.requestId, {
      status: recommendation
    });

    await Candidate.findByIdAndUpdate(interview.candidateId, {
      status: recommendation === "rejected" ? "rejected" : "review"
    });

    const hydrated = await Interview.findById(interview._id).populate(interviewPopulate);
    res.json({
      success: true,
      message: "Feedback submitted",
      feedback,
      interview: hydrated
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to submit feedback"
    });
  }
};

const updateEmailStatus = async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === "interviewer") {
      filter.interviewerId = req.user._id;
    } else if (req.user.role === "recruiter") {
      filter.recruiterId = req.user._id;
    }

    const interview = await Interview.findOne(filter);

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    const nextStatus = {
      interviewer: req.body.interviewer || interview.emailStatus?.interviewer || "pending",
      candidate: req.body.candidate || interview.emailStatus?.candidate || "pending",
      error: req.body.error || "",
      lastAttemptAt: new Date()
    };

    interview.emailStatus = nextStatus;
    await interview.save();

    if (interview.requestId) {
      await InterviewRequest.findByIdAndUpdate(interview.requestId, {
        emailStatus: nextStatus,
        status: nextStatus.error ? "email_failed" : "email_sent"
      });
    }

    logger.info("[Email] interview email status updated", {
      interviewId: interview._id.toString(),
      requestId: interview.requestId?.toString() || null,
      emailStatus: nextStatus
    });

    res.json({
      success: true,
      message: "Email status updated",
      interview: await Interview.findById(interview._id).populate(interviewPopulate)
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to update email status"
    });
  }
};

module.exports = {
  getInterviewById,
  getInterviewerInterviews,
  getRecruiterInterviews,
  submitFeedback,
  updateEmailStatus
};
