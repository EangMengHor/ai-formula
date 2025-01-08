import { Button } from "@/components/ui/button"
import { Route, Router, Routes } from "react-router-dom"
import PublicLayout from "./pages/_public/PublicLayout"
import Login from "./pages/_public/components/Login"
import Signup from "./pages/_public/components/Signup"
import { login, signup } from "./namespace/client"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route path={login} element={<Login />} />
          <Route path={signup} element={<Signup />} />
        </Route>
      </Routes>
    </>
  )
}