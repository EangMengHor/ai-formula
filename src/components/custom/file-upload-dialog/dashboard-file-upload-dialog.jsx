"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Paperclip, LoaderCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { acceptedFiles } from "@/lib/config";

export default function DashboardFileUploadDialog({ onFilesSelected }) {
  // global states
  const { pathname } = useLocation();
  const { toast } = useToast();

  // component states
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (fileList) => {
    const validFiles = [];
    const errors = [];

    fileList.forEach((file) => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        errors.push(
          `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB`,
        );
        return;
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const isAcceptedType = acceptedFiles.some(
        (type) =>
          type.toLowerCase() === fileExtension ||
          file.type.includes(type.replace(".", "")),
      );

      if (!isAcceptedType) {
        errors.push(
          `File type "${fileExtension}" is not supported. Supported types: ${acceptedFiles.join(", ")}`,
        );
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: "File Upload Errors",
        description: errors.join(". "),
        variant: "destructive",
      });
    }

    // Process valid files
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setIsProcessing(true);

      // Call the callback to handle the files
      if (onFilesSelected) {
        onFilesSelected(validFiles);
      }

      // Show success message
      toast({
        title: "Files Added",
        description: `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} added. They will be processed when you start your conversation.`,
        variant: "success",
      });

      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSelectedFiles([]);
        setIsProcessing(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1500);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (pathname.includes("/dashboard")) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 cursor-pointer hover:bg-white/30 transition-all duration-200"
            onClick={() => setIsOpen(true)}
          >
            <Paperclip className="w-5 h-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          </div>

          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Upload Files</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-slate-600 hover:border-slate-500"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-2">
                  Drop files here or click to select
                </p>
                <p className="text-sm text-slate-500">
                  Supported: PDF, TXT, DOCX, XLSX, PPTX, MD, CSV (Max 50MB each)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedFiles.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-white">
                    Selected Files:
                  </h4>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      {isProcessing ? (
                        <LoaderCircle className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
