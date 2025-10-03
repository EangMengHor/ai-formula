import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Anvil, ArrowRight, Paperclip, X, Loader2 } from "lucide-react";
import { extractText } from "@/services/n8n-apis/promptBuilder/extractText";
import { generatePrompt } from "@/services/n8n-apis/promptBuilder/generatePrompt";
import { savePrompt } from "@/services/n8n-apis/promptBuilder/savePrompt";
import { useToast } from "@/hooks/use-toast";
import { Pre as CodeBlock } from "@/components/custom/CodeBlock";

export default function PromptBuilder() {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("Normal");
  const [files, setFiles] = useState([]); // Array of {file, text, usage}
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [activeUploads, setActiveUploads] = useState(0);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      // Prepare the data for the API
      const submissionData = {
        input: prompt,
        oldPrompt: "", // Could be enhanced to support old prompts
        templates: files.map((item) => ({
          fileName: item.file.name,
          text: item.text,
          usage: item.usage,
        })),
        format: format.toLowerCase(), // API expects lowercase
      };

      console.log("Submitting data:", submissionData);

      // Call the generatePrompt API with streaming callback
      await generatePrompt(
        submissionData.input,
        submissionData.oldPrompt,
        submissionData.templates,
        submissionData.format,
        (chunk, accumulated) => {
          setStreamingContent(accumulated);
        },
      );

      // Keep the original prompt, don't replace it
      // setPrompt(generatedPrompt);

      toast({
        title: "Success",
        description: "Prompt enhanced successfully",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to enhance prompt",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
      // Keep the final streaming content visible
      // setStreamingContent("");
    }
  };

  const handleSavePrompt = async () => {
    if (!streamingContent.trim()) {
      toast({
        title: "No content to save",
        description: "Please generate a prompt first",
        variant: "destructive",
      });
      return;
    }

    if (!promptName.trim()) {
      toast({
        title: "Prompt name required",
        description: "Please enter a name for your prompt",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare the data for saving
      const saveData = {
        prompt: streamingContent,
        promptName: promptName.trim(),
        format: format.toLowerCase(),
        templates: files.map((item) => ({
          fileName: item.file.name,
          text: item.text,
          usage: item.usage,
        })),
      };

      console.log("Saving prompt:", saveData);

      // Call the savePrompt API
      const savedPrompt = await savePrompt(
        saveData.prompt,
        saveData.promptName,
        saveData.format,
        saveData.templates,
      );

      toast({
        title: "Prompt saved",
        description: `"${saveData.promptName}" has been saved successfully`,
      });

      // Clear the prompt name after successful save
      setPromptName("");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save prompt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    const acceptedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    const validFiles = newFiles.filter((file) =>
      acceptedTypes.includes(file.type),
    );

    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description:
          "Some files were not supported and were ignored. Supported: PDF, DOCX, CSV, XLSX, TXT",
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    // Check total file limit (existing + new)
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > 5) {
      toast({
        title: "File limit exceeded",
        description: `You can upload a maximum of 5 files. You currently have ${files.length} files and tried to add ${validFiles.length} more.`,
        variant: "destructive",
      });
      return;
    }

    const filesInBatch = validFiles.length;

    setActiveUploads((prev) => {
      const newCount = prev + 1;
      setIsLoading(newCount > 0);
      return newCount;
    });
    // Reset progress for this batch
    setUploadProgress({
      current: 0,
      total: filesInBatch,
    });

    try {
      const processedFiles = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
          const extractedText = await extractText(file);
          processedFiles.push({
            file,
            text: extractedText,
            usage: "",
          });
        } catch (error) {
          console.error(`Failed to extract text from ${file.name}:`, error);
          toast({
            title: "Extraction failed",
            description: `Failed to extract text from ${file.name}`,
            variant: "destructive",
          });
          // Still add the file but with empty text
          processedFiles.push({
            file,
            text: "",
            usage: "",
          });
        }
        // Update progress
        setUploadProgress((prev) => ({
          current: prev.current + 1,
          total: prev.total,
        }));
      }

      setFiles((prev) => [...prev, ...processedFiles]);

      toast({
        title: "Files uploaded",
        description: `${processedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process uploaded files",
        variant: "destructive",
      });
    } finally {
      setActiveUploads((prev) => {
        const newCount = prev - 1;
        setIsLoading(newCount > 0);
        return newCount;
      });
      // Reset progress after completion
      setUploadProgress({
        current: 0,
        total: 0,
      });
    }

    // Reset input
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUsage = (index, usage) => {
    setFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, usage } : item)),
    );
  };

  return (
    <div
      className={`min-h-screen p-3 sm:p-4 md:p-8 ${streamingContent && !isStreaming ? "pb-24" : ""}`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-slate-700/50 rounded-lg shadow-sm">
              <Anvil className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white">
              Prompt Anvil
            </h1>
          </div>
        </div>

        <div className=" rounded-xl p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
          <div className="relative">
            <label className="text-white text-xs font-medium mb-1 block">
              Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="min-h-[120px] md:min-h-[200px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none rounded-lg pb-4 sm:pb-12 md:pb-10"
            />

            {/* Controls at bottom of textarea - desktop only */}
            <div className="hidden sm:block absolute bottom-2 left-2 right-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Format selector */}
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-fit h-7 bg-slate-600 border-slate-500 text-white text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem
                        value="Normal"
                        className="text-white hover:bg-slate-700 text-xs"
                      >
                        Normal
                      </SelectItem>
                      <SelectItem
                        value="JSON"
                        className="text-white hover:bg-slate-700 text-xs"
                      >
                        JSON
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* File upload */}
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-1 text-slate-400 hover:text-blue-400 flex items-center gap-1 text-sm disabled:opacity-50"
                    title="Upload PDF, DOCX, CSV, XLSX, or TXT files"
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx,.csv,.xlsx,.txt"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                    <span>{isLoading ? "Processing..." : "Attach"}</span>
                  </label>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-white hover:bg-white text-black w-7 h-7 p-0 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile controls below textarea */}
          <div className="sm:hidden">
            <div className="space-y-3">
              {/* Top row: Format and File upload */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-white text-xs font-medium">
                    Format:
                  </span>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-24 h-8 bg-slate-600 border-slate-500 text-white text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem
                        value="Normal"
                        className="text-white hover:bg-slate-700 text-xs"
                      >
                        Normal
                      </SelectItem>
                      <SelectItem
                        value="JSON"
                        className="text-white hover:bg-slate-700 text-xs"
                      >
                        JSON
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label
                  htmlFor="file-upload-mobile"
                  className="cursor-pointer p-2 text-slate-400 hover:text-blue-400 flex items-center gap-2 text-xs bg-slate-700/50 rounded-lg flex-1 justify-center disabled:opacity-50"
                  title="Upload PDF, DOCX, CSV, XLSX, or TXT files"
                >
                  <input
                    type="file"
                    accept=".pdf,.docx,.csv,.xlsx,.txt"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-mobile"
                  />
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                  <span>{isLoading ? "Processing..." : "Attach Template"}</span>
                </label>
              </div>

              {/* Bottom row: Submit button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-white text-black px-6 py-2 rounded-lg flex items-center gap-2 w-full max-w-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar for file uploads */}
          {uploadProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Processing files...</span>
                <span>
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      uploadProgress.total > 0
                        ? `${(uploadProgress.current / uploadProgress.total) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          )}

          <div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((item, index) => (
                  <div
                    key={index}
                    className="p-2 sm:p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-medium truncate">
                            {item.file.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                            {item.text
                              ? `${item.text.length} chars extracted`
                              : "Text extraction failed"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFile(index)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-400 hover:bg-slate-600/50 flex-shrink-0 p-1 rounded ml-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.usage}
                      onChange={(e) => updateUsage(index, e.target.value)}
                      placeholder="How to use this template..."
                      className="min-h-[50px] bg-slate-600/50 border-slate-500/50 text-white placeholder:text-slate-400 resize-none rounded text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streaming response display */}
          {streamingContent && (
            <div className="space-y-2">
              <label className="text-white text-xs font-medium block">
                Generated Prompt {isStreaming ? "(Streaming)" : ""}
              </label>
              <CodeBlock>{streamingContent}</CodeBlock>
            </div>
          )}
        </div>

        {/* Sticky Save Prompt Section */}
        {streamingContent && !isStreaming && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-600 p-4 z-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-white text-xs font-medium mb-1 block">
                    Prompt Name
                  </label>
                  <input
                    type="text"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Enter a name for your prompt..."
                    className="w-full bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={handleSavePrompt}
                  disabled={isSaving || !promptName.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 mt-5 rounded-lg flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>💾</span>
                  )}
                  {isSaving ? "Saving..." : "Save Prompt"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
