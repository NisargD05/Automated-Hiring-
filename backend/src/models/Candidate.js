const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: String,
    location: String,
    currentRole: String,
    experienceYears: Number,
    skills: [String],
    education: [
      {
        degree: String,
        institution: String,
        year: String
      }
    ],
    links: [
      {
        label: String,
        url: String
      }
    ],
    resume: {
      fileName: String,
      text: String,
      highlights: [String],
      projects: [String],
      certifications: [String]
    },
    aiSummary: String,
    match: {
      score: Number,
      matchedSkills: [String],
      missingSkills: [String],
      riskNotes: [String],
      explanation: String
    },
    status: {
      type: String,
      enum: ["new", "shortlisted", "assigned", "interview_scheduled", "rejected"],
      default: "assigned"
    }
  },
  {
    timestamps: true
  }
);

candidateSchema.index({ email: 1 });

module.exports = mongoose.model("Candidate", candidateSchema);
