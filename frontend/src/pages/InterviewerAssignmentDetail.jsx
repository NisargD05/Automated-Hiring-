import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { formatDate, formatDateTime, formatWorkingHours } from "../utils/date";

const categoryLabels = {
  technical: "Technical",
  behavioral: "Behavioral",
  scenario: "Scenario",
  project: "Project Discussion",
  coding: "Coding",
  system_design: "System Design"
};

const DEFAULT_WORKING_HOURS = {
  start: "09:00",
  end: "18:00",
  timezone: "Asia/Kolkata"
};

function InterviewerAssignmentDetail() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAssignment = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/interviewer/assignments/${assignmentId}`);
      setAssignment(data.assignment);
      setSelectedTime(data.assignment.workingHours?.start || DEFAULT_WORKING_HOURS.start);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const groupedQuestions = useMemo(() => {
    const questions = assignment?.questionnaire?.questions || [];

    return questions.reduce((groups, question) => {
      const key = question.category;
      groups[key] = groups[key] || [];
      groups[key].push(question);
      return groups;
    }, {});
  }, [assignment]);

  const scheduleInterview = async () => {
    if (!selectedTime) {
      setError("Choose an interview time first");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.post(`/interviewer/assignments/${assignmentId}/select-slot`, {
        selectedTime
      });
      setAssignment(data.assignment);
      setNotice(data.message);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to schedule interview");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="content-stack">
        <div className="skeleton-detail" />
      </section>
    );
  }

  if (error && !assignment) {
    return (
      <section className="content-stack">
        <p className="error">{error}</p>
        <Link className="primary-link" to="/interviewer/assignments">
          Back to assignments
        </Link>
      </section>
    );
  }

  const candidate = assignment.candidate;
  const job = assignment.job;
  const workingHours = assignment.workingHours || DEFAULT_WORKING_HOURS;

  return (
    <section className="content-stack">
      <header className="page-header detail-header">
        <div>
          <Link className="text-link" to="/interviewer/assignments">
            Back to assignments
          </Link>
          <p className="eyebrow">{job?.roleTitle}</p>
          <h1>{candidate?.name}</h1>
          <p>{candidate?.currentRole} | {candidate?.experienceYears} years | {candidate?.location}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </header>

      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}

      <div className="detail-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Candidate Summary</h2>
            <strong>{candidate?.match?.score || 0}% match</strong>
          </div>
          <p>{candidate?.aiSummary}</p>

          <div className="metric-grid">
            <div>
              <span>Matched Skills</span>
              <strong>{candidate?.match?.matchedSkills?.join(", ")}</strong>
            </div>
            <div>
              <span>Missing Skills</span>
              <strong>{candidate?.match?.missingSkills?.join(", ")}</strong>
            </div>
          </div>

          <p className="muted">{candidate?.match?.explanation}</p>
        </article>

        <article className="panel">
          <h2>Job Context</h2>
          <p>{job?.description?.summary}</p>
          <div className="chip-row">
            {job?.requiredSkills?.map((skill) => (
              <span className="chip" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </article>
      </div>

      <div className="detail-grid">
        <article className="panel">
          <h2>Resume Viewer</h2>
          <p className="muted">{candidate?.resume?.fileName}</p>
          <div className="resume-box">
            <p>{candidate?.resume?.text}</p>
          </div>

          <h3>Highlights</h3>
          <ul className="clean-list">
            {candidate?.resume?.highlights?.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Time Selection</h2>

          {assignment.schedule ? (
            <div className="schedule-confirmation">
              <p>Final schedule</p>
              <h3>{formatDateTime(assignment.schedule.startsAt)}</h3>
              <a href={assignment.schedule.meetingLink} target="_blank" rel="noreferrer">
                Open meeting link
              </a>
            </div>
          ) : (
            <>
              <div className="date-strip prominent">
                <span>Recruiter-selected date</span>
                <strong>{formatDate(assignment.interviewDate)}</strong>
                <small>
                  Working hours: {formatWorkingHours(workingHours)} {workingHours.timezone}
                </small>
              </div>

              <label className="time-picker" htmlFor="selectedTime">
                <span>Choose time</span>
                <input
                  id="selectedTime"
                  type="time"
                  value={selectedTime}
                  min={workingHours.start}
                  max={workingHours.end}
                  step="900"
                  onChange={(event) => setSelectedTime(event.target.value)}
                />
              </label>

              <button type="button" onClick={scheduleInterview} disabled={saving}>
                {saving ? "Scheduling..." : "Confirm time and create meeting link"}
              </button>
            </>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-heading">
          <h2>AI Questionnaire</h2>
          <span>{assignment.questionnaire?.questions?.length || 0} questions</span>
        </div>

        <div className="question-grid">
          {Object.entries(groupedQuestions).map(([category, questions]) => (
            <section className="question-group" key={category}>
              <h3>{categoryLabels[category] || category}</h3>
              {questions.map((question) => (
                <div className="question-item" key={question.prompt}>
                  <p>{question.prompt}</p>
                  <span>{question.difficulty}</span>
                  <small>{question.evaluationGuide}</small>
                </div>
              ))}
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

export default InterviewerAssignmentDetail;
