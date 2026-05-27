const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewRequest",
      required: true,
      unique: true,
      index: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true
    },
    candidateName: {
      type: String,
      trim: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    interviewerEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    candidateEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    preferredWindow: {
      startDate: Date,
      endDate: Date
    },
    selectedDate: {
      type: String,
      trim: true
    },
    selectedTime: {
      type: String,
      trim: true
    },
    meetingLink: {
      type: String,
      required: true,
      unique: true
    },
    meetingRoomId: {
      type: String,
      required: true,
      unique: true
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    roundType: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "feedback_submitted", "selected", "rejected", "next_round", "cancelled"],
      default: "scheduled",
      index: true
    },
    interviewStatus: {
      type: String,
      enum: ["scheduled", "completed", "feedback_submitted", "selected", "rejected", "next_round", "cancelled"],
      default: "scheduled"
    },
    emailStatus: {
      interviewer: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped"],
        default: "pending"
      },
      candidate: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped"],
        default: "pending"
      },
      error: {
        type: String,
        default: ""
      },
      lastAttemptAt: {
        type: Date,
        default: null
      }
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewFeedback"
    }
  },
  {
    timestamps: true
  }
);

interviewSchema.index({ interviewerId: 1, scheduledAt: 1 });
interviewSchema.index({ recruiterId: 1, scheduledAt: -1 });

module.exports = mongoose.model("Interview", interviewSchema);
