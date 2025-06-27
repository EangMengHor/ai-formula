import { PersonalKnowledgeFileUpload } from "@/components/custom/file-upload-dialog/personal-knowledge-file-upload-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { createNewVectorStore } from "@/services/personal-knowledge/createNewVectorStore";
import { getPersonalKnowledgeFiles } from "@/services/user-setting-apis/getPersonalKnowledgeFiles";
import { getUserPersonalKnowledgeCollection } from "@/services/user-setting-apis/getUserPersonalKnowledgeCollection";
import { Database, DatabaseZap, RefreshCcw } from "lucide-react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { use } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BUCKET_NAME = "arx-society-file-queue";

export default function AddToPersonalKnowledge() {
  const [newVectorStoreName, setNewVectorStoreName] = useState("");
  const [createNewVectorStoreLoading, setCreateNewVectorStoreLoading] =
    useState(false);

  // get vector store list
  const [vectorStoreList, setVectorStoreList] = useState([]);
  const [vectorStoreLoading, setVectorStoreLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const { toast } = useToast();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const navigate = useNavigate();
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
    }
  };

  useEffect(() => {
    if (user.id) {
      fetchFiles();
      fetchUserVectorStore();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [user.id]);

  const handleCreateNewVectorStore = async () => {
    setCreateNewVectorStoreLoading(true);
    if (newVectorStoreName.length <= 0) {
      toast({
        title: "Vector Store Name Required",
        description: "Please enter a name for the vector store.",
        variant: "destructive",
      });
      setCreateNewVectorStoreLoading(false);
      return;
    }
    try {
      await createNewVectorStore({
        userId: user.id,
        vectorStoreName: newVectorStoreName,
      });
      // Refresh list after creation
      fetchUserVectorStore();
      toast({
        title: "Success",
        description: "New vector store created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating new vector store:", error);
      toast({
        title: "Error",
        description: "Failed to create new vector store.",
        variant: "destructive",
      });
    } finally {
      setCreateNewVectorStoreLoading(false);
      setNewVectorStoreName("");
    }
  };

  async function fetchUserVectorStore() {
    setVectorStoreLoading(true);
    try {
      const data = await getUserPersonalKnowledgeCollection(user.id);
      setVectorStoreList(data || []);
    } catch (error) {
      setVectorStoreList([]);
    } finally {
      setVectorStoreLoading(false);
    }
  }

  // Filtered vector store list based on search
  const filteredVectorStoreList = vectorStoreList.filter((store) =>
    store.collectionName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Show files for selected collection
  const handleShowFiles = (collectionId) => {
    setActiveCollectionId(collectionId);
    setShowFilesModal(true);
  };

  // Hide files modal
  const handleCloseFilesModal = () => {
    setShowFilesModal(false);
    setActiveCollectionId(null);
  };

  // Get files for the selected collection
  const filesForActiveCollection = files.filter(
    (file) => file.collectionId === activeCollectionId,
  );

  // SVG geometric background for card
  function CardBgSVG() {
    return (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="absolute right-4 top-4 opacity-20 pointer-events-none"
      >
        <rect x="0" y="0" width="80" height="80" fill="none" />
        <g stroke="#6b7280" strokeWidth="1">
          <rect x="0" y="0" width="40" height="40" />
          <rect x="40" y="0" width="40" height="40" />
          <rect x="0" y="40" width="40" height="40" />
          <rect x="40" y="40" width="40" height="40" />
          <line x1="0" y1="0" x2="80" y2="80" />
          <line x1="80" y1="0" x2="0" y2="80" />
        </g>
      </svg>
    );
  }

  // Card component for vector store
  function VectorStoreCard({ store }) {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        className="relative flex flex-col justify-between bg-[#23283a] border border-[#353b50] rounded-xl shadow-md min-h-[140px] w-full max-w-[400px] p-5 transition-colors"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ minWidth: 320 }}
        onClick={() => navigate(`/vector-store/${store.id}`)}
      >
        {/* SVG background */}
        <CardBgSVG />
        <div className="flex items-center gap-3 z-10">
          <Database className="w-7 h-7 text-white" />
          <div>
            <div className="font-semibold text-base text-white">
              {store.collectionName}
            </div>
            <div className="text-xs text-slate-300">
              {/* Show count of files for this collection */}
              {
                files.filter((file) => file.collectionId === store.id).length
              }{" "}
              Document
            </div>
          </div>
        </div>
        {/* Buttons on hover */}
        <div className="flex gap-3 mt-6 z-10">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-md bg-[#353b50] text-white text-lg transition-colors border border-[#353b50] hover:bg-[#49506a]`}
            style={{ boxShadow: "none" }}
            tabIndex={-1}
            onClick={() => handleShowFiles(store.id)}
          >
            <Plus size={20} />
          </button>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-md bg-[#353b50] text-white text-lg transition-colors border border-[#353b50] hover:bg-[#49506a]`}
            style={{ boxShadow: "none" }}
            tabIndex={-1}
          >
            <Pencil size={20} />
          </button>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-md bg-[#a33a3a] text-white text-lg transition-colors border border-[#a33a3a] hover:bg-[#c0392b]`}
            style={{ boxShadow: "none" }}
            tabIndex={-1}
          >
            <Trash2 size={20} />
          </button>
        </div>
        {/* Only show buttons on hover */}
        <div
          className={`absolute inset-0 bg-transparent transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      </div>
    );
  }

  // Loading skeleton
  function VectorStoreSkeleton() {
    return (
      <div className="relative flex flex-col justify-between bg-[#23283a] border border-[#353b50] rounded-xl shadow-md min-h-[140px] w-full max-w-[400px] p-5">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-slate-700 rounded" />
          <div>
            <div className="h-4 bg-slate-700 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-16" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <div className="w-10 h-10 bg-slate-700 rounded-md" />
          <div className="w-10 h-10 bg-slate-700 rounded-md" />
          <div className="w-10 h-10 bg-slate-700 rounded-md" />
        </div>
      </div>
    );
  }

  // Modal for showing files in a collection using Dialog
  function FilesModal() {
    return (
      <Dialog open={showFilesModal} onOpenChange={handleCloseFilesModal}>
        <DialogContent className="max-w-[calc(100%-10rem)] bg-[#23283a] max-h-[calc(100%-20rem)] overflow-y-scroll border border-[#353b50] rounded-xl shadow-lg p-6">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-white">
                  Files in this Vector Store
                </span>
              </div>
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div>
            <PersonalKnowledgeFileUpload
              bucketName={BUCKET_NAME}
              userId={user.id}
              onUploadComplete={() => {}}
              collectionId={activeCollectionId}
            />
          </div>
          {filesForActiveCollection.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              No files found for this vector store.
            </div>
          ) : (
            <ul className="divide-y divide-[#353b50]">
              {filesForActiveCollection.map((file) => (
                <li key={file.id} className="py-3 flex flex-col gap-1">
                  <span className="text-white font-medium truncate">
                    {file.filepath.split("/").pop().length > 60
                      ? file.filepath.split("/").pop().slice(0, 30) +
                        "..." +
                        file.filepath.split("/").pop().slice(-30)
                      : file.filepath.split("/").pop()}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      Status:{" "}
                      <span
                        className={
                          file.status === "completed"
                            ? "text-green-400"
                            : file.status === "processing"
                              ? "text-yellow-400"
                              : file.status === "queued"
                                ? "text-blue-400"
                                : "text-red-400"
                        }
                      >
                        {file.status}
                      </span>
                    </span>
                    <span>
                      Uploaded: {new Date(file.createdat).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="w-full min-h-screen  font-sans">
      <div className="max-w-6xl mx-auto">
        <Dialog>
          <DialogTrigger className="w-full h-fit">
            <div className="w-full h-32 bg-[#23283a] border border-[#353b50] hover:bg-[#2c3142] cursor-pointer rounded-xl my-4 flex flex-col items-center justify-center shadow-md transition-all">
              <div className="flex items-center justify-center flex-col gap-2 text-white">
                <DatabaseZap className="w-10 h-10" />
                <p className="font-semibold text-lg tracking-wide">
                  Add New Internal Knowledge Block
                </p>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#23283a] border border-[#353b50]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex gap-2 text-white items-center">
                  <Database />
                  <p>Create New Vector Store</p>
                </div>
              </DialogTitle>
              <DialogDescription></DialogDescription>
              <div className="text-white">
                <p className="text-sm mb-2">
                  Create a new vector store to add your internal knowledge. This
                  will allow you to upload documents and have them processed by
                  Arx for personalized assistance.
                </p>
                <div>
                  <input
                    value={newVectorStoreName}
                    onChange={(e) => setNewVectorStoreName(e.target.value)}
                    type="text"
                    placeholder="Enter Vector Store Name"
                    className="w-full mt-4 p-2 bg-[#23283a] border border-[#353b50] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleCreateNewVectorStore}
                    disabled={createNewVectorStoreLoading}
                    className={`mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                      createNewVectorStoreLoading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {createNewVectorStoreLoading
                      ? "Creating..."
                      : "Create Vector Store"}
                  </button>
                </div>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <hr className="border border-[#353b50] my-8" />
        {/* Search input */}
        <div className="flex justify-end mb-8 relative z-10">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vector store..."
            className="sm:w-80 w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow placeholder:text-slate-400"
          />
        </div>
        <div className="flex justify-between">
          <p className="font-semibold text-lg text-white m-4">
            Your Vector Store
          </p>
          {/* Refresh Button */}
          <div className="flex justify-end items-center mb-4 gap-2">
            <button
              onClick={() => {
                fetchFiles();
                fetchUserVectorStore();
              }}
              className="border flex items-center  gap-2 border-slate-600 px-2 py-1 text-white rounded-md transition-colors"
            >
              <RefreshCcw className="w-4 h-4 " />
              Refresh
            </button>
          </div>
        </div>
        {/* Vector Store Cards */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-3
            gap-8
          "
        >
          {vectorStoreLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <VectorStoreSkeleton key={i} />
              ))
            : filteredVectorStoreList.map((store) => (
                <VectorStoreCard key={store.id} store={store} />
              ))}
        </div>
        {/* Files Modal */}
        {showFilesModal && <FilesModal />}
      </div>
    </div>
  );
}
