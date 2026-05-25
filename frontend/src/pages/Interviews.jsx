import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

function Interviews() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Interview operations"
        title="Interviews"
        description="Interview scheduling will be added later. This area is styled for panels, calendars, schedules, and interviewer coordination."
      />
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {["Schedule orchestration", "Interviewer capacity", "Candidate readiness"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-950">{item}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Prepared placeholder for the next workflow layer.</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Interviews;
