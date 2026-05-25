import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { formatDate, formatWorkingHours } from "../utils/date";

const DEFAULT_WORKING_HOURS = {
  start: "09:00",
  end: "18:00"
};

function InterviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/interviewer/assignments");
      setAssignments(data.assignments);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchText = [
        assignment.candidate?.name,
        assignment.candidate?.currentRole,
        assignment.job?.roleTitle,
        assignment.candidate?.skills?.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = searchText.includes(query.toLowerCase());
      const matchesStatus = status === "all" || assignment.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [assignments, query, status]);

  const seedDemo = async () => {
    setSeedLoading(true);
    setError("");

    try {
      await api.post("/interviewer/seed-demo");
      await loadAssignments();
    } catch (error) {
      setError(error.response?.data?.message || "Unable to create demo assignments");
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <section className="content-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Interviewer workspace</p>
          <h1>Assigned Candidates</h1>
          <p>Review candidates, prepare with AI questions, and choose an interview time.</p>
        </div>
        <Button variant="secondary" type="button" onClick={seedDemo}>
          {seedLoading ? "Creating..." : "Load demo data"}
        </Button>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search candidates, roles, or skills"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="skeleton-grid">
          <span />
          <span />
          <span />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Use demo data or wait for a recruiter to assign interviews to you." />
      ) : (
        <div className="assignment-grid">
          {filteredAssignments.map((assignment) => {
            const candidate = assignment.candidate;

            return (
              <article className="candidate-card" key={assignment.id}>
                <div className="card-topline">
                  <StatusBadge status={assignment.status} />
                  <span>{assignment.job?.roleTitle}</span>
                </div>

                <h2>{candidate?.name}</h2>
                <p>{candidate?.currentRole}</p>

                <div className="score-row">
                  <strong>{candidate?.match?.score || 0}%</strong>
                  <span>AI match score</span>
                </div>

                <div className="chip-row">
                  {candidate?.skills?.slice(0, 4).map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="date-strip">
                  <span>Interview date</span>
                  <strong>{formatDate(assignment.interviewDate)}</strong>
                  <small>{formatWorkingHours(assignment.workingHours || DEFAULT_WORKING_HOURS)}</small>
                </div>

                <Link className="primary-link" to={`/interviewer/assignments/${assignment.id}`}>
                  Open interview kit
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default InterviewerAssignments;
