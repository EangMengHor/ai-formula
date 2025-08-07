import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ChatInput from "../../../../../components/custom/ChatInput";
import { useToast } from "../../../../../hooks/use-toast";
import { _useSidebar } from "../../../../../context/SidebarContext";
import { getNewSession } from "../../../../../services/n8n-apis/_core/getNewSession.api";
import { memo, useEffect, useMemo, useState } from "react";
import { useUser } from "../../../../../context/UserContext";
import AnimatedBadge from "../../../../../components/custom/AnimatedBadge";
import Attachments from "./Attachments";
import { promptTemplate, promptTemplateCategories } from "@/lib/config";
import PromptTemplateDialog from "./PromptTemplateDialog";
import { useFileUpload } from "../../../../../hooks/use-file-upload";
import { Upload } from "lucide-react";
import { useFilesUploadMetadata } from "../../../../../context/FilesUploadMetadata";
import { useChatCtx } from "@/context/ChatContext";

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Helper for robust template search
function searchPromptTemplates(query) {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return promptTemplate.filter(
    (tpl) =>
      tpl.name.toLowerCase().includes(lower) ||
      tpl.outcome.toLowerCase().includes(lower) ||
      tpl.promptTemplate.toLowerCase().includes(lower) ||
      (tpl.workflow || []).some((w) => w.toLowerCase().includes(lower)) ||
      (promptTemplateCategories[tpl.category - 1] || "")
        .toLowerCase()
        .includes(lower),
  );
}

function PromptTemplatesSection({ templates, label, onPromptSubmit }) {
  // Only render if there are templates to show
  if (!templates.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold text-white">{label}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {templates.map((tpl, idx) => (
          <PromptTemplateDialog
            key={tpl.name + idx}
            template={tpl}
            onPromptSubmit={onPromptSubmit}
          />
        ))}
      </div>
      <hr className=" border-b-2 border-white" />
    </div>
  );
}

function Dashboard() {
  const [value, setValue] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    user,
    refreshAccessToken,
    setPromptTemplatePrompt,
    promptTemplatePrompt,
  } = useUser();
  const { conversation, setConversation } = useChatCtx();

  const [isChatLoading, setIsChatLoading] = useState(false);
  const { appendToChatHistory } = _useSidebar();
  const [searchParams] = useSearchParams();
  const isSubmit = searchParams.get("isSubmit");
  const [clientSessionId, setClientSessionId] = useState(null);
  const { isMemorizationLoading } = useFilesUploadMetadata();

  // Generate client session ID when files are first uploaded
  const generateClientSessionId = () => {
    const newSessionId = crypto.randomUUID();
    setClientSessionId(newSessionId);
    // Store in localStorage so file-upload-dialog can access it
    localStorage.setItem("dashboardSessionId", newSessionId);
    return newSessionId;
  };

  // File upload functionality - disable vectorization in hook for dashboard
  // Let file-upload-dialog handle the actual vectorization with proper session ID
  const { isDragActive } = useFileUpload({
    enabled: !isChatLoading,
    maxFiles: 200,
    disableVectorization: true, // Disable vectorization in hook for dashboard
    onFilesAdded: (files) => {
      console.log("Files added via drag and drop:", files);
      // Generate session ID immediately when files are added
      generateClientSessionId();
    },
    excludeSelector: "[data-sidebar], .sidebar",
  });

  useEffect(() => {
    setValue(promptTemplatePrompt);
    if (isSubmit) {
      handleSubmit(promptTemplatePrompt);
    }
  }, [promptTemplatePrompt]);

  // Clean up dashboard session ID when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear if we're navigating to chat (handled in handleSubmit)
      if (!window.location.pathname.includes("/chat/")) {
        localStorage.removeItem("dashboardSessionId");
      }
    };
  }, []);

  useEffect(() => {
    async function refreshSession() {
      await refreshAccessToken();
    }
    refreshSession();
  }, []);

  async function handleSubmit(passedValue) {
    const localValud = passedValue || value.trim();
    console.log("Submitting value:", localValud);

    // Don't allow submission if files are still being processed
    if (isMemorizationLoading) {
      toast({
        title: "Please Wait",
        description:
          "Files are still being uploaded. Please wait until all files are processed.",
        variant: "destructive",
      });
      return;
    }

    setIsChatLoading(true);
    try {
      // Use client-generated session ID if files were uploaded
      const sessionIdToUse = clientSessionId;

      const res = await getNewSession(localValud, user.id, sessionIdToUse);
      if (res.success) {
        appendToChatHistory(res.data);
        localStorage.setItem("prompt", localValud);
        localStorage.setItem("isFallbackedUser", "true");

        // Clear the dashboard session ID from localStorage
        localStorage.removeItem("dashboardSessionId");
        setConversation([]);
        navigate(`/chat/${res.data.sessionid}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      setIsChatLoading(false);
    };
  }, []);

  // Debounced search for templates
  const debouncedValue = useDebouncedValue(value, 300);
  const searchedTemplates = useMemo(
    () => searchPromptTemplates(debouncedValue).slice(0, 8),
    [debouncedValue],
  );
  const showSearched =
    debouncedValue.trim().length > 0 && searchedTemplates.length > 0;

  return (
    <div
      className="flex w-full h-full md:mt-0 mt-[20%] relative md:items-center justify-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9)), url('./Frame2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Drag and drop overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md border-2 border-dashed border-blue-300 rounded-xl p-8 max-w-md mx-4 text-center">
            <Upload className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Drop files to upload
            </h3>
            <p className="text-blue-200 text-sm">
              Drop your files anywhere to add them to your conversation
            </p>
            <div className="mt-4 text-xs text-blue-300">
              Supported: PDF, TXT, DOCX, XLSX, PPTX, MD, CSV
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-5 w-full flex items-center justify-center mb-[10%]">
        <AnimatedBadge onClick={() => navigate("/manual")}>
          Work Along With Interactive User Manual
        </AnimatedBadge>
      </div>
      <div className="max-w-5xl  w-full mx-auto">
        <ChatInput
          input={value}
          setInput={setValue}
          handleSubmit={handleSubmit}
          isLoading={isChatLoading || isMemorizationLoading}
          setLoading={setIsChatLoading}
        />
        <div className="mt-6">
          {showSearched && (
            <PromptTemplatesSection
              templates={searchedTemplates}
              label="Searched Templates"
              onPromptSubmit={(val) => {
                setPromptTemplatePrompt(val);
                handleSubmit(val);
              }}
            />
          )}
        </div>
        <div className="min-h-[40%]">
          <Attachments onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default memo(Dashboard);
