import { useState } from "react";
import { formatDate } from "../../utils/date";
import Button from "../ui/Button";

function ScheduleInterviewModal({ request, onClose, onConfirm, busy }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!request) {
    return null;
  }

  const submit = (event) => {
    event.preventDefault();
    const localIso = new Date(`${date}T${time}`).toISOString();
    onConfirm({ date, startTime: localIso });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="page-kicker">Confirm interview slot</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{request.candidateId?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{request.roundType} - {request.duration} minutes</p>
          </div>
          <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="date-strip">
          <span>Recruiter preferred range</span>
          <strong>{formatDate(request.preferredWindow?.startDate)} to {formatDate(request.preferredWindow?.endDate)}</strong>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="field-label">Date</span>
            <input className="field-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            <span className="field-label">Start time</span>
            <input className="field-control" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" type="submit" disabled={busy || !date || !time}>
            {busy ? "Scheduling..." : "Create Meeting Link"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ScheduleInterviewModal;
