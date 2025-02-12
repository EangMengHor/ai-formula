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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("here is nav", location.pathname);
    const edgePaths = ['/', ''];
    if (edgePaths.includes(location.pathname) && !location.pathname.startsWith('/chat')) {
      console.log("here is nav123", location.pathname);
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
          <Route element={<SidebarProvided />} >
            <Route index path="/dashboard" element={<Dashboard />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Route>
          <Route element={<KnowledgeLayout />} >
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/create-knowledge-base" elemet={<CreateKnowledgeBase />} />
            <Route path="/chat/:idx" element={<CreateKnowledgeBase />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}