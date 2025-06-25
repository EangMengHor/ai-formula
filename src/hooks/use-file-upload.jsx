import { useState, useCallback, useEffect, useRef } from "react";
import { useFilesUploadMetadata } from "../context/FilesUploadMetadata";
import { useToast } from "./use-toast";
import { useParams } from "react-router-dom";
import { vectorizeOneFile } from "../services/n8n-apis/_core/vectorizeOneFile.api";

export const useFileUpload = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const {
    files,
    setFiles,
    memorizedFiles,
    setMemorizedFiles,
    setIsMemorizationLoading,
    fileName,
    setFileName,
  } = useFilesUploadMetadata();

  // Local state for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentlyAddedFiles, setRecentlyAddedFiles] = useState([]);
  
  // Memorization queue management
  const [memorizationStatuses, setMemorizationStatuses] = useState({});
  const [memorizationQueue, setMemorizationQueue] = useState([]);
  const [fileQueueError, setFileQueueError] = useState([]);
  
  // Refs for process control
  const isMemorizing = useRef(false);
  const isMemorizingProcessRunning = useRef(false);
  const dragCounterRef = useRef(0);

  // Accepted file types
  const acceptedTypes = [
    "application/pdf",
    "text/plain",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
  ];

  // Validate file type
  const validateFileType = useCallback((file) => {
    return acceptedTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.pdf') ||
           file.name.toLowerCase().endsWith('.txt') ||
           file.name.toLowerCase().endsWith('.json') ||
           file.name.toLowerCase().endsWith('.docx') ||
           file.name.toLowerCase().endsWith('.doc');
  }, []);

  // Filter unique files
  const filterUniqueFiles = useCallback((newFiles) => {
    return newFiles.filter((newFile) => {
      // Check file type
      if (!validateFileType(newFile)) {
        toast({
          title: "Invalid File Type",
          description: `${newFile.name} is not supported. Please upload PDF, TXT, JSON, or DOCX files.`,
          variant: "destructive",
        });
        return false;
      }

      // Check for duplicates
      const isDuplicate = files.some(
        (file) => file.name === newFile.name && file.size === newFile.size
      );
      
      if (isDuplicate) {
        toast({
          title: "Duplicate File",
          description: `${newFile.name} is already uploaded.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });
  }, [files, validateFileType, toast]);

  // Add files to the context
  const addFiles = useCallback((newFiles) => {
    const uniqueFiles = filterUniqueFiles(Array.from(newFiles));
    
    if (uniqueFiles.length > 0) {
      setFiles((prev) => [...prev, ...uniqueFiles]);
      setRecentlyAddedFiles(uniqueFiles);
      toast({
        title: "Files Added",
        description: `${uniqueFiles.length} file(s) added successfully.`,
      });
      
      // Clear recently added files after a short delay
      setTimeout(() => {
        setRecentlyAddedFiles([]);
      }, 4000);
    }
  }, [filterUniqueFiles, setFiles, toast]);



  // Drag event handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    setDragCounter(dragCounterRef.current);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    setDragCounter(dragCounterRef.current);
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    dragCounterRef.current = 0;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length > 0) {
      setIsProcessing(true);
      addFiles(droppedFiles);
      setIsProcessing(false);
    }
  }, [addFiles]);

  // Paste event handler
  const handlePaste = useCallback(async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const fileItems = items.filter(item => item.kind === 'file');
    
    if (fileItems.length > 0) {
      e.preventDefault();
      setIsProcessing(true);
      
      const pastedFiles = fileItems.map(item => item.getAsFile()).filter(Boolean);
      addFiles(pastedFiles);
      setIsProcessing(false);
    }
  }, [addFiles]);

  // Initialize memorization queue
  useEffect(() => {
    const newQueue = files
      .map((file) => file.name)
      .filter((fileName) => !memorizedFiles.includes(fileName));

    setMemorizationQueue((prev) => {
      const existingQueueNames = new Set(prev);
      const filesToAdd = newQueue.filter(
        (name) => !existingQueueNames.has(name)
      );
      return [...prev, ...filesToAdd];
    });

    const initialStatuses = files.reduce((acc, file) => {
      if (memorizedFiles.includes(file.name)) {
        acc[file.name] = "memorized";
      } else if (memorizationQueue.includes(file.name)) {
        acc[file.name] = "queued";
      } else {
        acc[file.name] = "queued";
      }
      return acc;
    }, {});
    setMemorizationStatuses(initialStatuses);
  }, [files, memorizedFiles, memorizationQueue]);

  // Memorization process
  useEffect(() => {
    if (memorizationQueue.length === 0) {
      isMemorizing.current = false;
      return;
    }

    const memorizeNext = async () => {
      if (isMemorizingProcessRunning.current) {
        return;
      }

      isMemorizingProcessRunning.current = true;
      isMemorizing.current = true;

      const fileNameToMemorize = memorizationQueue[0];
      setMemorizationStatuses((prev) => ({
        ...prev,
        [fileNameToMemorize]: "memorizing",
      }));

      try {
        const file = files.find((file) => file.name === fileNameToMemorize);
        const res = await vectorizeOneFile(file, id);

        if (res && res.data && !res.data.success) {
          setMemorizationStatuses((prev) => ({
            ...prev,
            [fileNameToMemorize]: "error",
          }));
          setFileQueueError((prev) => [
            ...prev,
            {
              index: files.findIndex((f) => f.name === fileNameToMemorize),
              message: res.data.message || "Error Occurred",
            },
          ]);
          setFileName((prev) => [...prev, file.name]);
        } else if (res.success) {
          setMemorizationStatuses((prev) => ({
            ...prev,
            [fileNameToMemorize]: "memorized",
          }));
          setMemorizedFiles((prevMemorizedFiles) => [
            ...prevMemorizedFiles,
            res.data.vectorizedDocumentName,
          ]);
          toast({
            title: "File Memorized",
            description: `${file.name} has been successfully processed.`,
          });
        } else {
          setMemorizationStatuses((prev) => ({
            ...prev,
            [fileNameToMemorize]: "error",
          }));
          setFileQueueError((prev) => [
            ...prev,
            {
              index: files.findIndex((f) => f.name === fileNameToMemorize),
              message: res.message || "Error Occurred",
            },
          ]);
        }
      } catch (error) {
        setMemorizationStatuses((prev) => ({
          ...prev,
          [fileNameToMemorize]: "error",
        }));
        setFileQueueError((prev) => [
          ...prev,
          {
            index: files.findIndex((f) => f.name === fileNameToMemorize),
            message: error.message || "Error Occurred",
          },
        ]);
      } finally {
        setMemorizationQueue((prev) => prev.slice(1));
        isMemorizing.current = false;
        isMemorizingProcessRunning.current = false;
      }
    };

    memorizeNext();
  }, [memorizationQueue, id, files, setMemorizedFiles, setFileName, toast]);

  // Update loading state
  useEffect(() => {
    setIsMemorizationLoading(memorizationQueue.length > 0 || isProcessing);
  }, [memorizationQueue, isProcessing, setIsMemorizationLoading]);

  // Remove file function
  const removeFile = useCallback((fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    setMemorizedFiles(prev => prev.filter(file => file !== fileToRemove.name));
    setFileQueueError(prev => prev.filter(error => files[error.index] !== fileToRemove));
    
    setMemorizationQueue(prev => prev.filter(name => name !== fileToRemove.name));
    setMemorizationStatuses(prev => {
      const { [fileToRemove.name]: removedStatus, ...rest } = prev;
      return rest;
    });
  }, [setFiles, setMemorizedFiles, files]);

  return {
    // State
    isDragging,
    isProcessing,
    memorizationStatuses,
    fileQueueError,
    
    // Event handlers
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    
    // Utility functions
    addFiles,
    removeFile,
    validateFileType,
    
    // Data
    files,
    memorizedFiles,
    memorizationQueue: memorizationQueue.length,
    recentlyAddedFiles,
    
    // Helper function to clear recent files
    clearRecentlyAddedFiles: () => setRecentlyAddedFiles([]),
  };
};
