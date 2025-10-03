import React, { useState, useEffect, useMemo } from "react";
import { Search, Clock, Eye, Download, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const PromptLibrary = ({ isOpen, onClose, onImportPrompt }) => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      setPrompts(data || []);
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
    setDetailsOpen(true);
  };

  const handleImport = (prompt) => {
    if (onImportPrompt) {
      onImportPrompt(prompt);
    }
    onClose();
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

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDetails(prompt)}
          className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
        >
          <Eye className="w-3 h-3 mr-1" />
          Details
        </Button>
        <Button
          size="sm"
          onClick={() => handleImport(prompt)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-3 h-3 mr-1" />
          Import
        </Button>
      </div>
    </div>
  );

  const DetailsModal = () => {
    if (!selectedPrompt) return null;

    if (isMobile) {
      return (
        <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DrawerContent className="bg-g1 border-t border-slate-700">
            <div className="p-6 text-white">
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
        ) : (
          <div className="grid gap-4 max-h-96 overflow-y-auto">
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
          <DrawerContent className="bg-g1 border-t border-slate-700 max-h-[90vh]">
            {mainContent}
          </DrawerContent>
        </Drawer>
        <DetailsModal />
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
      <DetailsModal />
    </>
  );
};

export default PromptLibrary;
