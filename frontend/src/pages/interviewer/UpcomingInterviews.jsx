import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import InterviewCard from "../../components/interviews/InterviewCard";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/ui/Loader";
import PageHeader from "../../components/ui/PageHeader";

function UpcomingInterviews({ history = false }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const { data } = await api.get("/interviews/interviewer");
        setInterviews(data.interviews || []);
      } catch (error) {
        setError(error.response?.data?.message || "Unable to load interviews");
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  const visible = useMemo(() => {
    if (history) {
      return interviews.filter((interview) => interview.feedbackId || ["selected", "rejected", "next_round"].includes(interview.status));
    }

    return interviews.filter((interview) => !interview.feedbackId && interview.status === "scheduled");
  }, [history, interviews]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Interview calendar"
        title={history ? "Feedback History" : "Upcoming Interviews"}
        description={history ? "Submitted recommendations and completed interview outcomes." : "Confirmed interviews with meeting links, candidate context, resumes, and feedback actions."}
      />

      {error && <p className="alert-error">{error}</p>}

      {loading ? (
        <Loader label="Loading interviews..." />
      ) : visible.length === 0 ? (
        <EmptyState title={history ? "No feedback yet" : "No upcoming interviews"} description={history ? "Completed feedback will appear here." : "Scheduled interviews appear here after you accept a request."} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((interview) => (
            <InterviewCard key={interview._id} interview={interview} />
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingInterviews;
