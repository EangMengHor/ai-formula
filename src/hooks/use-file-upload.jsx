import { useState, useEffect, useCallback, useRef } from "react";
import { useFilesUploadMetadata } from "../context/FilesUploadMetadata";
import { useToast } from "./use-toast";

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
  acceptedTypes = ['.pdf', '.txt', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.md', '.csv'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  onFilesAdded = () => {},
  excludeSelector = '[data-sidebar]'
} = {}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);
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
    setMemorizedFiles
  } = useFilesUploadMetadata();

  /**
   * Validates if a file is acceptable based on type and size
   */
  const validateFile = useCallback((file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Check file type
    if (!acceptedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`
      };
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`
      };
    }
    
    return { isValid: true };
  }, [acceptedTypes, maxFileSize]);

  /**
   * Processes and adds files to the context
   */
  const processFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    // Check total file limit
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed. You currently have ${files.length} files.`,
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    newFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.isValid) {
        // Check for duplicates
        const isDuplicate = files.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (!isDuplicate) {
          validFiles.push(file);
        } else {
          errors.push(`File "${file.name}" is already uploaded`);
        }
      } else {
        errors.push(validation.error);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: "File Upload Errors",
        description: errors.join('. '),
        variant: "destructive",
      });
    }

    // Add valid files
    if (validFiles.length > 0) {
      const processedFiles = validFiles.map(file => ({
        name: file.name,
        type: file.type || `application/${file.name.split('.').pop()}`,
        size: file.size,
        file: file // Keep reference to actual file object
      }));

      setFiles(prevFiles => [...prevFiles, ...processedFiles]);
      setFileCount(prevCount => prevCount + processedFiles.length);
      setFileName(prevNames => [...prevNames, ...processedFiles.map(f => f.name)]);
      
      // Call success callback
      onFilesAdded(processedFiles);
      
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`,
        variant: "default",
      });
    }
  }, [files, maxFiles, validateFile, setFiles, setFileCount, setFileName, onFilesAdded, toast]);

  /**
   * Checks if the target element should be excluded from drop handling
   */
  const isExcludedElement = useCallback((element) => {
    if (!excludeSelector) return false;
    return element.closest(excludeSelector) !== null;
  }, [excludeSelector]);

  /**
   * Handle drag enter event
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled || isExcludedElement(e.target)) return;
    
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
      setDragDepth(dragCounter.current);
    }
  }, [enabled, isExcludedElement]);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled || isExcludedElement(e.target)) return;
    
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragActive(false);
      setDragDepth(0);
    }
  }, [enabled, isExcludedElement]);

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled || isExcludedElement(e.target)) return;
    
    // Set the dropEffect to indicate this is a copy operation
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [enabled, isExcludedElement]);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled || isExcludedElement(e.target)) return;
    
    setIsDragActive(false);
    setDragDepth(0);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [enabled, isExcludedElement, processFiles]);

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

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    
    // Prevent default drag behaviors
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
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
  const selectFiles = useCallback((fileList) => {
    if (enabled) {
      processFiles(fileList);
    }
  }, [enabled, processFiles]);

  /**
   * Remove a file from the upload list
   */
  const removeFile = useCallback((fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setFileCount(prevCount => Math.max(0, prevCount - 1));
    setFileName(prevNames => prevNames.filter(name => name !== fileName));
    setMemorizedFiles(prevMemo => prevMemo.filter(name => name !== fileName));
  }, [setFiles, setFileCount, setFileName, setMemorizedFiles]);

  return {
    isDragActive,
    dragDepth,
    files,
    fileCount,
    selectFiles,
    removeFile,
    isEnabled: enabled
  };
}
