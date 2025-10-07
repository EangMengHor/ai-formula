import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Clock,
  Eye,
  Download,
  Loader2,
  Trash2,
  Edit3,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPrompt } from "@/services/n8n-apis/promptBuilder/getPrompt";
import { deletePrompt } from "@/services/n8n-apis/promptBuilder/deletePrompt";
import { renamePrompt } from "@/services/n8n-apis/promptBuilder/renamePrompt";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const DetailsModal = ({
  selectedPrompt,
  detailsOpen,
  setDetailsOpen,
  handleImport,
  formatRelativeTime,
  isMobile,
}) => {
  if (!selectedPrompt) return null;

  if (isMobile) {
    return (
      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DrawerContent className="bg-g1 border-t border-slate-700">
          <div className="p-6 text-white touch-manipulation cursor-pointer">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {selectedPrompt.promptName || "Untitled Prompt"}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Clock className="w-4 h-4" />
              <span>
                Created {formatRelativeTime(selectedPrompt.created_at)}
              </span>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-slate-200 whitespace-pre-wrap text-sm font-mono">
                {selectedPrompt.output || "No content available"}
              </pre>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleImport(selectedPrompt)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Import Prompt
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="bg-g1 border border-slate-700 max-w-2xl max-h-[80vh] overflow-hidden text-white">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {selectedPrompt.promptName || "Untitled Prompt"}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Clock className="w-4 h-4" />
          <span>Created {formatRelativeTime(selectedPrompt.created_at)}</span>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="text-slate-200 whitespace-pre-wrap text-sm font-mono">
            {selectedPrompt.output || "No content available"}
          </pre>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleImport(selectedPrompt)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Import Prompt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RenameModal = ({
  selectedPrompt,
  newName,
  setNewName,
  renameOpen,
  setRenameOpen,
  confirmRename,
  actionLoading,
  isMobile,
}) => {
  if (!selectedPrompt) return null;

  if (isMobile) {
    return (
      <Drawer open={renameOpen} onOpenChange={setRenameOpen}>
        <DrawerContent className="bg-g1 border-t border-slate-700">
          <div className="p-6 text-white">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Rename Prompt</h2>
              <p className="text-slate-400 text-sm">
                Current name: {selectedPrompt.promptName || "Untitled Prompt"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new prompt name"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRenameOpen(false);
                  setSelectedPrompt(null);
                  setNewName("");
                }}
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRename}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={actionLoading || !newName.trim()}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Rename
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
      <DialogContent className="bg-g1 border border-slate-700 max-w-md text-white">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Rename Prompt</h2>
          <p className="text-slate-400 text-sm">
            Current name: {selectedPrompt.promptName || "Untitled Prompt"}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">New Name</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new prompt name"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setRenameOpen(false)}
            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRename}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={actionLoading || !newName.trim()}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Rename
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteModal = ({
  selectedPrompt,
  deleteOpen,
  setDeleteOpen,
  confirmDelete,
  actionLoading,
  isMobile,
}) => {
  if (!selectedPrompt) return null;

  if (isMobile) {
    return (
      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent className="bg-g1 border-t border-slate-700">
          <div className="p-6 text-white">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Delete Prompt</h2>
              <p className="text-slate-400 text-sm">
                Are you sure you want to delete "
                {selectedPrompt.promptName || "Untitled Prompt"}"?
              </p>
              <p className="text-red-400 text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteOpen(false);
                  setSelectedPrompt(null);
                }}
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Delete
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="bg-g1 border border-slate-700 max-w-md text-white">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Delete Prompt</h2>
          <p className="text-slate-400 text-sm">
            Are you sure you want to delete "
            {selectedPrompt.promptName || "Untitled Prompt"}"?
          </p>
          <p className="text-red-400 text-sm mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PromptLibrary = ({ isOpen, onClose, onImportPrompt }) => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentView, setCurrentView] = useState("list");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch prompts on component mount
  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const data = await getPrompt();
      setPrompts((data || []).reverse());
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast({
        title: "Error",
        description: "Failed to load prompts. Please try again.",
        variant: "destructive",
      });
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months !== 1 ? "s" : ""} ago`;
    }
  };

  // Filter prompts based on search query
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;

    const query = searchQuery.toLowerCase();
    return prompts.filter((prompt) => {
      const nameMatch = prompt.promptName?.toLowerCase().includes(query);
      const contentMatch = prompt.output?.toLowerCase().includes(query);
      const timeMatch = formatRelativeTime(prompt.created_at)
        .toLowerCase()
        .includes(query);

      return nameMatch || contentMatch || timeMatch;
    });
  }, [prompts, searchQuery]);

  // Get preview text (first 150 characters)
  const getPreviewText = (text) => {
    if (!text) return "No content available";
    return text.length > 150 ? `${text.substring(0, 150)}...` : text;
  };

  const handleDetails = (prompt) => {
    setSelectedPrompt(prompt);
    if (isMobile) {
      setCurrentView("details");
    } else {
      setDetailsOpen(true);
    }
  };

  const handleImport = (prompt) => {
    if (onImportPrompt) {
      onImportPrompt(prompt);
    }
    onClose();
  };

  const handleRename = (prompt) => {
    setSelectedPrompt(prompt);
    setNewName(prompt.promptName || "");
    if (isMobile) {
      setCurrentView("rename");
    } else {
      setRenameOpen(true);
    }
  };

  const handleDelete = (prompt) => {
    setSelectedPrompt(prompt);
    if (isMobile) {
      setCurrentView("delete");
    } else {
      setDeleteOpen(true);
    }
  };

  const confirmRename = async () => {
    if (!selectedPrompt || !newName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid name.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await renamePrompt(selectedPrompt.id, userId, newName.trim());

      // Update the prompt in the local state
      setPrompts((prevPrompts) =>
        prevPrompts.map((prompt) =>
          prompt.id === selectedPrompt.id
            ? { ...prompt, promptName: newName.trim() }
            : prompt,
        ),
      );

      toast({
        title: "Success",
        description: "Prompt renamed successfully.",
      });

      setRenameOpen(false);
      setSelectedPrompt(null);
      setNewName("");
      if (isMobile) {
        setCurrentView("list");
      }
    } catch (error) {
      console.error("Error renaming prompt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to rename prompt.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPrompt) return;

    setActionLoading(true);
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await deletePrompt(selectedPrompt.id, userId);

      // Remove the prompt from the local state
      setPrompts((prevPrompts) =>
        prevPrompts.filter((prompt) => prompt.id !== selectedPrompt.id),
      );

      toast({
        title: "Success",
        description: "Prompt deleted successfully.",
      });

      setDeleteOpen(false);
      setSelectedPrompt(null);
      if (isMobile) {
        setCurrentView("list");
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete prompt.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const PromptCard = ({ prompt }) => (
    <div className="bg-g2 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm truncate mb-1">
            {prompt.promptName || "Untitled Prompt"}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(prompt.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-slate-300 text-sm mb-4 line-clamp-3">
        {getPreviewText(prompt.output)}
      </p>

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          onClick={() => handleImport(prompt)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-3 h-3 mr-1" />
          Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDetails(prompt)}
          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
        >
          <Eye className="w-3 h-3 mr-1" />
          Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRename(prompt)}
          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Rename
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDelete(prompt)}
          className="bg-red-600 border-red-600 text-white hover:bg-red-700"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );

  const mainContent = (
    <div className="bg-g1 text-white">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Prompt Library</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search prompts by name, content, or time..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Loading prompts...</span>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">
              {searchQuery
                ? "No prompts found matching your search."
                : "No prompts saved yet."}
            </div>
            <div className="text-sm text-slate-500">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Create and save prompts to see them here."}
            </div>
          </div>
        ) : isMobile && currentView !== "list" ? (
          currentView === "rename" ? (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Rename Prompt</h2>
                <p className="text-slate-400 text-sm">
                  Current name:{" "}
                  {selectedPrompt?.promptName || "Untitled Prompt"}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  New Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new prompt name"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentView("list");
                    setSelectedPrompt(null);
                    setNewName("");
                  }}
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRename}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={actionLoading || !newName.trim()}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Rename
                </Button>
              </div>
            </div>
          ) : currentView === "delete" ? (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Delete Prompt</h2>
                <p className="text-slate-400 text-sm">
                  Are you sure you want to delete "
                  {selectedPrompt?.promptName || "Untitled Prompt"}"?
                </p>
                <p className="text-red-400 text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentView("list");
                    setSelectedPrompt(null);
                  }}
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Delete
                </Button>
              </div>
            </div>
          ) : currentView === "details" ? (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("list")}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedPrompt?.promptName || "Untitled Prompt"}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Clock className="w-4 h-4" />
                <span>
                  Created{" "}
                  {selectedPrompt
                    ? formatRelativeTime(selectedPrompt.created_at)
                    : ""}
                </span>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-slate-200 whitespace-pre-wrap text-sm font-mono">
                  {selectedPrompt?.output || "No content available"}
                </pre>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    handleImport(selectedPrompt);
                    setCurrentView("list");
                    setSelectedPrompt(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import Prompt
                </Button>
              </div>
            </div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:max-h-96 lg:overflow-y-auto">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="bg-g1 border-t border-slate-700 max-h-[90vh] overflow-hidden">
            <div className="h-full overflow-y-auto">{mainContent}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-g1 border border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {mainContent}
        </DialogContent>
      </Dialog>
      <DetailsModal
        selectedPrompt={selectedPrompt}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        handleImport={handleImport}
        formatRelativeTime={formatRelativeTime}
        isMobile={isMobile}
      />
      <RenameModal
        selectedPrompt={selectedPrompt}
        newName={newName}
        setNewName={setNewName}
        renameOpen={renameOpen}
        setRenameOpen={setRenameOpen}
        confirmRename={confirmRename}
        actionLoading={actionLoading}
        isMobile={isMobile}
        setSelectedPrompt={setSelectedPrompt}
      />
      <DeleteModal
        selectedPrompt={selectedPrompt}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        confirmDelete={confirmDelete}
        actionLoading={actionLoading}
        isMobile={isMobile}
        setSelectedPrompt={setSelectedPrompt}
      />
    </>
  );
};

export default PromptLibrary;
