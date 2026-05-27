import { Navigate, Route, Routes } from "react-router-dom";
import Candidates from "./pages/Candidates";
import CreateJob from "./pages/CreateJob";
import Dashboard from "./pages/Dashboard";
import Interviews from "./pages/Interviews";
import InterviewerAssignmentDetail from "./pages/InterviewerAssignmentDetail";
import InterviewerAssignments from "./pages/InterviewerAssignments";
import InterviewerSchedule from "./pages/InterviewerSchedule";
import InterviewDetails from "./pages/interviewer/InterviewDetails";
import PendingRequests from "./pages/interviewer/PendingRequests";
import SubmitFeedback from "./pages/interviewer/SubmitFeedback";
import UpcomingInterviews from "./pages/interviewer/UpcomingInterviews";
import JobDetails from "./pages/JobDetails";
import JobListings from "./pages/JobListings";
import KnowledgeBase from "./pages/KnowledgeBase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="candidates"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <Candidates />
            </RoleRoute>
          }
        />
        <Route
          path="interviews"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <Interviews />
            </RoleRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
        <Route
          path="knowledge-base"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <KnowledgeBase />
            </RoleRoute>
          }
        />
        <Route
          path="create-job"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <CreateJob />
            </RoleRoute>
          }
        />
        <Route
          path="job-listings"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <JobListings />
            </RoleRoute>
          }
        />
        <Route
          path="jobs/:id"
          element={
            <RoleRoute allowedRoles={["admin", "recruiter"]}>
              <JobDetails />
            </RoleRoute>
          }
        />
      </Route>

      <Route
        path="/interviewer/assignments"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <InterviewerAssignments />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/pending"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <PendingRequests />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/upcoming"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <UpcomingInterviews />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/feedback-history"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <UpcomingInterviews history />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/interviews/:interviewId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <InterviewDetails />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/interviews/:interviewId/feedback"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <SubmitFeedback />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assignments/:assignmentId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <InterviewerAssignmentDetail />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/schedule"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["interviewer"]}>
              <AppLayout>
                <InterviewerSchedule />
              </AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
