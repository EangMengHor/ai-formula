import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Utility to extract variables from a template string
function extractVariables(template) {
  const regex = /{{(.*?)}}/g;
  const vars = [];
  let match;
  while ((match = regex.exec(template))) {
    vars.push(match[1].trim());
  }
  return vars;
}

// Convert camelCase or PascalCase to readable label
function toLabel(str) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Highlight variables in the prompt template, replacing with input if available
function highlightPromptWithInputs(template, inputs) {
  return template.split(/({{.*?}})/g).map((part, idx) => {
    if (part.match(/^{{.*}}$/)) {
      const varName = part.replace(/[{}]/g, "").trim();
      const value = inputs[varName];
      return (
        <span
          key={idx}
          className={
            value
              ? "bg-slate-700 text-white rounded px-1 mx-0.5 font-semibold"
              : "bg-slate-600 text-slate-200 rounded px-1 mx-0.5"
          }
          style={{ transition: "background 0.2s" }}
        >
          {value || toLabel(varName)}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function WorkflowSteps({ steps }) {
  return (
    <div className="w-full flex flex-col items-center mt-2 mb-2">
      <div className="flex flex-col items-center w-full relative">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center w-full">
            <div className="flex w-full">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center z-10">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-px h-8 bg-slate-500 opacity-60 mx-auto" />
                )}
              </div>
              <div className="ml-4 pb-1 text-slate-200 text-sm font-medium flex-1">
                {step}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PromptTemplateDialog({ template, onPromptSubmit }) {
  const variables = useMemo(
    () => extractVariables(template.promptTemplate),
    [template],
  );
  const [inputs, setInputs] = useState(() =>
    Object.fromEntries(variables.map((v) => [v, ""])),
  );
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if all input variables are filled (non-empty)
  const allInputsFilled =
    variables.length === 0 ||
    variables.every((v) => (inputs[v] ?? "").trim().length > 0);

  // Replace variables in the prompt with user input
  const getPromptWithInputs = () => {
    let str = template.promptTemplate;
    variables.forEach((v) => {
      str = str.replaceAll(`{{${v}}}`, inputs[v] || toLabel(v));
    });
    return str;
  };

  const handleInputChange = (v, val) => {
    setInputs((prev) => ({ ...prev, [v]: val }));
  };

  const handleStart = () => {
    const compiled = [
      "my goal",
      template.outcome,
      "",
      getPromptWithInputs(),
      "",
      "follow this workflow",
      "",
      ...template.workflow,
    ].join("\n");
    // Redirect to dashboard with param isSubmit=true
    onPromptSubmit(compiled);
    toast({
      title: "Prompt Submitted",
      description: "Your prompt has been submitted successfully.",
      variant: "success",
    });
    navigate("/dashboard?isSubmit=true");
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className="bg-slate-800 hover:bg-slate-900 cursor-pointer rounded-lg p-4 text-white w-full max-w-xs min-w-[180px] transition flex flex-col gap-1">
          <div className="font-semibold text-sm mb-1">{template.name}</div>
          <div className="text-xs opacity-80">{template.outcome}</div>
          <div className="text-xs text-slate-400 mt-2">
            {template.workflow.length} step workflow&nbsp;|&nbsp;
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-w-2xl bg-slate-800 border-0">
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xl font-bold text-white">{template.name}</div>
            <div className="text-sm text-slate-300 mt-1">
              {template.outcome}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Prompt</label>
            <div className="w-full rounded bg-slate-900 px-3 py-3 text-white font-mono text-base border-0 focus:outline-none min-h-[60px] transition">
              {highlightPromptWithInputs(template.promptTemplate, inputs)}
            </div>
          </div>
          {variables.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 mb-1">
                Enter values for variables:
              </div>
              {variables.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <label className="w-48 text-slate-200 font-medium">
                    {toLabel(v)}
                  </label>
                  <input
                    className="flex-1 px-3 py-2 rounded bg-slate-700 text-white border-0 outline-none focus:ring-2 focus:ring-slate-500"
                    value={inputs[v]}
                    onChange={(e) => handleInputChange(v, e.target.value)}
                    placeholder={`Enter ${toLabel(v)}`}
                  />
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="text-xs text-slate-400 mb-2">Workflow</div>
            <WorkflowSteps steps={template.workflow} />
          </div>
          <button
            className="mt-2 px-6 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStart}
            type="button"
            disabled={!allInputsFilled}
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
