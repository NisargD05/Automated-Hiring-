import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

function Settings() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Account and workspace settings will be added later. The page is prepared for profile, security, integrations, and notification controls."
      />
      <Card className="p-5">
        <div className="divide-y divide-slate-100">
          {["Profile", "Security", "Integrations", "Notifications"].map((item) => (
            <div key={item} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-950">{item}</p>
                <p className="mt-1 text-sm text-slate-500">Configuration module placeholder.</p>
              </div>
              <span className="chip">Coming soon</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Settings;
