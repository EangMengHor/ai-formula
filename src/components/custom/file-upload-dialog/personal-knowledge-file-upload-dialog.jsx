import { useState, useRef } from "react";
import { Card } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { X, Upload, FileIcon, CheckCircle, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { generatePresignedUrl } from "@/services/user-setting-apis/generatePresignedUrl";
import { uploadToSignedUrl } from "@/services/user-setting-apis/uploadToSignedUrl";

export function PersonalKnowledgeFileUpload({
  bucketName,
  userId,
  onUploadComplete,
  collectionId = null,
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

    // Create file objects with status
    const newFiles = droppedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: formatFileSize(file.size),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => {
      const updatedFiles = [...prev, ...newFiles];
      // Trigger upload for new files
      uploadFiles(newFiles);
      return updatedFiles;
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Create file objects with status
    const newFiles = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: formatFileSize(file.size),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => {
      const updatedFiles = [...prev, ...newFiles];
      // Trigger upload for new files
      uploadFiles(newFiles);
      return updatedFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const uploadFiles = async (filesToUpload = files) => {
    if (uploading) return;
    setUploading(true);
    const uploadedFiles = [];

    // Upload each file
    for (let i = 0; i < filesToUpload.length; i++) {
      const fileObj = filesToUpload[i];

      if (fileObj.status === "success") continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "uploading", progress: 10 } : f,
        ),
      );

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id && f.status === "uploading" && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f,
            ),
          );
        }, 500);

        const presignedUrlResult = await generatePresignedUrl({
          userId,
          fileName: fileObj.file.name,
          bucketName,
        });

        if (!presignedUrlResult.success) {
          throw new Error(presignedUrlResult.message);
        }
        const uploadResult = await uploadToSignedUrl({
          file: fileObj.file,
          signedUrl: presignedUrlResult.data.signedUrl,
          token: presignedUrlResult.data.token,
          contentType: fileObj.file.type,
          userId,
          filePath: presignedUrlResult.data.fileName,
          bucketName,
          collectionId: collectionId,
        });

        clearInterval(progressInterval);

        if (uploadResult.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id
                ? {
                    ...f,
                    status: "success",
                    progress: 100,
                    url: uploadResult.data.url,
                  }
                : f,
            ),
          );
          uploadedFiles.push(uploadResult.data);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f,
            ),
          );
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f,
          ),
        );
      }
    }

    setUploading(false);

    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
      // Clear the files list after successful upload
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div
        className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors bg-[#1a2332] flex flex-col items-center justify-center min-h-[200px]
					${isDragging ? "border-white bg-[#2a3444]/50" : "border-gray-600 hover:bg-[#2a3444]/50"}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-16 h-16 mx-auto text-white mb-4" />
        <p className="text-lg text-white font-medium">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-white/70 mt-2">
          Supported formats: PDF, DOCX, TXT, etc.
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          accept=".pdf,.txt,.json,.docx"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-white">
              {files.length} file(s) selected
            </p>
          </div>

          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <Card
                key={file.id}
                className="p-4 flex items-center bg-[#2a3444]/80 backdrop-blur-sm"
              >
                <div className="mr-3">
                  <FileIcon className="w-8 h-8 text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium truncate max-w-xs text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-white">{file.size}</p>
                  </div>

                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="h-2 mt-2" />
                  )}

                  {file.status === "error" && (
                    <p className="text-xs text-destructive mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> Upload failed
                    </p>
                  )}
                </div>

                <div className="ml-3 flex items-center">
                  {file.status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-muted-foreground hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

PersonalKnowledgeFileUpload.propTypes = {
  bucketName: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onUploadComplete: PropTypes.func,
};
