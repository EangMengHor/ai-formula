import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { Toaster } from './components/ui/toaster'
import { SidebarProvider } from './context/SidebarContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <BrowserRouter>
      <UserProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </UserProvider>
    </BrowserRouter>
    <Toaster />

  </StrictMode>,
)
