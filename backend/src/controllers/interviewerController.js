const InterviewAssignment = require("../models/InterviewAssignment");
const InterviewSchedule = require("../models/InterviewSchedule");
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

module.exports = {
  getMyAssignments,
  getMyAssignment,
  selectInterviewSlot,
  getMySchedules
};
