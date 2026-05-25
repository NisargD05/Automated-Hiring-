import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

function Candidates() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Talent pipeline"
        title="Candidates"
        description="Candidate workflows will be added later. This surface is prepared for search, matching, resume intelligence, and review queues."
      />
      <Card className="p-6">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">Candidate intelligence coming next</p>
          <p className="mt-2 text-sm text-slate-500">The dashboard shell and data display patterns are ready for candidate workflows.</p>
        </div>
      </Card>
    </div>
  );
}

export default Candidates;
