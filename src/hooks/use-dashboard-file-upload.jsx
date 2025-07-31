import { useState, useEffect, useCallback, useRef } from "react";
import { useFilesUploadMetadata } from "../context/FilesUploadMetadata";
import { useToast } from "./use-toast";
import { vectorizeOneFile } from "../services/n8n-apis/_core/vectorizeOneFile.api";
import { acceptedFiles } from "@/lib/config";

/**
 * Custom hook for handling file upload via drag and drop in Dashboard
 * This version generates a client-side sessionId and defers vectorization until session is created
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether drag and drop is enabled
 * @param {Array} options.acceptedTypes - Array of accepted file types
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 50MB)
 * @param {number} options.maxFiles - Maximum number of files allowed (default: 10)
 * @param {Function} options.onFilesAdded - Callback when files are successfully added
 * @param {string} options.excludeSelector - CSS selector for elements to exclude from drop zone
 */
export function useDashboardFileUpload({
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
  const [clientSessionId, setClientSessionId] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]); // Files waiting to be vectorized
  const dragCounter = useRef(0);
  const { toast } = useToast();

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
   * Generate a client-side session ID
   */
  const generateClientSessionId = useCallback(() => {
    const sessionId = crypto.randomUUID();
    setClientSessionId(sessionId);
    return sessionId;
  }, []);

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
  const vectorizeFile = useCallback(async (file, sessionId) => {
    if (!sessionId) {
      console.warn("No session ID available for vectorization");
      return { success: false, message: "No session ID available" };
    }

    try {
      const result = await vectorizeOneFile(file, sessionId);
      return result;
    } catch (error) {
      console.error("Error vectorizing file:", error);
      return { success: false, message: error.message };
    }
  }, []);

  /**
   * Processes files and adds them to context, but doesn't vectorize yet
   */
  const processFiles = useCallback(
    async (fileList) => {
      const newFiles = Array.from(fileList);
      const validFiles = [];
      const errors = [];

      console.log("Processing files for dashboard:", newFiles);

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

      // Add valid files to context and pending list
      if (validFiles.length > 0) {
        // Generate session ID if not already generated
        const sessionId = clientSessionId || generateClientSessionId();

        const processedFiles = validFiles.map((file) => ({
          name: file.name,
          type: file.type || `application/${file.name.split(".").pop()}`,
          size: file.size,
          file: file, // Keep reference to actual file object
          sessionId: sessionId, // Store the session ID with the file
        }));

        setFiles((prevFiles) => [...processedFiles, ...prevFiles]);
        setFileCount((prevCount) => prevCount + processedFiles.length);
        setFileName((prevNames) => [
          ...processedFiles.map((f) => f.name),
          ...prevNames,
        ]);

        // Add to pending files for later vectorization
        setPendingFiles((prevPending) => [...prevPending, ...processedFiles]);

        // Call success callback
        onFilesAdded(processedFiles);

        toast({
          title: "Files Added",
          description: `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} added. They will be processed when you start your conversation.`,
          variant: "success",
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
      onFilesAdded,
      toast,
      clientSessionId,
      generateClientSessionId,
    ],
  );

  /**
   * Vectorizes all pending files once a session is created
   */
  const vectorizePendingFiles = useCallback(
    async (sessionId) => {
      if (pendingFiles.length === 0) return;

      setIsVectorizing(true);
      const vectorizationResults = [];

      console.log("Vectorizing pending files for session:", sessionId);

      for (const fileData of pendingFiles) {
        try {
          // Mark file as processing
          setProcessingFiles((prev) => new Set([...prev, fileData.name]));

          const result = await vectorizeFile(fileData.file, sessionId);
          vectorizationResults.push(result);

          if (result.success) {
            setMemorizedFiles((prevMemo) => [
              ...prevMemo,
              result.data?.vectorizedDocumentName || fileData.name,
            ]);
          } else {
            console.error(
              `Failed to vectorize ${fileData.name}:`,
              result.message,
            );
            toast({
              title: "Vectorization Error",
              description: `Failed to process ${fileData.name}: ${result.message}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error processing ${fileData.name}:`, error);
          toast({
            title: "Processing Error",
            description: `Error processing ${fileData.name}: ${error.message}`,
            variant: "destructive",
          });
        } finally {
          // Remove file from processing set
          setProcessingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileData.name);
            return newSet;
          });
        }
      }

      setIsVectorizing(false);

      // Clear pending files after vectorization
      setPendingFiles([]);

      const successCount = vectorizationResults.filter((r) => r.success).length;
      toast({
        title: "Files Processed",
        description: `Successfully processed ${successCount} out of ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`,
        variant:
          successCount === pendingFiles.length ? "success" : "destructive",
      });

      console.log("Vectorization results:", vectorizationResults);
    },
    [pendingFiles, vectorizeFile, setMemorizedFiles, toast],
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
      setPendingFiles((prevPending) =>
        prevPending.filter((file) => file.name !== fileName),
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
    clientSessionId,
    pendingFiles,
    selectFiles,
    removeFile,
    vectorizePendingFiles,
    generateClientSessionId,
    isEnabled: enabled,
  };
}
