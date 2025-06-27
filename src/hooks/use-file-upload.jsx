import { useState, useEffect, useCallback, useRef } from "react";
import { useFilesUploadMetadata } from "../context/FilesUploadMetadata";
import { useToast } from "./use-toast";
import { vectorizeOneFile } from "../services/n8n-apis/_core/vectorizeOneFile.api";
import { useParams } from "react-router-dom";
import { acceptedFiles } from "@/lib/config";

/**
 * Custom hook for handling file upload via drag and drop
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether drag and drop is enabled
 * @param {Array} options.acceptedTypes - Array of accepted file types (e.g., ['.pdf', '.txt', '.docx'])
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 50MB)
 * @param {number} options.maxFiles - Maximum number of files allowed (default: 10)
 * @param {Function} options.onFilesAdded - Callback when files are successfully added
 * @param {string} options.excludeSelector - CSS selector for elements to exclude from drop zone
 */
export function useFileUpload({
  enabled = true,
  acceptedTypes = acceptedFiles,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  onFilesAdded = () => {},
  excludeSelector = "[data-sidebar]",
} = {}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(new Set());
  const dragCounter = useRef(0);
  const { toast } = useToast();
  const { id } = useParams();

  const {
    files,
    setFiles,
    fileCount,
    setFileCount,
    fileName,
    setFileName,
    memorizedFiles,
    setMemorizedFiles,
  } = useFilesUploadMetadata();

  /**
   * Validates if a file is acceptable based on type and size
   */
  const validateFile = useCallback(
    (file) => {
      const errors = [];

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(
          `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        );
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const isAcceptedType = acceptedTypes.some(
        (type) =>
          type.toLowerCase() === fileExtension ||
          file.type.includes(type.replace(".", "")),
      );

      if (!isAcceptedType) {
        errors.push(
          `File type "${fileExtension}" is not supported. Supported types: ${acceptedTypes.join(", ")}`,
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [acceptedTypes, maxFileSize],
  );

  /**
   * Vectorizes a file using the existing vectorization API
   */
  const vectorizeFile = useCallback(
    async (file) => {
      if (!id) {
        console.warn("No session ID available for vectorization");
        return { success: false, message: "No session ID available" };
      }

      try {
        const result = await vectorizeOneFile(file, id);
        return result;
      } catch (error) {
        console.error("Error vectorizing file:", error);
        return { success: false, message: error.message };
      }
    },
    [id],
  );

  /**
   * Processes and adds files to the context, then vectorizes them
   */
  const processFiles = useCallback(
    async (fileList) => {
      const newFiles = Array.from(fileList);
      const validFiles = [];
      const errors = [];

      console.log("Processing files:", newFiles);

      // Check if adding these files would exceed the limit
      if (fileCount + newFiles.length > maxFiles) {
        toast({
          title: "Too Many Files",
          description: `Cannot add ${newFiles.length} files. Maximum ${maxFiles} files allowed. Currently have ${fileCount} files.`,
          variant: "destructive",
        });
        return;
      }

      // Validate each file
      newFiles.forEach((file) => {
        const validation = validateFile(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          errors.push(...validation.errors);
        }
      });

      // Show errors if any
      if (errors.length > 0) {
        toast({
          title: "File Upload Errors",
          description: errors.join(". "),
          variant: "destructive",
        });
      }

      // Add valid files
      if (validFiles.length > 0) {
        const processedFiles = validFiles.map((file) => ({
          name: file.name,
          type: file.type || `application/${file.name.split(".").pop()}`,
          size: file.size,
          file: file, // Keep reference to actual file object
        }));

        setFiles((prevFiles) => [...processedFiles, ...prevFiles]);
        setFileCount((prevCount) => prevCount + processedFiles.length);
        setFileName((prevNames) => [
          ...processedFiles.map((f) => f.name),
          ...prevNames,
        ]);

        // Start vectorization process
        setIsVectorizing(true);
        const vectorizationResults = [];

        for (const file of validFiles) {
          try {
            // Mark file as processing
            setProcessingFiles((prev) => new Set([...prev, file.name]));

            const result = await vectorizeFile(file);
            vectorizationResults.push(result);

            if (result.success) {
              setMemorizedFiles((prevMemo) => [
                ...prevMemo,
                result.data?.vectorizedDocumentName || file.name,
              ]);
            } else {
              console.error(
                `Failed to vectorize ${file.name}:`,
                result.message,
              );
              toast({
                title: "Vectorization Error",
                description: `Failed to process ${file.name}: ${result.message}`,
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            toast({
              title: "Processing Error",
              description: `Error processing ${file.name}: ${error.message}`,
              variant: "destructive",
            });
          } finally {
            // Remove file from processing set
            setProcessingFiles((prev) => {
              const newSet = new Set(prev);
              newSet.delete(file.name);
              return newSet;
            });
          }
        }

        setIsVectorizing(false);
        console.log("Vectorization results:", vectorizationResults);

        // Call success callback
        onFilesAdded(processedFiles);

        const successCount = vectorizationResults.filter(
          (r) => r.success,
        ).length;
        toast({
          title: "Files Processed",
          description: `Successfully processed ${successCount} out of ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`,
          variant:
            successCount === validFiles.length ? "success" : "destructive",
        });
      }
    },
    [
      maxFiles,
      fileCount,
      validateFile,
      setFiles,
      setFileCount,
      setFileName,
      setMemorizedFiles,
      vectorizeFile,
      onFilesAdded,
      toast,
    ],
  );

  /**
   * Checks if the target element should be excluded from drop handling
   */
  const isExcludedElement = useCallback(
    (element) => {
      if (!excludeSelector) return false;
      return element.closest(excludeSelector) !== null;
    },
    [excludeSelector],
  );

  /**
   * Handle drag enter event
   */
  const handleDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!enabled || isExcludedElement(e.target)) return;

      dragCounter.current++;

      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragActive(true);
        setDragDepth(dragCounter.current);
      }
    },
    [enabled, isExcludedElement],
  );

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!enabled || isExcludedElement(e.target)) return;

      dragCounter.current--;

      if (dragCounter.current === 0) {
        setIsDragActive(false);
        setDragDepth(0);
      }
    },
    [enabled, isExcludedElement],
  );

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!enabled || isExcludedElement(e.target)) return;

      // Set the dropEffect to indicate this is a copy operation
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [enabled, isExcludedElement],
  );

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!enabled || isExcludedElement(e.target)) return;

      setIsDragActive(false);
      setDragDepth(0);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [enabled, isExcludedElement, processFiles],
  );

  /**
   * Set up and clean up event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    const handleWindowDragEnter = (e) => handleDragEnter(e);
    const handleWindowDragLeave = (e) => handleDragLeave(e);
    const handleWindowDragOver = (e) => handleDragOver(e);
    const handleWindowDrop = (e) => handleDrop(e);

    // Prevent default drag behaviors on window
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    // Prevent default drag behaviors
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, [enabled, handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  /**
   * Reset drag state when component unmounts or enabled changes
   */
  useEffect(() => {
    if (!enabled) {
      setIsDragActive(false);
      setDragDepth(0);
      dragCounter.current = 0;
    }
  }, [enabled]);

  /**
   * Manual file selection (for programmatic use)
   */
  const selectFiles = useCallback(
    (fileList) => {
      if (enabled) {
        processFiles(fileList);
      }
    },
    [enabled, processFiles],
  );

  /**
   * Remove a file from the upload list
   */
  const removeFile = useCallback(
    (fileName) => {
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName),
      );
      setFileCount((prevCount) => Math.max(0, prevCount - 1));
      setFileName((prevNames) => prevNames.filter((name) => name !== fileName));
      setMemorizedFiles((prevMemo) =>
        prevMemo.filter((name) => name !== fileName),
      );
    },
    [setFiles, setFileCount, setFileName, setMemorizedFiles],
  );

  return {
    isDragActive,
    dragDepth,
    isVectorizing,
    processingFiles,
    files,
    fileCount,
    selectFiles,
    removeFile,
    isEnabled: enabled,
  };
}
