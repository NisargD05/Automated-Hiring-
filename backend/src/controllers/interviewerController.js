const Candidate = require("../models/Candidate");
const InterviewAssignment = require("../models/InterviewAssignment");
const InterviewSchedule = require("../models/InterviewSchedule");
const Job = require("../models/Job");
const Questionnaire = require("../models/Questionnaire");
const { generateInterviewMeetingLink } = require("../services/meetingLinkService");

const INTERVIEW_WORKING_HOURS = {
  start: "09:00",
  end: "18:00",
  timezone: "Asia/Kolkata",
  durationMinutes: 60
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const isValidTime = (time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const buildScheduleDate = (interviewDate, time, timezone) => {
  const datePart = new Date(interviewDate).toISOString().slice(0, 10);
  const timezoneOffset = timezone === "Asia/Kolkata" ? "+05:30" : "Z";
  return new Date(`${datePart}T${time}:00.000${timezoneOffset}`);
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const assignmentPopulate = [
  {
    path: "candidate",
    select:
      "name email phone location currentRole experienceYears skills resume aiSummary match status"
  },
  {
    path: "job",
    select:
      "roleTitle department location experienceRequired requiredSkills preferredSkills seniorityLevel description status"
  },
  {
    path: "questionnaire",
    select: "questions recruiterNotes generatedBy createdAt"
  },
  {
    path: "schedule",
    select: "startsAt endsAt timezone meetingLink status emailStatus"
  }
];

const formatAssignment = (assignment) => ({
  id: assignment._id,
  status: assignment.status,
  invitedAt: assignment.invitedAt,
  recruiterNotes: assignment.recruiterNotes,
  interviewDate: assignment.interviewDate,
  workingHours: {
    ...INTERVIEW_WORKING_HOURS,
    ...(assignment.workingHours?.toObject?.() || assignment.workingHours || {})
  },
  selectedTime: assignment.selectedTime,
  candidate: assignment.candidate,
  job: assignment.job,
  questionnaire: assignment.questionnaire,
  schedule: assignment.schedule,
  createdAt: assignment.createdAt,
  updatedAt: assignment.updatedAt
});

const getMyAssignments = async (req, res) => {
  try {
    const assignments = await InterviewAssignment.find({
      interviewer: req.user._id,
      status: { $ne: "cancelled" }
    })
      .populate(assignmentPopulate)
      .sort({ updatedAt: -1 });

    res.json({ assignments: assignments.map(formatAssignment) });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load interviewer assignments",
      error: error.message
    });
  }
};

const getMyAssignment = async (req, res) => {
  try {
    const assignment = await InterviewAssignment.findOne({
      _id: req.params.assignmentId,
      interviewer: req.user._id
    }).populate(assignmentPopulate);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ assignment: formatAssignment(assignment) });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load assignment",
      error: error.message
    });
  }
};

const selectInterviewSlot = async (req, res) => {
  try {
    const { selectedTime } = req.body;

    if (!selectedTime || !isValidTime(selectedTime)) {
      return res.status(400).json({ message: "selectedTime must use HH:mm format" });
    }

    const assignment = await InterviewAssignment.findOne({
      _id: req.params.assignmentId,
      interviewer: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.schedule) {
      return res.status(409).json({ message: "Interview is already scheduled" });
    }

    const workingHours = {
      ...INTERVIEW_WORKING_HOURS,
      ...(assignment.workingHours?.toObject?.() || assignment.workingHours || {})
    };
    const startMinutes = timeToMinutes(workingHours.start);
    const endMinutes = timeToMinutes(workingHours.end);
    const selectedMinutes = timeToMinutes(selectedTime);
    const durationMinutes = workingHours.durationMinutes || 60;

    if (
      selectedMinutes < startMinutes ||
      selectedMinutes + durationMinutes > endMinutes
    ) {
      return res.status(400).json({
        message: `Choose a time between ${workingHours.start} and ${workingHours.end}`
      });
    }

    const startsAt = buildScheduleDate(
      assignment.interviewDate,
      selectedTime,
      workingHours.timezone
    );
    const endsAt = addMinutes(startsAt, durationMinutes);

    const meeting = generateInterviewMeetingLink({
      candidate: assignment.candidate,
      job: assignment.job,
      roundType: "Interview",
      startTime: startsAt
    });

    const schedule = await InterviewSchedule.create({
      assignment: assignment._id,
      candidate: assignment.candidate,
      interviewer: req.user._id,
      startsAt,
      endsAt,
      timezone: workingHours.timezone,
      meetingLink: meeting.meetingLink
    });

    assignment.selectedTime = selectedTime;
    assignment.workingHours = workingHours;
    assignment.schedule = schedule._id;
    assignment.status = "scheduled";
    await assignment.save();

    const populatedAssignment = await InterviewAssignment.findById(assignment._id).populate(
      assignmentPopulate
    );

    res.status(201).json({
      message: "Interview scheduled and meeting link created",
      assignment: formatAssignment(populatedAssignment)
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to schedule interview",
      error: error.message
    });
  }
};

const getMySchedules = async (req, res) => {
  try {
    const schedules = await InterviewSchedule.find({
      interviewer: req.user._id
    })
      .populate({
        path: "candidate",
        select: "name email currentRole"
      })
      .sort({ startsAt: 1 });

    res.json({ schedules });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load schedules",
      error: error.message
    });
  }
};

const seedInterviewerDemo = async (req, res) => {
  try {
    if (req.user.role !== "interviewer") {
      return res.status(403).json({ message: "Only interviewers can seed demo assignments" });
    }

    const existingAssignments = await InterviewAssignment.find({
      interviewer: req.user._id
    });

    if (existingAssignments.length > 0) {
      const now = new Date();
      const day = 24 * 60 * 60 * 1000;
      let updated = 0;

      for (const [index, assignment] of existingAssignments.entries()) {
        assignment.workingHours = INTERVIEW_WORKING_HOURS;

        if (!assignment.interviewDate) {
          assignment.interviewDate = new Date(now.getTime() + (index + 2) * day);
          updated += 1;
        }

        await assignment.save();
      }

      return res.json({
        message: "Demo assignments already exist",
        created: 0,
        updated
      });
    }

    const job = await Job.create({
      roleTitle: "Senior MERN Engineer",
      department: "Product Engineering",
      location: "Remote",
      experienceRequired: "5+ years",
      requiredSkills: ["React", "Node.js", "MongoDB", "System Design"],
      preferredSkills: ["TypeScript", "AWS", "Mentoring"],
      seniorityLevel: "Senior",
      description: {
        summary:
          "Build scalable hiring workflows, AI-assisted interfaces, and robust backend services for recruitment teams.",
        responsibilities: [
          "Design React dashboards for recruiter and interviewer workflows",
          "Build Express APIs with clear service boundaries",
          "Improve reliability, observability, and performance across the platform"
        ],
        requirements: [
          "Strong React and Node.js experience",
          "Hands-on MongoDB schema design",
          "Ability to reason through system design tradeoffs"
        ],
        interviewProcess: ["Technical screen", "System design discussion", "Team fit round"]
      }
    });

    const candidates = await Candidate.insertMany([
      {
        name: "Aarav Mehta",
        email: "aarav.mehta@example.com",
        phone: "+91 98765 43210",
        location: "Bengaluru",
        currentRole: "Full Stack Engineer",
        experienceYears: 6,
        skills: ["React", "Node.js", "MongoDB", "Redis", "AWS"],
        education: [
          {
            degree: "B.Tech Computer Science",
            institution: "PES University",
            year: "2018"
          }
        ],
        links: [
          { label: "GitHub", url: "https://github.com/aarav-demo" },
          { label: "LinkedIn", url: "https://linkedin.com/in/aarav-demo" }
        ],
        resume: {
          fileName: "aarav-mehta-resume.pdf",
          highlights: [
            "Led migration from monolith APIs to modular services",
            "Built real-time interview scheduling workflows",
            "Mentored four junior engineers"
          ],
          projects: [
            "Candidate pipeline analytics dashboard",
            "Distributed notification service"
          ],
          certifications: ["AWS Certified Developer Associate"],
          text:
            "Six years of full-stack engineering experience building React, Node.js, and MongoDB systems. Strong ownership of dashboard UX, API reliability, Redis queues, and cloud deployments."
        },
        aiSummary:
          "Strong match for the MERN role with proven backend ownership and product dashboard experience.",
        match: {
          score: 91,
          matchedSkills: ["React", "Node.js", "MongoDB", "AWS"],
          missingSkills: ["Formal architecture documentation"],
          riskNotes: ["May need deeper evaluation on large-scale system design"],
          explanation:
            "Resume aligns strongly with product engineering, API design, and frontend workflow requirements."
        }
      },
      {
        name: "Nisha Rao",
        email: "nisha.rao@example.com",
        phone: "+91 91234 56780",
        location: "Hyderabad",
        currentRole: "Frontend Lead",
        experienceYears: 7,
        skills: ["React", "TypeScript", "GraphQL", "Design Systems", "Node.js"],
        education: [
          {
            degree: "MCA",
            institution: "University of Hyderabad",
            year: "2017"
          }
        ],
        links: [{ label: "Portfolio", url: "https://nisha-demo.example.com" }],
        resume: {
          fileName: "nisha-rao-resume.pdf",
          highlights: [
            "Owned component library used by five product teams",
            "Improved dashboard performance by 38%",
            "Partnered closely with product and design"
          ],
          projects: ["Scheduling workspace redesign", "Reusable data table framework"],
          certifications: [],
          text:
            "Frontend lead with seven years of experience building React and TypeScript SaaS applications. Comfortable with Node.js services, accessibility, and data-heavy dashboards."
        },
        aiSummary:
          "Excellent frontend and UX depth with enough backend exposure for collaborative MERN delivery.",
        match: {
          score: 84,
          matchedSkills: ["React", "TypeScript", "Node.js"],
          missingSkills: ["MongoDB depth", "Cloud operations"],
          riskNotes: ["Probe backend design ownership"],
          explanation:
            "Very strong UI and workflow design background; backend experience should be validated."
        }
      }
    ]);

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const assignments = [];

    for (const [index, candidate] of candidates.entries()) {
      const questionnaire = await Questionnaire.create({
        job: job._id,
        candidate: candidate._id,
        questions: [
          {
            category: "technical",
            prompt:
              "Walk through a React performance problem you solved and the measurements you used.",
            difficulty: "core",
            evaluationGuide: "Look for profiling, memoization discipline, and user-impact framing."
          },
          {
            category: "project",
            prompt:
              "Choose one resume project and explain the architecture, tradeoffs, and failure modes.",
            difficulty: "deep_dive",
            evaluationGuide: "Probe ownership, clarity, and ability to reason beyond happy paths."
          },
          {
            category: "system_design",
            prompt:
              "Design an interview scheduling service with reminders, retries, and conflict handling.",
            difficulty: "deep_dive",
            evaluationGuide: "Expect API boundaries, data model, queue/retry strategy, and observability."
          },
          {
            category: "behavioral",
            prompt: "Tell me about a time you disagreed with a product decision.",
            difficulty: "core",
            evaluationGuide: "Look for collaboration, judgment, and respectful escalation."
          }
        ],
        recruiterNotes:
          "Focus on practical ownership, communication, and ability to handle scheduling complexity."
      });

      const assignment = await InterviewAssignment.create({
        job: job._id,
        candidate: candidate._id,
        interviewer: req.user._id,
        questionnaire: questionnaire._id,
        invitedAt: now,
        recruiterNotes:
          index === 0
            ? "Please validate backend depth and scaling instincts."
            : "Please probe backend comfort and leadership examples.",
        interviewDate: new Date(now.getTime() + (index + 2) * day),
        workingHours: INTERVIEW_WORKING_HOURS
      });

      assignments.push(assignment);
    }

    res.status(201).json({
      message: "Demo interviewer assignments created",
      created: assignments.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to create demo assignments",
      error: error.message
    });
  }
};

module.exports = {
  getMyAssignments,
  getMyAssignment,
  selectInterviewSlot,
  getMySchedules,
  seedInterviewerDemo
};
