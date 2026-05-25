import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import CandidateDetails from "../components/CandidateDetails";
import CandidateRankingCard from "../components/CandidateRankingCard";
import FormField from "../components/FormField";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  currentCompany: "",
  yearsOfExperience: "",
  source: "Manual upload",
  notes: ""
};

function Candidates() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate._id === selectedCandidateId),
    [candidates, selectedCandidateId]
  );

  const fetchCandidates = async (jobId = selectedJobId) => {
    if (!jobId) {
      setCandidates([]);
      return;
    }

    const { data } = await api.get("/candidates", {
      params: { jobId, sort: "score" }
    });
    setCandidates(data.candidates || []);
    setSelectedCandidateId((current) => current || data.candidates?.[0]?._id || "");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/jobs");
        setJobs(data.jobs || []);
        const firstJobId = data.jobs?.[0]?._id || "";
        setSelectedJobId(firstJobId);
        if (firstJobId) {
          const response = await api.get("/candidates", {
            params: { jobId: firstJobId, sort: "score" }
          });
          setCandidates(response.data.candidates || []);
          setSelectedCandidateId(response.data.candidates?.[0]?._id || "");
        }
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load candidate workspace");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const haystack = [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.currentCompany,
        candidate.latestEvaluation?.recommendation,
        candidate.rankingStatus
      ]
        .join(" ")
        .toLowerCase();
      const score = candidate.latestEvaluation?.score ?? -1;
      return haystack.includes(query.toLowerCase()) && (!minScore || score >= Number(minScore));
    });
  }, [candidates, minScore, query]);

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleJobChange = async (event) => {
    const jobId = event.target.value;
    setSelectedJobId(jobId);
    setSelectedCandidateId("");
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await fetchCandidates(jobId);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    let candidateCreated = false;

    try {
      const { data } = await api.post("/candidates", {
        ...form,
        jobId: selectedJobId
      });
      candidateCreated = Boolean(data.candidate?._id);

      if (resumeFile) {
        const upload = new FormData();
        upload.append("resume", resumeFile);
        await api.post(`/candidates/${data.candidate._id}/upload-resume`, upload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setForm(initialForm);
      setResumeFile(null);
      setSuccess("Candidate added and resume parsed.");
      await fetchCandidates(selectedJobId);
    } catch (error) {
      const response = error.response?.data;
      setError(response?.details?.message || response?.message || response?.error || "Failed to add candidate");
      if (candidateCreated) {
        await fetchCandidates(selectedJobId);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRank = async (candidateId) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/candidates/${candidateId}/rank`);
      setSuccess("Candidate ranking completed.");
      await fetchCandidates(selectedJobId);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to rank candidate");
    } finally {
      setBusy(false);
    }
  };

  const handleRankAll = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/candidates/rank-all", { jobId: selectedJobId });
      setSuccess(`Ranked ${data.rankedCount} candidates${data.failedCount ? `, ${data.failedCount} failed` : ""}.`);
      await fetchCandidates(selectedJobId);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to rank candidates");
    } finally {
      setBusy(false);
    }
  };

  const handleShortlist = async (candidateId, status) => {
    setBusy(true);
    setError("");
    try {
      await api.put(`/candidates/${candidateId}/shortlist`, { status });
      await fetchCandidates(selectedJobId);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update candidate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="AI talent intelligence"
        title="Candidates"
        description="Upload resumes, compare them against approved JDs and company knowledge, then rank the strongest profiles with tri-source RAG."
      />

      {error && <p className="alert-error">{error}</p>}
      {success && <p className="alert-success">{success}</p>}

      <div className="toolbar">
        <select value={selectedJobId} onChange={handleJobChange} className="md:max-w-md" disabled={busy}>
          <option value="">Select approved JD</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>{job.roleName} - {job.department || "General"}</option>
          ))}
        </select>
        <input type="search" placeholder="Search candidates, company, recommendation" value={query} onChange={(event) => setQuery(event.target.value)} />
        <input type="number" min="0" max="100" placeholder="Min score" value={minScore} onChange={(event) => setMinScore(event.target.value)} className="md:max-w-32" />
        <Button variant="ai" onClick={handleRankAll} disabled={busy || !selectedJobId || candidates.length === 0}>
          Rank Candidates
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-950">Add candidate</h2>
          <p className="mt-1 text-sm text-slate-500">Manual intake now, with source metadata ready for future imports.</p>

          <form className="mt-5 space-y-4" onSubmit={handleCreateCandidate}>
            <FormField label="Candidate name" name="name" value={form.name} onChange={onChange} required />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
            <FormField label="Phone number" name="phone" value={form.phone} onChange={onChange} required />
            <label className="block">
              <span className="field-label">Resume PDF <span className="ml-1 text-red-500">*</span></span>
              <input
                type="file"
                accept="application/pdf"
                className="field-control"
                required
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <FormField label="Current company" name="currentCompany" value={form.currentCompany} onChange={onChange} />
              <FormField label="Years of experience" name="yearsOfExperience" type="number" value={form.yearsOfExperience} onChange={onChange} />
            </div>
            <FormField label="Source" name="source" value={form.source} onChange={onChange} />
            <FormField label="Notes" name="notes" value={form.notes} onChange={onChange} textarea />
            <Button type="submit" disabled={busy || !selectedJobId} className="w-full">
              Add Candidate
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950">Ranked candidates</h2>
                <p className="mt-1 text-sm text-slate-500">{filteredCandidates.length} profiles in view.</p>
              </div>
              {busy && <Loader label="AI workflow running..." />}
            </div>

            {loading ? (
              <div className="mt-5"><Loader label="Loading candidates..." /></div>
            ) : filteredCandidates.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="No candidates yet" description="Select an approved job and add the first resume to begin ranking." />
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    className="cursor-pointer"
                    onClick={() => setSelectedCandidateId(candidate._id)}
                  >
                    <CandidateRankingCard
                      candidate={candidate}
                      onRank={handleRank}
                      onShortlist={handleShortlist}
                      busy={busy}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <CandidateDetails candidate={selectedCandidate} />
        </div>
      </div>
    </div>
  );
}

export default Candidates;
