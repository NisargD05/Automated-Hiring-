import { useEffect, useState } from "react";
import api from "../api/axios";
import EmptyState from "../components/ui/EmptyState";
import { formatDateTime } from "../utils/date";

function InterviewerSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const { data } = await api.get("/interviewer/schedules");
        setSchedules(data.schedules);
      } catch (error) {
        setError(error.response?.data?.message || "Unable to load schedules");
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  return (
    <section className="content-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Final schedule</p>
          <h1>Interview Calendar</h1>
          <p>Confirmed interview slots and generated meeting links.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="skeleton-detail" />
      ) : schedules.length === 0 ? (
        <EmptyState title="No interviews scheduled" description="Confirmed slots will appear here once a candidate slot is selected." />
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Time</th>
                <th>Status</th>
                <th>Meeting</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    <strong>{schedule.candidate?.name}</strong>
                    <span>{schedule.candidate?.email}</span>
                  </td>
                  <td>{formatDateTime(schedule.startsAt)}</td>
                  <td>{schedule.status}</td>
                  <td>
                    <a href={schedule.meetingLink} target="_blank" rel="noreferrer">
                      Join link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default InterviewerSchedule;
