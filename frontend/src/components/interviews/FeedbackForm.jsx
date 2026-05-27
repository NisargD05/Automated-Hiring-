import { useState } from "react";
import Button from "../ui/Button";

const initialForm = {
  technicalRating: 3,
  communicationRating: 3,
  problemSolvingRating: 3,
  cultureFitRating: 3,
  recommendation: "next_round",
  notes: ""
};

const ratingFields = [
  ["technicalRating", "Technical"],
  ["communicationRating", "Communication"],
  ["problemSolvingRating", "Problem solving"],
  ["cultureFitRating", "Culture fit"]
];

function FeedbackForm({ onSubmit, busy }) {
  const [form, setForm] = useState(initialForm);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="panel space-y-5" onSubmit={submit}>
      <div>
        <p className="page-kicker">Interview feedback</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">Submit recommendation</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ratingFields.map(([name, label]) => (
          <label key={name}>
            <span className="field-label">{label} rating</span>
            <input className="field-control" name={name} type="number" min="1" max="5" value={form[name]} onChange={update} required />
          </label>
        ))}
      </div>

      <label>
        <span className="field-label">Recommendation</span>
        <select className="field-control" name="recommendation" value={form.recommendation} onChange={update} required>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="next_round">Next round</option>
        </select>
      </label>

      <label>
        <span className="field-label">Detailed notes</span>
        <textarea className="field-control min-h-36" name="notes" value={form.notes} onChange={update} required />
      </label>

      <Button type="submit" variant="success" disabled={busy}>
        {busy ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}

export default FeedbackForm;
