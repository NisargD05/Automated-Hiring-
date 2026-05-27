import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import InterviewStatusBadge from "../../components/interviews/InterviewStatusBadge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { formatTimeRange } from "../../utils/date";

function InterviewDetails() {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/${interviewId}`);
        setInterview(data.interview);
      } catch (error) {
        setError(error.response?.data?.message || "Unable to load interview");
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [interviewId]);

  if (loading) {
    return <Loader label="Loading interview kit..." />;
  }

  if (error || !interview) {
    return <p className="alert-error">{error || "Interview not found"}</p>;
  }

  const candidate = interview.candidateId;
  const evaluation = candidate?.latestEvaluation;
  const resume = candidate?.resumeDocument;
  const meetingLink = interview.meetingLink;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Link className="text-link" to="/interviewer/upcoming">Back to upcoming</Link>
          <p className="page-kicker">{interview.jobId?.roleName}</p>
          <h1 className="page-title">{candidate?.name}</h1>
          <p className="page-copy">{formatTimeRange(interview.scheduledAt, interview.endTime)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InterviewStatusBadge status={interview.status} />
          <a href={meetingLink} target="_blank" rel="noreferrer">
            <Button variant="success">Join Meeting</Button>
          </a>
          {!interview.feedbackId && (
            <Link to={`/interviewer/interviews/${interview._id}/feedback`}>
              <Button variant="ai">Submit Feedback</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-950">AI ranking summary</h2>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-3xl font-semibold text-slate-950">{evaluation?.score ?? 0}%</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{evaluation?.rankingReason || "No AI ranking summary available."}</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strengths</p>
              <div className="chip-row">
                {(evaluation?.strengths || []).map((item) => <span key={item} className="chip">{item}</span>)}
              </div>
            </section>
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weaknesses</p>
              <div className="chip-row">
                {(evaluation?.weaknesses || []).map((item) => <span key={item} className="chip">{item}</span>)}
              </div>
            </section>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-950">Interview context</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-slate-500">Round</dt><dd className="font-medium text-slate-950">{interview.roundType}</dd></div>
            <div><dt className="text-slate-500">Recruiter notes</dt><dd className="font-medium text-slate-950">{interview.requestId?.notes || "No notes provided."}</dd></div>
            <div><dt className="text-slate-500">Matched JD skills</dt><dd className="font-medium text-slate-950">{(evaluation?.matchesWithJD || []).join(", ") || "Not available"}</dd></div>
            <div><dt className="text-slate-500">Missing requirements</dt><dd className="font-medium text-slate-950">{(evaluation?.missingWithJD || []).join(", ") || "Not available"}</dd></div>
          </dl>
        </Card>
      </div>

      <Card className="p-5">
        <div className="panel-heading">
          <div>
            <h2 className="font-semibold text-slate-950">Resume</h2>
            <p className="mt-1 text-sm text-slate-500">{resume?.originalFileName || "No resume file"}</p>
          </div>
        </div>
        <div className="mt-4 max-h-[460px] overflow-auto rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {resume?.resumeText || "Resume text is not available."}
        </div>
      </Card>
    </div>
  );
}

export default InterviewDetails;
