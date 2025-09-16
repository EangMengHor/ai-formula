import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Settings,
  Shield,
  Database,
  Wrench,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StandardWorkflow from "@/components/custom/Workflow/StandardWorkflow";
import SuperiorPromptIntelligence from "@/lib/superiorPromptIntelligence";
import DynamicEnhancementEngine from "@/lib/dynamicEnhancementEngine";
import HyperPerfectEnhancer from "@/lib/hyperPerfectEnhancer";
import { useToast } from "@/hooks/use-toast";
import { storePrompt } from "@/services/promptBuilder/storePrompt";
import { Pre } from "@/components/custom/CodeBlock";

const formSchema = z.object({
  raw_prompt: z
    .string()
    .min(1, "Raw prompt is required")
    .max(30000, "Raw prompt cannot exceed 30,000 characters"),
  primary_goal: z.string().min(1, "Primary goal is required"),
  audience: z.string().min(1, "Audience is required"),
  domain: z.string().min(1, "Domain is required"),
  task_type: z.string().min(1, "Task type is required"),
  language: z.string().min(1, "Language is required"),
  constraints: z.object({
    length_limit: z.string().min(1, "Length limit is required"),
    format: z.string().min(1, "Format is required"),
    tone: z.string().optional(),
    style_guidelines: z.array(z.string()).optional().default([]),
  }),
  safety_guardrails: z.object({
    confidential: z.boolean().optional().default(false),
    pii_allowed: z.boolean().optional().default(false),
    citation_required: z.boolean().optional().default(false),
    restricted_topics: z.array(z.string()).optional().default([]),
  }),
  data_context: z.object({
    citation_style: z.string().optional().default("None"),
    as_of: z.date().optional(),
    sources_bundle: z.array(z.string()).optional().default([]),
  }),
  tool_context: z.object({
    browsing_allowed: z.boolean().optional().default(false),
    code_execution_allowed: z.boolean().optional().default(false),
    allowed_tools: z.array(z.string()).optional().default([]),
  }),
  variants_count: z.number().min(1).max(3).optional().default(1),
  include_json_schema: z.boolean().optional().default(true),
});

// Step definitions
const steps = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Core prompt definition and context establishment",
    icon: FileText,
    fields: [
      "raw_prompt",
      "primary_goal",
      "audience",
      "domain",
      "task_type",
      "language",
    ],
  },
  {
    id: "constraints",
    title: "Constraints",
    description: "Output specifications and quality requirements",
    icon: Settings,
    fields: ["constraints.length_limit", "constraints.format"],
  },
  {
    id: "safety",
    title: "Safety",
    description: "Compliance, security, and ethical guardrails",
    icon: Shield,
    fields: [],
  },
  {
    id: "data",
    title: "Data Context",
    description: "Knowledge base and reference specifications",
    icon: Database,
    fields: [],
  },
  {
    id: "tools",
    title: "Tools",
    description: "Capability and resource specifications",
    icon: Wrench,
    fields: [],
  },
];

export default function PromptBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [styleGuidelines, setStyleGuidelines] = useState([]);
  const [restrictedTopics, setRestrictedTopics] = useState([]);
  const [sourcesBundle, setSourcesBundle] = useState([]);
  const [allowedTools, setAllowedTools] = useState([]);
  const [asOfDate, setAsOfDate] = useState(new Date());
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [rawPromptCharCount, setRawPromptCharCount] = useState(0);

  // Initialize enhancement engines
  const superiorIntelligence = useMemo(
    () => new SuperiorPromptIntelligence(),
    [],
  );
  const dynamicEngine = useMemo(() => {
    const engine = new DynamicEnhancementEngine();
    engine.setSuperiorIntelligence(superiorIntelligence);
    return engine;
  }, [superiorIntelligence]);
  const hyperPerfectEnhancer = useMemo(() => new HyperPerfectEnhancer(), []);

  // Add result state for enhanced prompts
  const [enhancedResult, setEnhancedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [resultFormat, setResultFormat] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState("builder"); // "builder" or "results"

  // Toast hook
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      raw_prompt: "",
      primary_goal: "",
      audience: "",
      domain: "",
      task_type: "",
      language: "en",
      constraints: {
        length_limit: "",
        format: "",
        tone: "",
        style_guidelines: [],
      },
      safety_guardrails: {
        confidential: false,
        pii_allowed: false,
        citation_required: false,
        restricted_topics: [],
      },
      data_context: {
        citation_style: "None",
        as_of: new Date(),
        sources_bundle: [],
      },
      tool_context: {
        browsing_allowed: false,
        code_execution_allowed: false,
        allowed_tools: [],
      },
      variants_count: 1,
      include_json_schema: true,
    },
  });

  // Track character count for raw prompt
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.raw_prompt !== undefined) {
        setRawPromptCharCount(value.raw_prompt.length);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data) => {
    console.log(
      "onSubmit called, currentStep:",
      currentStep,
      "steps.length - 1:",
      steps.length - 1,
    );

    // Double check we're on the final step
    if (currentStep !== steps.length - 1) {
      console.log("Preventing submission - not on final step");
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Phase 1: Advanced Intelligence Analysis
      const analysis = superiorIntelligence.analyzePrompt(
        data.raw_prompt,
        data,
      );

      // Phase 2: Dynamic Enhancement with Superior Intelligence
      const enhancementResult = await dynamicEngine.enhancePromptDynamically(
        data.raw_prompt,
        data,
        { analysis },
      );

      // Phase 3: Traditional Enhancement (as fallback/comparison)
      const traditionalResult = hyperPerfectEnhancer.process(data);

      // Phase 4: Combine Results with Superior Intelligence
      const finalResult = {
        ...traditionalResult,
        superiorEnhancement: enhancementResult,
        intelligenceAnalysis: analysis,
        enhancementMetrics: enhancementResult.enhancementMetrics,
        intelligenceScore: enhancementResult.intelligenceScore,
        optimizationReport: enhancementResult.optimizationReport,
        processingTimestamp: new Date().toISOString(),
        inputData: data,
      };

      if (finalResult.error) {
        setProcessingError(finalResult);
      } else {
        setEnhancedResult(finalResult);
      }
    } catch (err) {
      console.error("Superior enhancement error:", err);
      // Fallback to traditional enhancement
      try {
        const fallbackResult = hyperPerfectEnhancer.process(data);
        setEnhancedResult({
          ...fallbackResult,
          fallback: true,
          error: err.message,
        });
      } catch (fallbackErr) {
        setProcessingError({
          error: "ProcessingError",
          message: `Both enhancement methods failed: ${err.message}`,
          fallbackError: fallbackErr.message,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCurrentStep = async () => {
    const currentStepData = steps[currentStep];
    const fieldsToValidate = currentStepData.fields;

    if (fieldsToValidate.length === 0) return true;

    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const handleFinalSubmit = async () => {
    console.log("handleFinalSubmit called directly");
    const formData = form.getValues();
    await onSubmit(formData);
    // Switch to results view after submission
    setCurrentView("results");
  };

  const handleBackToBuilder = () => {
    setCurrentView("builder");
  };

  const handleCreateNewPrompt = () => {
    // Reset all form data and states
    form.reset();
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStyleGuidelines([]);
    setRestrictedTopics([]);
    setSourcesBundle([]);
    setAllowedTools([]);
    setAsOfDate(new Date());
    setEnhancedResult(null);
    setIsProcessing(false);
    setProcessingError(null);
    setResultFormat("text");
    setIsSaving(false);
    setCurrentView("builder");
    setRawPromptCharCount(0);
  };

  const handleNext = async () => {
    console.log("handleNext called, currentStep:", currentStep);
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = async (stepIndex) => {
    if (stepIndex > currentStep) {
      // Going forward - validate current step first
      const isValid = await validateCurrentStep();
      if (!isValid) return;
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
    }
    setCurrentStep(stepIndex);
  };

  const addStyleGuideline = () => {
    setStyleGuidelines([...styleGuidelines, ""]);
  };

  const removeStyleGuideline = (index) => {
    setStyleGuidelines(styleGuidelines.filter((_, i) => i !== index));
  };

  const updateStyleGuideline = (index, value) => {
    const updated = [...styleGuidelines];
    updated[index] = value;
    setStyleGuidelines(updated);
  };

  const handleRawPromptChange = (e) => {
    const value = e.target.value;
    const charCount = value.length;

    // Prevent exceeding 30,000 characters
    if (charCount > 30000) {
      toast({
        title: "Character Limit Exceeded",
        description:
          "Raw prompt cannot exceed 30,000 characters. Please shorten your prompt.",
        variant: "destructive",
      });
      // Truncate the value to 30,000 characters
      const truncatedValue = value.substring(0, 30000);
      form.setValue("raw_prompt", truncatedValue);
      setRawPromptCharCount(30000);
      return;
    }

    // Update character count
    setRawPromptCharCount(charCount);

    // Update form value
    form.setValue("raw_prompt", value);
  };

  const addRestrictedTopic = () => {
    setRestrictedTopics([...restrictedTopics, ""]);
  };

  const removeRestrictedTopic = (index) => {
    setRestrictedTopics(restrictedTopics.filter((_, i) => i !== index));
  };

  const updateRestrictedTopic = (index, value) => {
    const updated = [...restrictedTopics];
    updated[index] = value;
    setRestrictedTopics(updated);
  };

  const addSource = () => {
    setSourcesBundle([...sourcesBundle, ""]);
  };

  const removeSource = (index) => {
    setSourcesBundle(sourcesBundle.filter((_, i) => i !== index));
  };

  const updateSource = (index, value) => {
    const updated = [...sourcesBundle];
    updated[index] = value;
    setSourcesBundle(updated);
  };

  const addTool = () => {
    setAllowedTools([...allowedTools, ""]);
  };

  const removeTool = (index) => {
    setAllowedTools(allowedTools.filter((_, i) => i !== index));
  };

  const updateTool = (index, value) => {
    const updated = [...allowedTools];
    updated[index] = value;
    setAllowedTools(updated);
  };

  const handleSavePrompt = async () => {
    if (!enhancedResult) return;

    setIsSaving(true);
    try {
      const userId = localStorage.getItem("id");

      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save prompts.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for saving
      const promptData = {
        json: JSON.stringify({
          ...enhancedResult,
          savedAt: new Date().toISOString(),
        }),
        prompt:
          enhancedResult.superiorEnhancement?.enhancedPrompt ||
          enhancedResult.engineered_prompt ||
          "Enhanced prompt data",
        userId: userId,
      };

      await storePrompt(promptData);

      toast({
        title: "Prompt Saved Successfully",
        description: "Your enhanced prompt has been saved to your collection.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6 w-full">
            <div className="grid gap-6">
              <div>
                <Label
                  htmlFor="raw_prompt"
                  className="text-white text-sm font-medium"
                >
                  Raw Prompt *
                </Label>
                <Textarea
                  id="raw_prompt"
                  value={form.watch("raw_prompt")}
                  onChange={handleRawPromptChange}
                  placeholder="Enter your original prompt here..."
                  className={`bg-white/10 text-white placeholder:text-white/50 mt-2 min-h-[120px] resize-none ${
                    rawPromptCharCount > 27000
                      ? "border-red-400/50"
                      : rawPromptCharCount > 25000
                        ? "border-yellow-400/50"
                        : "border-white/20"
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
                  {form.formState.errors.raw_prompt && (
                    <p className="text-red-400 text-sm">
                      {form.formState.errors.raw_prompt.message}
                    </p>
                  )}
                  <div
                    className={`text-sm ml-auto sm:ml-0 ${
                      rawPromptCharCount > 27000
                        ? "text-red-400"
                        : rawPromptCharCount > 25000
                          ? "text-yellow-400"
                          : "text-white/70"
                    }`}
                  >
                    {rawPromptCharCount}/30,000 characters
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="primary_goal"
                    className="text-white text-sm font-medium"
                  >
                    Primary Goal *
                  </Label>
                  <Input
                    id="primary_goal"
                    {...form.register("primary_goal")}
                    placeholder="Main objective"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                  />
                  {form.formState.errors.primary_goal && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.primary_goal.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="audience"
                    className="text-white text-sm font-medium"
                  >
                    Target Audience *
                  </Label>
                  <Input
                    id="audience"
                    {...form.register("audience")}
                    placeholder="Who will use this prompt"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                  />
                  {form.formState.errors.audience && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.audience.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="domain"
                    className="text-white text-sm font-medium"
                  >
                    Domain *
                  </Label>
                  <Input
                    id="domain"
                    {...form.register("domain")}
                    placeholder="Subject area expertise"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                  />
                  {form.formState.errors.domain && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.domain.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="task_type"
                    className="text-white text-sm font-medium"
                  >
                    Task Type *
                  </Label>
                  <Select
                    onValueChange={(value) => form.setValue("task_type", value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white mt-2">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="analyze">Analyze</SelectItem>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="summarize">Summarize</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                      <SelectItem value="brainstorm">Brainstorm</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.task_type && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.task_type.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="language"
                  className="text-white text-sm font-medium"
                >
                  Language *
                </Label>
                <Input
                  id="language"
                  {...form.register("language")}
                  placeholder="Language code (e.g., en)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                />
                {form.formState.errors.language && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.language.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 1: // Constraints
        return (
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="length_limit"
                    className="text-white text-sm font-medium"
                  >
                    Length Limit *
                  </Label>
                  <Input
                    id="length_limit"
                    {...form.register("constraints.length_limit")}
                    placeholder="Word count, page count, etc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                  />
                  {form.formState.errors.constraints?.length_limit && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.constraints.length_limit.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="format"
                    className="text-white text-sm font-medium"
                  >
                    Output Format *
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("constraints.format", value)
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white mt-2">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.constraints?.format && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.constraints.format.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="tone"
                  className="text-white text-sm font-medium"
                >
                  Tone
                </Label>
                <Input
                  id="tone"
                  {...form.register("constraints.tone")}
                  placeholder="Professional, Casual, Academic, etc."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                />
              </div>

              <div>
                <Label className="text-white text-sm font-medium">
                  Style Guidelines
                </Label>
                <div className="mt-2 space-y-3">
                  {styleGuidelines.map((guideline, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={guideline}
                        onChange={(e) =>
                          updateStyleGuideline(index, e.target.value)
                        }
                        placeholder="Add a style guideline"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeStyleGuideline(index)}
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStyleGuideline}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Guideline
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Safety
        return (
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="confidential"
                    {...form.register("safety_guardrails.confidential")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="confidential"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Confidential Information Handling
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="pii_allowed"
                    {...form.register("safety_guardrails.pii_allowed")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="pii_allowed"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Personal Data Permissions
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="citation_required"
                    {...form.register("safety_guardrails.citation_required")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="citation_required"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Source Attribution Requirements
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm font-medium">
                  Restricted Topics
                </Label>
                <div className="mt-2 space-y-3">
                  {restrictedTopics.map((topic, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={topic}
                        onChange={(e) =>
                          updateRestrictedTopic(index, e.target.value)
                        }
                        placeholder="Add a restricted topic"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRestrictedTopic(index)}
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRestrictedTopic}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topic
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Data Context
        return (
          <div className="space-y-6">
            <div className="grid gap-6">
              <div>
                <Label className="text-white text-sm font-medium">
                  Citation Style
                </Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("data_context.citation_style", value)
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white mt-2">
                    <SelectValue placeholder="Select citation style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APA">APA</SelectItem>
                    <SelectItem value="Bluebook">Bluebook</SelectItem>
                    <SelectItem value="OSCOLA">OSCOLA</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm font-medium">
                  Knowledge Cutoff Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 mt-2",
                        !asOfDate && "text-white/50",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {asOfDate ? (
                        format(asOfDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={asOfDate}
                      onSelect={setAsOfDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-white text-sm font-medium">
                  Sources Bundle
                </Label>
                <div className="mt-2 space-y-3">
                  {sourcesBundle.map((source, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={source}
                        onChange={(e) => updateSource(index, e.target.value)}
                        placeholder="Add URL, reference, or document"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeSource(index)}
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSource}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Source
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Tools
        return (
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="browsing_allowed"
                    {...form.register("tool_context.browsing_allowed")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="browsing_allowed"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Web Access Permissions
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="code_execution_allowed"
                    {...form.register("tool_context.code_execution_allowed")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="code_execution_allowed"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Programming Capabilities
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm font-medium">
                  Allowed Tools
                </Label>
                <div className="mt-2 space-y-3">
                  {allowedTools.map((tool, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={tool}
                        onChange={(e) => updateTool(index, e.target.value)}
                        placeholder="Add a permitted tool"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTool(index)}
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTool}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="variants_count"
                    className="text-white text-sm font-medium"
                  >
                    Variants Count
                  </Label>
                  <Input
                    id="variants_count"
                    type="number"
                    min="1"
                    max="3"
                    {...form.register("variants_count", {
                      valueAsNumber: true,
                    })}
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Checkbox
                    id="include_json_schema"
                    {...form.register("include_json_schema")}
                    className="border-white/30"
                  />
                  <Label
                    htmlFor="include_json_schema"
                    className="text-white text-sm font-medium flex-1"
                  >
                    Structured Output Format
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Prepare workflow data for StandardWorkflow component
  const workflowData = steps.map((step, index) => ({
    title: step.title,
    description: step.description,
    isCompleted: completedSteps.has(index),
    isLoading: false, // You can set this to true when validating/processing
    children: index === currentStep ? renderStepContent() : null,
  }));

  return (
    <div className="min-h-screen w-full p-6">
      <div className="max-w-4xl mx-auto">
        {currentView === "builder" ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-3xl font-bold">
                Prompt Builder
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Create a comprehensive prompt with structured constraints and
                safety measures
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 w-full">
              {/* Progress Indicator */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Progress</span>
                  <span className="text-white text-sm font-medium">
                    {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2 bg-white/20" />
              </div>

              {/* Step Workflow with Embedded Forms */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Only submit if we're on the last step
                  if (currentStep === steps.length - 1) {
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="space-y-8 w-full"
              >
                <div className="bg-white/5 rounded-lg p-6 w-full">
                  <StandardWorkflow data={workflowData} />
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-white/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 font-semibold disabled:opacity-50"
                    >
                      {isProcessing ? "Creating..." : "Create Prompt"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToBuilder}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Go to Prompt Builder</span>
              </Button>

              <Button
                type="button"
                onClick={handleCreateNewPrompt}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold"
              >
                Create New Prompt
              </Button>
            </div>

            {/* Enhanced Results Display */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold">
                  Enhanced Prompt Results
                </CardTitle>
                <CardDescription className="text-white/70">
                  Your prompt has been processed and enhanced
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Processing Status */}
                {isProcessing && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                      <span className="text-blue-300">
                        Processing with AI enhancement engines...
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {processingError && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-300 font-semibold mb-2">
                      Processing Error
                    </h4>
                    <p className="text-red-200">{processingError.message}</p>
                    {processingError.fallbackError && (
                      <p className="text-red-200 text-sm mt-2">
                        Fallback also failed: {processingError.fallbackError}
                      </p>
                    )}
                  </div>
                )}

                {/* Results Display */}
                {enhancedResult && !processingError && (
                  <div className="space-y-6">
                    {/* Intelligence Analysis */}
                    {enhancedResult.intelligenceAnalysis && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">
                          Intelligence Analysis
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/70">
                              Primary Intent:
                            </span>
                            <span className="text-white ml-2">
                              {
                                enhancedResult.intelligenceAnalysis
                                  .intentAnalysis?.primaryIntent
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-white/70">Complexity:</span>
                            <span className="text-white ml-2">
                              {
                                enhancedResult.intelligenceAnalysis
                                  .complexityAssessment?.level
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-white/70">
                              Cognitive Load:
                            </span>
                            <span className="text-white ml-2">
                              {
                                enhancedResult.intelligenceAnalysis
                                  .cognitiveLoad?.level
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-white/70">
                              Intelligence Score:
                            </span>
                            <span className="text-white ml-2">
                              {enhancedResult.intelligenceScore || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Prompt Display */}
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setResultFormat("text")}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              resultFormat === "text"
                                ? "bg-blue-600 text-white"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            Text Format
                          </button>
                          <button
                            onClick={() => setResultFormat("json")}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              resultFormat === "json"
                                ? "bg-blue-600 text-white"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            JSON Format
                          </button>
                        </div>

                        {/* Save Button */}
                        <Button
                          onClick={handleSavePrompt}
                          disabled={isSaving || !enhancedResult}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-semibold flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isSaving ? "Saving..." : "Save Prompt"}</span>
                        </Button>
                      </div>

                      <div className="b">
                        {resultFormat === "text" ? (
                          <div className="space-y-4">
                            {/* Superior Enhanced Prompt */}
                            {enhancedResult.superiorEnhancement
                              ?.enhancedPrompt && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">
                                  Superior Enhanced Prompt
                                </h4>
                                <Pre>
                                  {
                                    enhancedResult.superiorEnhancement
                                      .enhancedPrompt
                                  }
                                </Pre>
                              </div>
                            )}

                            {/* Traditional Enhanced Prompt */}
                            {enhancedResult.engineered_prompt && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">
                                  Traditional Enhanced Prompt
                                </h4>
                                <Pre>{enhancedResult.engineered_prompt}</Pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Superior Enhancement JSON */}
                            {enhancedResult.superiorEnhancement && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">
                                  Superior Enhancement Data
                                </h4>
                                <Pre>
                                  {JSON.stringify(
                                    enhancedResult.superiorEnhancement,
                                    null,
                                    2,
                                  )}
                                </Pre>
                              </div>
                            )}

                            {/* Traditional Enhancement JSON */}
                            {enhancedResult.engineered_prompt_json && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">
                                  Traditional Enhancement JSON
                                </h4>
                                <Pre>
                                  {JSON.stringify(
                                    enhancedResult.engineered_prompt_json,
                                    null,
                                    2,
                                  )}
                                </Pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhancement Metrics */}
                    {(enhancedResult.enhancementMetrics ||
                      enhancedResult.superiorEnhancement
                        ?.enhancementMetrics) && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3">
                          Enhancement Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-green-500/20 rounded p-3">
                            <div className="text-green-300 font-semibold">
                              Improvement
                            </div>
                            <div className="text-white text-lg">
                              {enhancedResult.superiorEnhancement
                                ?.enhancementMetrics?.improvement ||
                                enhancedResult.enhancementMetrics
                                  ?.improvement ||
                                "N/A"}
                              %
                            </div>
                          </div>
                          <div className="bg-blue-500/20 rounded p-3">
                            <div className="text-blue-300 font-semibold">
                              Confidence
                            </div>
                            <div className="text-white text-lg">
                              {enhancedResult.superiorEnhancement
                                ?.enhancementMetrics?.confidence ||
                                enhancedResult.enhancementMetrics?.confidence ||
                                "N/A"}
                            </div>
                          </div>
                          <div className="bg-purple-500/20 rounded p-3">
                            <div className="text-purple-300 font-semibold">
                              Intelligence Score
                            </div>
                            <div className="text-white text-lg">
                              {enhancedResult.intelligenceScore || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback Notice */}
                    {enhancedResult.fallback && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                        <h4 className="text-yellow-300 font-semibold mb-2">
                          Fallback Mode
                        </h4>
                        <p className="text-yellow-200 text-sm">
                          Advanced enhancement failed, showing traditional
                          enhancement results. Error: {enhancedResult.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
