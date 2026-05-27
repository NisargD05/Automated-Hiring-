const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailDeliveryError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "EmailDeliveryError";
    this.status = 502;
    this.code = "EMAIL_DELIVERY_FAILED";
    this.details = details;
  }
}

const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  };

  logger.info("[Email Service] Transport created", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    userConfigured: Boolean(process.env.SMTP_USER),
    passConfigured: Boolean(process.env.SMTP_PASS),
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null
  });

  return nodemailer.createTransport(config);
};

const formatSchedule = (startTime, endTime) => {
  const timeZone = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
  const when = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone
  }).format(startTime);
  const end = new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
    timeZone
  }).format(endTime);

  return {
    end,
    timeZone,
    when
  };
};

const sendInterviewScheduledEmails = async ({
  candidate,
  interviewer,
  recruiter,
  job,
  roundType,
  duration,
  notes,
  startTime,
  endTime,
  meetingLink
}) => {
  const transporter = createTransporter();

  if (!transporter) {
    const message = "SMTP_HOST is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env, then restart the backend.";
    logger.error("[Email Service] %s", message, {
      candidateEmail: candidate.email,
      interviewerEmail: interviewer.email,
      roundType
    });
    throw new EmailDeliveryError(message, {
      candidate: { status: "skipped", email: candidate.email },
      interviewer: { status: "skipped", email: interviewer.email }
    });
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from || !candidate?.email || !interviewer?.email) {
    throw new EmailDeliveryError("Email sender, candidate recipient, and interviewer recipient are required", {
      fromConfigured: Boolean(from),
      candidateEmail: candidate?.email || null,
      interviewerEmail: interviewer?.email || null
    });
  }

  const schedule = formatSchedule(startTime, endTime);
  const results = {
    candidate: null,
    interviewer: null
  };

  logger.info("[Email Service] Verifying SMTP transport");
  await transporter.verify();
  logger.info("[Email Service] SMTP verify successful");

  try {
    logger.info("[Email Service] Sending interviewer email", {
      to: interviewer.email,
      candidateEmail: candidate.email
    });

    results.interviewer = await transporter.sendMail({
      from,
      to: interviewer.email,
      subject: `Interview Scheduled - ${candidate.name}`,
      text: [
        `Hi ${interviewer.name},`,
        "",
        `An interview has been scheduled.`,
        "",
        `Candidate: ${candidate.name} (${candidate.email})`,
        `Role: ${job.roleName}`,
        `Round: ${roundType}`,
        `Date/Time: ${schedule.when} - ${schedule.end} (${schedule.timeZone})`,
        `Duration: ${duration} minutes`,
        `Meeting link: ${meetingLink}`,
        recruiter ? `Recruiter: ${recruiter.name} (${recruiter.email})` : "",
        notes ? `Recruiter notes: ${notes}` : "",
        "",
        "Best,",
        "AI Hiring Team"
      ]
        .filter(Boolean)
        .join("\n")
    });

    logger.info("[Email Service] Interviewer email sent", {
      to: interviewer.email,
      messageId: results.interviewer.messageId,
      response: results.interviewer.response
    });
  } catch (error) {
    logger.error("[Email Service] Interviewer email failed", {
      to: interviewer.email,
      error: error.message
    });
    results.interviewer = { failed: true, error: error.message };
  }

  try {
    logger.info("[Email Service] Sending candidate email", {
      to: candidate.email,
      interviewerEmail: interviewer.email
    });

    results.candidate = await transporter.sendMail({
      from,
      to: candidate.email,
      subject: "Your Interview Has Been Scheduled",
      text: [
        `Hi ${candidate.name},`,
        "",
        `Your interview has been scheduled.`,
        "",
        `Role: ${job.roleName}`,
        `Round: ${roundType}`,
        `Interviewer: ${interviewer.name} (${interviewer.email})`,
        `Date/Time: ${schedule.when} - ${schedule.end} (${schedule.timeZone})`,
        `Duration: ${duration} minutes`,
        `Meeting link: ${meetingLink}`,
        "",
        "Please join the meeting using the link at the scheduled time.",
        "",
        "Best,",
        "AI Hiring Team"
      ].join("\n")
    });

    logger.info("[Email Service] Candidate email sent", {
      to: candidate.email,
      messageId: results.candidate.messageId,
      response: results.candidate.response
    });
  } catch (error) {
    logger.error("[Email Service] Candidate email failed", {
      to: candidate.email,
      error: error.message
    });
    results.candidate = { failed: true, error: error.message };
  }

  const failures = [
    results.interviewer?.failed ? `interviewer: ${results.interviewer.error}` : "",
    results.candidate?.failed ? `candidate: ${results.candidate.error}` : ""
  ].filter(Boolean);

  if (failures.length) {
    throw new EmailDeliveryError(`Interview scheduled, but email delivery failed for ${failures.join("; ")}`, results);
  }

  return results;
};

module.exports = {
  EmailDeliveryError,
  sendInterviewScheduledEmails
};
