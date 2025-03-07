import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { Toaster } from './components/ui/toaster'
import { SidebarProvider } from './context/SidebarContext'
import { FilesUploadMetadataProvider } from './context/FilesUploadMetadata'
import { AudioProvider } from './context/AudioContext'
import StackSidebarProvider from './context/StackSidebarContext'

createRoot(document.getElementById('root')).render(

  <BrowserRouter>
    <UserProvider>
      <SidebarProvider>
        <FilesUploadMetadataProvider>
                  <StackSidebarProvider>
          
          <AudioProvider>
            <App />
          </AudioProvider>
                  </StackSidebarProvider>
        </FilesUploadMetadataProvider>
      </SidebarProvider>
    </UserProvider>
    <Toaster />
  </BrowserRouter>

)
