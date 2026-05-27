const mongoose = require("mongoose");

const interviewFeedbackSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      unique: true,
      index: true
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true
    },
    technicalRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    communicationRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    problemSolvingRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    cultureFitRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    recommendation: {
      type: String,
      enum: ["selected", "rejected", "next_round"],
      required: true,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InterviewFeedback", interviewFeedbackSchema);
