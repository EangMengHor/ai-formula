import { Button } from "@/components/ui/button"
import { Route, Router, Routes, useNavigate, useLocation } from "react-router-dom"
import PublicLayout from "./pages/_public/PublicLayout"
import Login from "./pages/_public/components/Login"
import Signup from "./pages/_public/components/Signup"
import { login, signup } from "./namespace/client"
import PrivateRoute from "./pages/_private/PrivateRoute"
import Dashboard from "./pages/_private/components/sidebarProvided/components/Dashboard"
import SidebarProvided from "./pages/_private/components/sidebarProvided/SidebarProvided"
import Chat from "./pages/_private/components/sidebarProvided/components/Chat"
import { useEffect } from "react"
import KnowledgeLayout from "./pages/_knowledge/KnowledgeLayout"
import CreateKnowledgeBase from "./pages/_knowledge/pages/CreateKnowledgeBase"
import Knowledge from "./pages/_knowledge/pages/Knowledge"
import EditSuperPersona from "./pages/_knowledge/pages/EditSuperPersona"
import UploadDocumentKnowledge from "./pages/_knowledge/pages/UploadDocumentKnowledge"
import GenerateKnowledgeBase from "./pages/_knowledge/pages/GenerateKnowledgeBase"
import AddToExistingKnowledge from "./pages/_addToExisitingKnowledge/AddToExistingKnowledge"
import AgenticAutomationLayout from "./pages/_AgenticAutomation/AgenticAutomationLayout"
import AgenticAutomation from "./pages/_AgenticAutomation/pages/AgenticAutomation"
import CreateAutomationForm from "./pages/_AgenticAutomation/pages/createNewAgenticAutomation"
import AgenticJobs from "./pages/_AgenticAutomation/pages/AgenticJobs"
import JobDetails from "./pages/_AgenticAutomation/pages/JobDetails"

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const edgePaths = ['/', ''];
    if (edgePaths.includes(location.pathname) && !location.pathname.startsWith('/chat')) {
      navigate('/dashboard');
    }

  }, [location.pathname, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route path={login} element={<Login />} />
          <Route path={signup} element={<Signup />} />
        </Route>

        <Route element={<PrivateRoute />}>
          {/* code chat interface */}
          <Route element={<SidebarProvided />} >
            <Route index path="/dashboard" element={<Dashboard />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Route>
          {/* knowledge base and persona generation */}
          <Route element={<KnowledgeLayout />} >
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/create-knowledge-base" element={<CreateKnowledgeBase />} />
            <Route path="/chat/:idx" element={<CreateKnowledgeBase />} />
            <Route path="/editSuperPersona/:idx" element={<EditSuperPersona />} />
            <Route path="/uploadDocumentKnowledgeBase/:idx" element={<UploadDocumentKnowledge />} />
            <Route path="/generatingKnowledge/:idx" element={<GenerateKnowledgeBase />} />
            <Route path="/addToPermenentKnowledgeBase" element={<AddToExistingKnowledge />} />
          </Route>
          {/* agentic automation interface */}
          <Route element={<AgenticAutomationLayout />} >
            <Route path="/agenticAutomation" element={<AgenticAutomation />} />
            <Route path="/agenticAutomation/createNewAgenticAutomation" element={<CreateAutomationForm />} />
            <Route path="/agenticAutomation/automationJobsDetails/:automationId" element={<AgenticJobs />} />
            <Route path="/agenticAutomation/jobDetails/:jobId" element={<JobDetails />} />
          </Route>
          <Route path="*" element={<div>404 Page not found</div>} />
        </Route>
      </Routes>
    </>
  )
}