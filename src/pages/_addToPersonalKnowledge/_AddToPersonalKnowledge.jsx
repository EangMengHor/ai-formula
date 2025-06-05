import { useState, useEffect } from "react";
import { PersonalKnowledgeFileUpload } from "../../components/custom/file-upload-dialog/personal-knowledge-file-upload-dialog";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getPersonalKnowledgeFiles } from "@/services/user-setting-apis/getPersonalKnowledgeFiles";

const BUCKET_NAME = "arx-society-file-queue";
const POLLING_INTERVAL = 10000; // 10 seconds

export default function AddToPersonalKnowledge() {
  const { user } = useUser();
  const location = useLocation();
  const isFirstTime = location.state?.isFirstTime;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const userFiles = await getPersonalKnowledgeFiles(user.id);
      if (userFiles) {
        setFiles(userFiles.data);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to fetch files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();

    // Set up polling
    const pollInterval = setInterval(fetchFiles, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [user.id]);

  const handleUploadComplete = () => {
    toast.success("Files uploaded successfully");
    fetchFiles(); // Refresh the files list
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "processing":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getFileName = (filePath) => {
    const parts = filePath.split("/");
    return parts[parts.length - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white flex items-center justify-center flex-col">
          <Loader2 className="animate-spin" size={24} />
          <p>Loading Your Internal Knowledge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="font-bold text-2xl text-white mb-2">
          {isFirstTime
            ? "Welcome! Upload Your Internal Knowledge"
            : "Add Documents to Your Knowledge Base"}
        </h1>
        <p className="text-slate-300 max-w-2xl">
          Please upload your internal knowledge documents here.{" "}
          <span className="font-semibold text-white">Arx</span> and its agents
          will securely process and learn from your files, empowering you with
          smarter, more personalized assistance.
        </p>
      </div>

      {files && files.length === 0 ? (
        // Large upload area when no files
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-4xl h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg bg-[#181e29] p-8">
            <PersonalKnowledgeFileUpload
              bucketName={BUCKET_NAME}
              userId={user.id}
              onUploadComplete={handleUploadComplete}
            />
            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Start by uploading your first document.
                <br />
                <span className="text-white font-medium">Arx</span> will handle
                the rest!
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Normal layout with files
        <>
          <div className="mb-8 h-fit">
            <PersonalKnowledgeFileUpload
              bucketName={BUCKET_NAME}
              userId={user.id}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          <div className="rounded-md">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Uploaded Documents
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-[#1f2937]">
                  <TableHead className="text-white">File Name</TableHead>
                  <TableHead className="text-white">Created At</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-[#1f2937]">
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-white"
                    >
                      Loading files...
                    </TableCell>
                  </TableRow>
                ) : (
                  files &&
                  files.map((file) => (
                    <TableRow
                      key={file.id}
                      className="border-slate-700 hover:bg-[#1f2937]"
                    >
                      <TableCell className="font-medium text-white">
                        {getFileName(file.filepath)}
                      </TableCell>

                      <TableCell className="text-slate-300">
                        {format(new Date(file.createdat), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${getStatusColor(file.status)} font-medium`}
                        >
                          {file.status.charAt(0).toUpperCase() +
                            file.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="mt-4 text-slate-400 text-sm">
              <span className="font-semibold text-white">Arx</span> and its
              agents will automatically process your documents and make them
              available for smarter, context-aware assistance.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
