"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Paperclip,
  LoaderCircle,
  Check,
  FileInput,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { vectorizeOneFile } from "../../../services/n8n-apis/_core/vectorizeOneFile.api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFilesUploadMetadata } from "../../../context/FilesUploadMetadata";
import { useToast } from "../../../hooks/use-toast";
import axios from "axios";
import { getChatSession } from "../../../namespace/server";
import { getNewSession } from "../../../services/n8n-apis/_core/getNewSession.api";
import { useUser } from "../../../context/UserContext";
import { _useSidebar } from "../../../context/SidebarContext";
import { addToPermenentKnowledgeBase } from "../../../namespace/client";

export default function FileUploadDialog() {
  // global states
  const { pathname } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fileCount,
    setFileCount,
    memorizedFiles,
    setMemorizedFiles,
    isMemorizationLoading,
    setIsMemorizationLoading,
    fileName,
    setFileName,
    files,
    setFiles,
  } = useFilesUploadMetadata();
  const { user } = useUser();
  const { appendToChatHistory } = _useSidebar();
  const { toast } = useToast();

  // component states
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // const [isLoadingQueue, setIsLoadingQueue] = useState([]) // Removed this line
  const [fileQueueError, setFileQueueError] = useState([]);
  const [isNewSessionLoading, setIsNewSessionLoading] = useState(false);

  // New State for Memorization Status
  const [memorizationStatuses, setMemorizationStatuses] = useState({}); // {fileName: "queued" | "memorizing" | "memorized" | "error"}
  const [memorizationQueue, setMemorizationQueue] = useState([]);

  // useRef to track if the memorization process is running
  const isMemorizing = useRef(false);
  const isMemorizingProcessRunning = useRef(false); // New ref to prevent concurrent executions

  useEffect(() => {
    setFileCount(files.length);
  }, [files]);

  useEffect(() => {
    // Initialize memorization queue and statuses when files change
    // Filter out already memorized files
    const newQueue = files
      .map((file) => file.name)
      .filter((fileName) => !memorizedFiles.includes(fileName));

    // Update the queue by appending new files regardless of memorization status
    setMemorizationQueue((prev) => {
      // Get file names already in the queue
      const existingQueueNames = new Set(prev);
      // Add only new files that aren't already in the queue
      const filesToAdd = newQueue.filter(
        (name) => !existingQueueNames.has(name),
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
  }, [files, memorizedFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);

    // Allow files to be added even during memorization
    // Filter for unique files to avoid duplicates
    const uniqueFiles = droppedFiles.filter(
      (newFile) =>
        !files.some(
          (file) => file.name === newFile.name && file.size === newFile.size,
        ),
    );

    setFiles((prev) => [...uniqueFiles, ...prev]);
  };

  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
    setMemorizedFiles(
      memorizedFiles.filter((file) => file !== fileToRemove.name),
    );
    // setIsLoadingQueue(isLoadingQueue.filter((_, index) => files[index] !== fileToRemove)) // Removed this line
    setFileQueueError(
      fileQueueError.filter((error) => files[error.index] !== fileToRemove),
    );

    // Update memorization queue and statuses
    setMemorizationQueue((prev) =>
      prev.filter((name) => name !== fileToRemove.name),
    );
    setMemorizationStatuses((prev) => {
      const { [fileToRemove.name]: removedStatus, ...rest } = prev;
      return rest;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Allow files to be added even during memorization
      const newFiles = Array.from(e.target.files);
      const uniqueFiles = newFiles.filter(
        (newFile) =>
          !files.some(
            (file) => file.name === newFile.name && file.size === newFile.size,
          ),
      );
      setFiles((prev) => [...prev, ...uniqueFiles]);
    }
  };

  async function handleOpenNewSession() {
    setIsNewSessionLoading(true);
    try {
      toast({
        title: "Creating New Session",
        description: "Please wait while we create a new session for you...",
      });
      const res = await getNewSession("New Document Uploaded", user.id);
      if (res.success) {
        appendToChatHistory(res.data);
        // localStorage.setItem('prompt', "New Document Uploaded");
        // localStorage.setItem('isFallbackedUser', 'true');
        localStorage.setItem("filesFallBack", "true");
        navigate(`/chat/${res.data.sessionid}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsNewSessionLoading(false);
    }
  }

  useEffect(() => {
    if (pathname) {
      localStorage.getItem("filesFallBack") &&
        setFiles(files) &&
        setIsOpen(true);
    }
  }, [[pathname]]);

  // Memorization Process
  useEffect(() => {
    if (memorizationQueue.length === 0) {
      isMemorizing.current = false;
      return;
    }

    const memorizeNext = async () => {
      if (isMemorizingProcessRunning.current) {
        return; // Prevent concurrent execution
      }

      isMemorizingProcessRunning.current = true;
      isMemorizing.current = true; // Set the ref to true before starting

      const fileNameToMemorize = memorizationQueue[0];
      setMemorizationStatuses((prev) => ({
        ...prev,
        [fileNameToMemorize]: "memorizing",
      }));

      try {
        if (pathname == "/dashboard") {
          await handleOpenNewSession();
        }
        const file = files.find((file) => file.name === fileNameToMemorize);
        let res;
        if (pathname == addToPermenentKnowledgeBase) {
          res = await vectorizeOneFile(file, id, "global");
        } else {
          res = await vectorizeOneFile(file, id);
        }

        if (res && res.data && !res.data.success) {
          setMemorizationStatuses((prev) => ({
            ...prev,
            [fileNameToMemorize]: "error",
          }));
          setFileQueueError((prev) => [
            ...prev,
            {
              index: files.findIndex((f) => f.name === fileNameToMemorize),
              message: res.data.message || "Error Occured",
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
        } else {
          setMemorizationStatuses((prev) => ({
            ...prev,
            [fileNameToMemorize]: "error",
          }));
          setFileQueueError((prev) => [
            ...prev,
            {
              index: files.findIndex((f) => f.name === fileNameToMemorize),
              message: res.message || "Error Occured",
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
            message: error.message || "Error Occured",
          },
        ]);
      } finally {
        setMemorizationQueue((prev) => prev.slice(1)); // Remove the processed file from the queue
        isMemorizing.current = false; // Reset the ref to false after completing
        isMemorizingProcessRunning.current = false; // Release the lock
      }
    };

    memorizeNext();
  }, [memorizationQueue, id, toast, setMemorizedFiles, pathname, files]);

  // handle context loading states with component loading states
  useEffect(() => {
    setIsMemorizationLoading(memorizationQueue.length > 0);
  }, [memorizationQueue, setIsMemorizationLoading]);

  return (
    <div>
      {pathname == addToPermenentKnowledgeBase ? (
        <div>
          <div
            onClick={() => setIsOpen(true)}
            className="w-fit rounded-md text-white flex flex-col p-4 gap-3 bg-slate-800 hover:bg-slate-600 cursor-pointer items-center justify-center font-semibold  "
          >
            <FileInput className="w-5 h-5" />
            <p>Click To Open Document Upload Section</p>
          </div>
          <hr />
          {isMemorizationLoading && (
            <div className="flex w-fit p-4 text-white rounded-md my-4 border-2 border-slate-700  gap-2">
              <LoaderCircle className="animate-spin" />
              <p>Memorizing Files...</p>
            </div>
          )}
          {memorizedFiles.map((file, index) => (
            <div className="z-10 flex flex-col md:grid grid-cols-1 sm:grid-cols-2 h-fit w-full md:w-3/4 ">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-[#2a3444]/80 backdrop-blur-sm h-fit rounded-lg p-4 m-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 p-3 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-white font-medium truncate  w-full">
                          {file.name.length > 25
                            ? file.name.slice(0, 25) + "..."
                            : file.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          <span className="uppercase">
                            {file.type.replaceAll("application/", "")}
                          </span>{" "}
                          File
                        </p>
                      </div>
                    </div>
                    <div className="flex  md:flex-row flex-col items-center space-x-3">
                      {fileQueueError.some((item) => item.index === index) ? (
                        <div className="bg-red-300 px-4 py-1 rounded-md">
                          {fileQueueError.find((item) => item.index === index)
                            .message || "Error Occured"}
                        </div>
                      ) : memorizationStatuses[file.name] === "memorizing" ? (
                        <div className="flex items-center space-x-2  bg-white text-black px-4 py-1 rounded-md">
                          <LoaderCircle className="animate-spin" />
                          <span>Memorizing...</span>
                        </div>
                      ) : memorizationStatuses[file.name] === "memorized" ? (
                        <div className="bg-green-300 px-4 py-1 rounded-md flex gap-2">
                          <Check />
                          <p>Memorized</p>
                        </div>
                      ) : memorizationStatuses[file.name] === "queued" ? (
                        <div className="flex items-center space-x-2 bg-gray-300 text-black px-4 py-1 rounded-md">
                          <span>Queued</span>
                        </div>
                      ) : memorizationStatuses[file.name] === "error" ? (
                        <div className="bg-red-300 px-4 py-1 rounded-md">
                          Error
                        </div>
                      ) : (
                        <Button
                          // onClick={() => handleMemorize(file, index)} // Removed this line
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-1 text-sm"
                          disabled
                        >
                          <span>Memorize Data</span>
                        </Button>
                      )}

                      {!memorizedFiles.includes(file.name) && ( // Removed this line
                        <Button
                          onClick={() => removeFile(file)}
                          className="bg-red-200 hover:bg-red-300 text-red-700 rounded px-4 py-1 text-sm"
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center rounded-md m-1 p-2 hover:bg-slate-800 cursor-pointer "
        >
          <Paperclip className="w-5 h-5  rounded-md" />
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-10rem)] h-[calc(100vh-10rem)] overflow-scroll p-8 bg-[#1a2332] border-0 ">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-3/4">
              <div className="p-2 flex text-white gap-2 items-center">
                <h3 className="font-semibold text-white text-2xl">Files</h3>
                {/* total */}
                <p className="text-slate-400">
                  {files?.length || 0} Files Selected
                </p>
                <div className="border-l-2 border-slate-200 h-5" />

                {/* memorized */}
                {(memorizedFiles?.length || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <Check className="text-green-300" />
                    <p className="text-slate-400">
                      {memorizedFiles.length} Files Memorized
                    </p>
                  </div>
                )}

                {/* being uploaded */}
                {(memorizationQueue?.length || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="border-l-2 border-slate-200 h-5" />

                    <LoaderCircle className="animate-spin" />
                    <p className="text-slate-400">
                      {memorizationQueue.length} Files Being Uploaded
                    </p>
                  </div>
                )}
                {/* error */}
                {(fileQueueError?.length || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="border-l-2 border-slate-200 h-5" />
                    <X className="text-red-300" />
                    <p className="text-slate-400">
                      {fileQueueError.length} Files Error
                    </p>
                  </div>
                )}
              </div>
              <div className="grid  sm:grid-cols-2 p-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-[#2a3444]/80 backdrop-blur-sm rounded-lg p-4 m-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-200 p-3 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-white font-medium truncate  w-full">
                            {file.name.length > 25
                              ? file.name.slice(0, 25) + "..."
                              : file.name}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            <span className="uppercase">
                              {file.type.replaceAll("application/", "")}
                            </span>{" "}
                            File
                          </p>
                        </div>
                      </div>
                      <div className="flex  md:flex-row flex-col items-center space-x-3">
                        {fileQueueError.some((item) => item.index === index) ? (
                          <div className="bg-red-300 px-4 py-1 rounded-md">
                            {fileQueueError.find((item) => item.index === index)
                              .message || "Error Occured"}
                          </div>
                        ) : memorizationStatuses[file.name] === "memorizing" ? (
                          <div className="flex items-center space-x-2  bg-white text-black px-4 py-1 rounded-md">
                            <LoaderCircle className="animate-spin" />
                            <span>Memorizing...</span>
                          </div>
                        ) : memorizationStatuses[file.name] === "memorized" ? (
                          <div className="bg-green-300 px-4 py-1 rounded-md flex gap-2">
                            <Check />
                            <p>Memorized</p>
                          </div>
                        ) : memorizationStatuses[file.name] === "queued" ? (
                          <div className="flex items-center space-x-2 bg-gray-300 text-black px-4 py-1 rounded-md">
                            <span>Queued</span>
                          </div>
                        ) : memorizationStatuses[file.name] === "error" ? (
                          <div className="bg-red-300 px-4 py-1 rounded-md">
                            Error
                          </div>
                        ) : (
                          <Button
                            // onClick={() => handleMemorize(file, index)} // Removed this line
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-1 text-sm"
                            disabled
                          >
                            <span>Memorize Data</span>
                          </Button>
                        )}

                        {!memorizedFiles.includes(file.name) && ( // Removed this line
                          <Button
                            onClick={() => removeFile(file)}
                            className="bg-red-200 hover:bg-red-300 text-red-700 rounded px-4 py-1 text-sm"
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div
              className={`flex flex-col items-centers justify-center max-h-[800px] rounded-lg border-2 border-dashed w-full md:w-1/4
                ${isDragging ? "border-white bg-[#2a3444]/50" : "border-gray-600"}
                transition-colors duration-200`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-start p-6 text-center">
                {isMemorizing.current && (
                  <LoaderCircle className="w-8 h-8 text-white animate-spin absolute top-2 left-2" />
                )}
                <Upload className="w-16 h-16 text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Upload File Here
                </h3>
                <p className="text-gray-400 text-sm">
                  File Must Be in format of .pdf, .txt, .json
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.txt,.json,.docx,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="file-upload"
                  className={`mt-4 cursor-pointer bg-[#2a3444] text-white px-6 py-2 rounded-md hover:bg-[#3a4454] transition-colors`}
                >
                  Select Files
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
