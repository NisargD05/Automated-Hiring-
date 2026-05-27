import { useEffect, useState } from "react";
import api from "../../api/axios";
import InterviewCard from "../../components/interviews/InterviewCard";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/ui/Loader";
import PageHeader from "../../components/ui/PageHeader";

function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const { data } = await api.get("/interviews/recruiter");
        setInterviews(data.interviews || []);
      } catch (error) {
        setError(error.response?.data?.message || "Unable to load recruiter interviews");
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Recruiter review"
        title="Candidate Interviews"
        description="Scheduled interviews, completed feedback, and interviewer recommendations for your candidate pipeline."
      />
      {error && <p className="alert-error">{error}</p>}
      {loading ? (
        <Loader label="Loading interviews..." />
      ) : interviews.length === 0 ? (
        <EmptyState title="No scheduled interviews" description="Scheduled interviews will appear after interviewers confirm slots." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {interviews.map((interview) => (
            <InterviewCard key={interview._id} interview={interview} recruiterView />
          ))}
        </div>
      )}
    </div>
  );
}

export default CandidateInterviews;
