import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./components/ui/toaster";
import { SidebarProvider } from "./context/SidebarContext";
import { FilesUploadMetadataProvider } from "./context/FilesUploadMetadata";
import { AudioProvider } from "./context/AudioContext";
import StackSidebarProvider from "./context/StackSidebarContext";
import { ReactFlowProvider } from "@xyflow/react";
import { DomainProvider } from "./context/WhichDomainContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <DomainProvider>
      <UserProvider>
        <SidebarProvider>
          <FilesUploadMetadataProvider>
            <StackSidebarProvider>
              <AudioProvider>
                <ReactFlowProvider>
                  <App />
                </ReactFlowProvider>
              </AudioProvider>
            </StackSidebarProvider>
          </FilesUploadMetadataProvider>
        </SidebarProvider>
      </UserProvider>
      <Toaster />
    </DomainProvider>
  </BrowserRouter>,
);
