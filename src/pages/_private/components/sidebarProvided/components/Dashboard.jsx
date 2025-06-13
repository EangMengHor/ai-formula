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
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { appendToChatHistory } = _useSidebar();
  const [searchParams] = useSearchParams();
  const isSubmit = searchParams.get("isSubmit");
  useEffect(() => {
    setValue(promptTemplatePrompt);
    if (isSubmit) {
      handleSubmit(promptTemplatePrompt);
    }
  }, [promptTemplatePrompt]);

  useEffect(() => {
    async function refreshSession() {
      await refreshAccessToken();
    }
    refreshSession();
  }, []);

  async function handleSubmit(passedValue) {
    const localValud = passedValue || value.trim();
    console.log("Submitting value:", localValud);
    setIsChatLoading(true);
    try {
      const res = await getNewSession(localValud, user.id);
      if (res.success) {
        appendToChatHistory(res.data);
        localStorage.setItem("prompt", localValud);
        localStorage.setItem("isFallbackedUser", "true");
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
      <div className="absolute top-5 w-full flex items-center justify-center mb-[10%]">
        <AnimatedBadge onClick={() => navigate("/manual")}>
          Work Along With Interactive User Manual
        </AnimatedBadge>
      </div>
      <div className="w-full max-w-[70%] mt-[10%] md:w-full relative">
        <ChatInput
          input={value}
          setInput={setValue}
          handleSubmit={handleSubmit}
          isLoading={isChatLoading}
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
