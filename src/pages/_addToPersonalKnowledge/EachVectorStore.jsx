import FileDnD from "@/components/custom/FileDnd";
import { useToast } from "@/hooks/use-toast";
import { getFavicon } from "@/lib/utils";
import { getVectorStoreCompleteData } from "@/services/personal-knowledge/getVectorStoreCompleteData";
import { formatDistance } from "date-fns";
import {
  Database,
  File,
  Loader2,
  Search,
  Filter,
  X,
  ChevronDown,
  AlertCircle,
  FileText,
  FileImage,
  FileType,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileIcon,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Progress } from "@/components/ui/progress";
import { generatePresignedUrl } from "@/services/user-setting-apis/generatePresignedUrl";
import { uploadToSignedUrl } from "@/services/user-setting-apis/uploadToSignedUrl";

// Create a constant for allowed file types and their corresponding icons
const ALLOWED_FILE_TYPES = {
  "application/pdf": { extension: "pdf", icon: File },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: "docx",
    icon: FileText,
  },
  "text/plain": { extension: "txt", icon: FileType },
  "image/jpeg": { extension: "jpg", icon: FileImage },
  "image/png": { extension: "png", icon: FileImage },
  "image/gif": { extension: "gif", icon: FileImage },
};

// Constants
const CONCURRENT_UPLOADS = 5;
const BUCKET_NAME = "arx-society-file-queue";

function ShowStatus({ status = "unknown" }) {
  const baseClass =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

  const statusMap = {
    completed: (
      <span className={`${baseClass} bg-green-100 text-green-700`}>
        Completed
      </span>
    ),
    queued: (
      <span className={`${baseClass} bg-blue-100 text-blue-700`}>Queued</span>
    ),
    processing: (
      <span
        className={`${baseClass} bg-yellow-100 text-yellow-700 animate-pulse`}
      >
        Processing...
      </span>
    ),
    timeout: (
      <span className={`${baseClass} bg-red-100 text-red-700`}>Timeout</span>
    ),
    pending: (
      <span className={`${baseClass} bg-purple-100 text-gray-700`}>Queued</span>
    ),
  };

  return (
    statusMap[status] || (
      <span className={`${baseClass} bg-gray-100 text-gray-700`}>
        Unknown Status
      </span>
    )
  );

  awsz2Ṣ;
}

export default function EachVectorStore() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useUser();
  const [vectorStoreData, setVectorStoreData] = useState(null);
  const [isInfoDataLoading, setIsInfoDataLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // File upload state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const abortControllersRef = useRef({});

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: "all", // "all", "file", "citation"
    status: "all", // "all", "completed", "queued", "processing", "timeout"
  });

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  function fileHandler(droppedFiles) {
    // Validate file types
    const validFiles = Array.from(droppedFiles).filter((file) => {
      if (ALLOWED_FILE_TYPES[file.type]) {
        return true;
      } else {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an allowed file type. Only PDF, DOCX, TXT, and images are allowed.`,
          variant: "destructive",
        });
        return false;
      }
    });

    if (validFiles.length === 0) {
      return;
    }

    if (validFiles.length >= 30) {
      toast({
        title: "Large batch of files",
        description: `Processing ${validFiles.length} files (more than 30) may take time. Please remain on the page.`,
      });
    }

    // Add files to queue with initial status
    const newFiles = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: formatFileSize(file.size),
      status: "pending", // pending, uploading, success, error
      progress: 0,
      errorMessage: null,
      uploadStartTime: null,
      uploadEndTime: null,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Start upload process if not already uploading
    if (!uploading) {
      uploadFiles(newFiles);
    }
  }

  // Upload files with concurrency control
  const uploadFiles = async (filesToUpload = files) => {
    if (uploading) return;

    const pendingFiles = filesToUpload.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setUploading(true);
    let active = 0;
    let completed = 0;
    let totalFiles = pendingFiles.length;

    // Create a queue processor using async/await
    const processQueue = async () => {
      // Process files while we have pending ones
      while (pendingFiles.length > 0 && active < CONCURRENT_UPLOADS) {
        const fileObj = pendingFiles.shift();
        active++;
        setActiveUploads((prev) => prev + 1);

        // Start upload (don't await here to allow concurrency)
        uploadFile(fileObj)
          .then(() => {
            active--;
            setActiveUploads((prev) => Math.max(0, prev - 1));
            completed++;

            // Update overall progress
            const progress = Math.round((completed / totalFiles) * 100);
            setOverallProgress(progress);

            // Process next file if any
            if (pendingFiles.length > 0) {
              processQueue();
            } else if (active === 0) {
              // All uploads completed
              setUploading(false);
              refreshVectorStoreData();

              toast({
                title: "Uploads completed",
                description: `Successfully processed ${completed} files`,
                variant: "default",
              });
            }
          })
          .catch((err) => {
            console.error("Error in upload queue:", err);
            active--;
            setActiveUploads((prev) => Math.max(0, prev - 1));
            completed++;

            // Update overall progress even for failures
            const progress = Math.round((completed / totalFiles) * 100);
            setOverallProgress(progress);

            // Continue processing
            if (pendingFiles.length > 0) {
              processQueue();
            } else if (active === 0) {
              setUploading(false);
            }
          });
      }
    };

    // Start initial batch of uploads (up to CONCURRENT_UPLOADS)
    await processQueue();
  };

  // Upload a single file with presigned URL and proper monitoring
  const uploadFile = async (fileObj) => {
    // Update file status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileObj.id
          ? {
              ...f,
              status: "uploading",
              progress: 5,
              uploadStartTime: new Date(),
            }
          : f,
      ),
    );

    // Create an abort controller for this upload
    const abortController = new AbortController();
    abortControllersRef.current[fileObj.id] = abortController;

    try {
      // Step 1: Get presigned URL
      const presignedUrlResult = await generatePresignedUrl({
        userId: user.id,
        fileName: fileObj.file.name,
        bucketName: BUCKET_NAME,
      });

      if (!presignedUrlResult.success) {
        throw new Error(
          presignedUrlResult.message || "Failed to generate upload URL",
        );
      }

      // Update progress to show URL was generated
      setFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 20 } : f)),
      );

      // Step 2: Upload to signed URL with progress monitoring
      const uploadProgressHandler = (progress) => {
        // Scale progress from 20-80% range (the rest is for pre/post processing)
        const scaledProgress = 20 + Math.round(progress * 0.6);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, progress: scaledProgress } : f,
          ),
        );
      };

      const uploadResult = await uploadToSignedUrl({
        file: fileObj.file,
        signedUrl: presignedUrlResult.data.signedUrl,
        token: presignedUrlResult.data.token,
        contentType: fileObj.file.type,
        userId: user.id,
        filePath: presignedUrlResult.data.fileName,
        bucketName: BUCKET_NAME,
        collectionId: id,
        onProgress: uploadProgressHandler,
        signal: abortController.signal,
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Upload failed");
      }

      // Update state for successful upload
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                status: "success",
                progress: 100,
                uploadEndTime: new Date(),
                url: uploadResult.data?.url,
              }
            : f,
        ),
      );

      // Clean up controller reference
      delete abortControllersRef.current[fileObj.id];

      return uploadResult;
    } catch (error) {
      console.error(`Error uploading file ${fileObj.name}:`, error);

      // Only update as failed if not aborted by user
      if (!abortController.signal.aborted) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  errorMessage: error.message || "Upload failed",
                  uploadEndTime: new Date(),
                }
              : f,
          ),
        );

        toast({
          title: "Upload failed",
          description: `Failed to upload ${fileObj.name}: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }

      // Clean up controller reference
      delete abortControllersRef.current[fileObj.id];

      throw error; // Re-throw to be handled by queue
    }
  };

  // Cancel all pending uploads
  const cancelAllUploads = () => {
    Object.values(abortControllersRef.current).forEach((controller) => {
      controller.abort();
    });

    setFiles((prev) =>
      prev.map((item) =>
        item.status === "pending" || item.status === "uploading"
          ? {
              ...item,
              status: "cancelled",
              errorMessage: "Upload cancelled by user",
            }
          : item,
      ),
    );

    setUploading(false);
    setActiveUploads(0);

    toast({
      title: "Uploads cancelled",
      description: "All pending uploads have been cancelled.",
      variant: "default",
    });
  };

  // Remove file from list
  const removeFile = (id) => {
    // If file is uploading, abort it
    if (abortControllersRef.current[id]) {
      abortControllersRef.current[id].abort();
      delete abortControllersRef.current[id];
    }

    // Remove from list
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // Clear completed files
  const clearCompletedFiles = () => {
    setFiles((prev) =>
      prev.filter(
        (file) => file.status !== "success" && file.status !== "cancelled",
      ),
    );
  };

  // Refresh vector store data
  const refreshVectorStoreData = async () => {
    await getVectorStoreData();
  };

  // Function to get vector store data
  const getVectorStoreData = async () => {
    setIsInfoDataLoading(true);
    try {
      const collectionid = Number(id);

      const data = await getVectorStoreCompleteData(collectionid);

      console.log("Vector Store Data:", data);

      if (data.success) {
        setVectorStoreData(data.data);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching vector store data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vector store data.",
        variant: "destructive",
      });
      setIsError(true);
      setErrorMessage(error.message);
    } finally {
      setIsInfoDataLoading(false);
    }
  };

  useEffect(() => {
    getVectorStoreData();
  }, [id]);

  useEffect(() => {
    console.log(
      getFavicon(["https://www.koyfin.com/blog/best-stock-charting-software/"]),
    );
    if (vectorStoreData) {
      console.log("Vector Store Data:", vectorStoreData);
    }
  }, [vectorStoreData]);

  // Retry failed upload
  const retryUpload = (fileObj) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileObj.id
          ? { ...f, status: "pending", progress: 0, errorMessage: null }
          : f,
      ),
    );
    uploadFiles([{ ...fileObj, status: "pending" }]);
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    const fileType = file.type || file.file?.type;
    if (fileType && ALLOWED_FILE_TYPES[fileType]) {
      const IconComponent = ALLOWED_FILE_TYPES[fileType].icon;
      return <IconComponent className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  // Render file status icon
  const renderStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter knowledge data based on search term and filters
  const filteredKnowledge = useMemo(() => {
    if (!vectorStoreData?.knowledge) return [];

    return vectorStoreData.knowledge.filter((item) => {
      // Type filter
      if (activeFilters.type !== "all" && item.type !== activeFilters.type) {
        return false;
      }

      // Status filter
      if (
        activeFilters.status !== "all" &&
        item.status !== activeFilters.status
      ) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim() === "") return true;

      const searchLower = searchTerm.toLowerCase();

      // For file type
      if (item.type === "file" && item.fileName) {
        return item.fileName.toLowerCase().includes(searchLower);
      }

      // For citation type
      if (item.type === "citation" && item.url) {
        return item.url.toLowerCase().includes(searchLower);
      }

      return false;
    });
  }, [vectorStoreData, searchTerm, activeFilters]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilters({
      type: "all",
      status: "all",
    });
  };

  if (isInfoDataLoading) {
    return (
      <div className="w-full flex items-center justify-center h-full text-white">
        <Loader2 className="animate-spin h-6 w-6 mr-2 inline-block" />
        <p>Crunching Knowledge Data . . .</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500">
        <p>Error Loading Your Vector Data: {errorMessage}</p>
      </div>
    );
  }

  const hasCompletedFiles = files.some(
    (f) =>
      f.status === "success" ||
      f.status === "cancelled" ||
      f.status === "error",
  );

  return (
    <div className="py-4">
      <div className="space-y-4 w-full">
        <div className="bg-g1 w-full p-3 rounded-md">
          <div className="font-semibold text-lg text-white flex gap-2 items-center">
            <Database />
            <p>
              {(vectorStoreData && vectorStoreData?.info?.collectionName) ||
                "Unknown Knowledge Block"}
            </p>
          </div>
          <p className="text-sm text-gray-400 py-2">
            Created{" "}
            {vectorStoreData?.info?.created_at
              ? formatDistance(
                  new Date(vectorStoreData.info.created_at),
                  new Date(),
                )
              : "Unknown date"}
            {" ago"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* File upload section */}
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-lg font-semibold">
                Add New Documents
              </h3>
              <button
                onClick={refreshVectorStoreData}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                <RefreshCcw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <FileDnD
              className="h-full bg-g1 border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors"
              width="100%"
              height="250px"
              onFileDrop={fileHandler}
            />
            <p className="text-xs text-gray-400 mt-2">
              Supported file types: PDF, DOCX, TXT, JPG, PNG, GIF
            </p>
          </div>

          {/* Upload queue and status */}
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-lg font-semibold">Upload Queue</h3>
              <div className="flex gap-2">
                {hasCompletedFiles && (
                  <button
                    onClick={clearCompletedFiles}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md"
                  >
                    Clear Completed
                  </button>
                )}
                {uploading && (
                  <button
                    onClick={cancelAllUploads}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                  >
                    Cancel All
                  </button>
                )}
              </div>
            </div>

            {/* Overall progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Overall Progress ({activeUploads} active)</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="w-full h-2" />
              </div>
            )}

            {/* Upload queue list */}
            <div className="bg-g1 rounded-md max-h-[250px] overflow-y-auto px-2">
              {files.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p>No files in queue. Drop files to upload.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {files.map((fileItem) => (
                    <li
                      key={fileItem.id}
                      className="py-3 px-2 flex items-center"
                    >
                      <div className="mr-3">{getFileIcon(fileItem)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {fileItem.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{fileItem.size}</span>
                          <span>
                            {fileItem.status === "uploading" &&
                              `${fileItem.progress}%`}
                          </span>
                        </div>
                        {fileItem.status === "uploading" && (
                          <Progress
                            value={fileItem.progress}
                            className="h-1 w-full mt-1"
                          />
                        )}
                        {fileItem.errorMessage && (
                          <p className="text-xs text-red-400 mt-1 truncate">
                            {fileItem.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="ml-3 flex items-center">
                        {renderStatusIcon(fileItem.status)}
                        <div className="ml-2 flex">
                          {fileItem.status === "error" && (
                            <button
                              onClick={() => retryUpload(fileItem)}
                              className="text-xs text-blue-400 hover:text-blue-300 mr-2"
                            >
                              Retry
                            </button>
                          )}
                          {fileItem.status !== "success" && (
                            <button
                              onClick={() => removeFile(fileItem.id)}
                              className="text-xs text-gray-400 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* existing knowledge with search */}
        <div>
          <hr className="border-b-2 border-g1" />
          <div className="flex justify-between items-center my-4">
            <p className="font-semibold text-lg text-white">
              Existing Knowledge
            </p>

            {/* Search and filter bar */}
            {vectorStoreData &&
              (vectorStoreData?.knowledge?.length || 0) > 0 && (
                <div className="flex items-center space-x-2">
                  {/* Search input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search knowledge..."
                      className="pl-10 pr-4 py-2 bg-g1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white w-64"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-white" />
                      </button>
                    )}
                  </div>

                  {/* Filter dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="flex items-center space-x-1 px-3 py-2 bg-g1 border border-gray-700 rounded-md hover:bg-gray-700"
                    >
                      <Filter className="h-4 w-4 text-gray-400" />
                      <span className="text-white text-sm">Filters</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {filterOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-g1 border border-gray-700 rounded-md shadow-lg z-10">
                        <div className="p-3">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-white mb-2">
                              Type
                            </p>
                            <div className="space-y-1">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="type"
                                  checked={activeFilters.type === "all"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      type: "all",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">All</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="type"
                                  checked={activeFilters.type === "file"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      type: "file",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Files
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="type"
                                  checked={activeFilters.type === "citation"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      type: "citation",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Citations
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-white mb-2">
                              Status
                            </p>
                            <div className="space-y-1">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={activeFilters.status === "all"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      status: "all",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">All</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={activeFilters.status === "completed"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      status: "completed",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Completed
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={
                                    activeFilters.status === "processing"
                                  }
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      status: "processing",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Processing
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={activeFilters.status === "queued"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      status: "queued",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Queued
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={activeFilters.status === "timeout"}
                                  onChange={() =>
                                    setActiveFilters({
                                      ...activeFilters,
                                      status: "timeout",
                                    })
                                  }
                                  className="mr-2"
                                />
                                <span className="text-sm text-white">
                                  Timeout
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-between pt-2 border-t border-gray-700">
                            <button
                              onClick={resetFilters}
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              Reset all
                            </button>
                            <button
                              onClick={() => setFilterOpen(false)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {vectorStoreData &&
            (vectorStoreData?.knowledge?.length || 0) <= 0 && (
              <p className="text-gray-400">
                No knowledge found in this vector store.
              </p>
            )}

          {vectorStoreData && filteredKnowledge.length === 0 && searchTerm && (
            <p className="text-gray-400 py-4">
              No results found for "{searchTerm}"
            </p>
          )}

          {vectorStoreData && filteredKnowledge.length > 0 && (
            <div className="flex flex-col gap-2">
              {filteredKnowledge.map((knowledge, index) => (
                <div key={index}>
                  {knowledge.type == "file" && (
                    <div className="bg-g1 p-3 rounded-md flex justify-between gap-2">
                      <div className="flex gap-2 items-center">
                        <File className="inline-block mr-2 h-6 w-6 text-white" />
                        <div className="text-white">
                          <p className="font-semibold">
                            {knowledge.fileName || "Unknown file"}
                          </p>
                          <p className="text-slate-400">
                            {knowledge.fileName &&
                            knowledge.fileName.length > 50
                              ? knowledge.fileName.slice(0, 50) + "..."
                              : knowledge.fileName || "No filename available"}
                          </p>
                          <p className="text-sm text-gray-400 py-2">
                            {knowledge.createdAt
                              ? formatDistance(
                                  new Date(knowledge.createdAt),
                                  new Date(),
                                )
                              : "Unknown date"}
                            {" ago"}
                          </p>
                        </div>
                      </div>
                      <p>{<ShowStatus status={knowledge.status} />}</p>
                    </div>
                  )}
                  {knowledge && knowledge.type == "citation" && (
                    <div className="bg-g1 p-3 rounded-md flex justify-between gap-2">
                      <div className="flex gap-2 items-center">
                        <img
                          src={getFavicon([knowledge.url])[0].favImage}
                          alt="favicon"
                          className="inline-block mr-2 h-6 w-6"
                        />
                        <div className=" text-white">
                          <p className="font-semibold">
                            {knowledge.url &&
                              (() => {
                                try {
                                  return new URL(knowledge.url).hostname || "-";
                                } catch {
                                  return "-";
                                }
                              })()}
                          </p>
                          <a
                            href={knowledge.url}
                            target="_blank"
                            className="text-slate-400"
                          >
                            {knowledge.url && knowledge.url.length > 50
                              ? knowledge.url.slice(0, 50) + "..."
                              : knowledge.url}
                          </a>
                          <p className="text-sm text-gray-400 py-2">
                            {knowledge.createdAt && knowledge.createdAt
                              ? formatDistance(
                                  new Date(knowledge.createdAt),
                                  new Date(),
                                )
                              : "Unknown date"}
                            {" ago"}
                          </p>
                        </div>
                      </div>
                      <p>{<ShowStatus status={knowledge.status} />}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Show count of filtered results */}
          {vectorStoreData && filteredKnowledge.length > 0 && (
            <p className="text-sm text-gray-400 mt-3">
              Showing {filteredKnowledge.length} of{" "}
              {vectorStoreData.knowledge.length} items
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
