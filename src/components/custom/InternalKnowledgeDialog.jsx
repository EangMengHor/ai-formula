"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/context/CollectionContext";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Search, X, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function InternalKnowledgeDialog({
  isDialogOpen = false,
  setIsDialogOpen = () => {},
}) {
  const { collectionList, selectedCollectionIds, toggleCollectionSelection } =
    useCollection();

  const [searchValue, setSearchValue] = useState("");

  const filteredCollections = collectionList.filter((collection) =>
    collection.collectionName.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  const getSelectionStatus = () => {
    const selected = selectedCollectionIds.length;
    const total = Math.min(collectionList.length, 5);
    return { selected, total };
  };

  const { selected } = getSelectionStatus();

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
      }}
    >
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 gap-0 [&>button]:hidden">
        <div className="bg-blue-950 flex gap-2  items-center p-6 text-white -mb-4 rounded-t-2xl ">
          <Database />
          <p className="font-semibold text-lg">Select Knowledge Block</p>
        </div>
        <div className=" gap-0 rounded-2xl p-0 bg-gradient-to-r from-g2 to-g1 border-0 text-white">
          <div className="flex border-b-2 border-b-slate-800 p-2 items-center">
            <Input
              type="text"
              value={searchValue}
              onChange={handleChange}
              placeholder="Type to search..."
              className="w-[95%] p-2 rounded-md border-0 text-white focus-visible:ring-transparent"
            />
            <div
              onClick={() => {
                setIsDialogOpen(false);
              }}
              className="rounded-lg cursor-pointer hover:bg-g2 p-2"
            >
              <X className="w-6 h-6" />
            </div>
          </div>
          <div className=" mb-4 overflow-y-scroll hide-scrollbar h-[calc(100vh-500px)]">
            {filteredCollections.length > 0 ? (
              <ScrollArea className="h-full overflow-auto">
                <div className="p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredCollections.map((collection, index) => {
                      const isSelected = selectedCollectionIds.includes(
                        collection.id,
                      );
                      const isDisabled =
                        !isSelected && selectedCollectionIds.length >= 5;

                      return (
                        <div
                          key={collection.id}
                          onClick={() =>
                            !isDisabled &&
                            toggleCollectionSelection(collection.id)
                          }
                          className={`
                          group relative p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer
                          ${
                            isSelected
                              ? "bg-blue-950 shadow-lg shadow-blue-500/5"
                              : isDisabled
                                ? " bg-white/5 backdrop-blur-md hover:bg-white/10  cursor-not-allowed opacity-50"
                                : "bg-white/5 backdrop-blur-md hover:bg-white/10   "
                          }
                        `}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative flex-shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="absolute -top-4 -right-8 w-8 h-8 text-blue-400" />
                              ) : (
                                <CheckCircle2 className="absolute -top-4 -right-8 w-8 h-8 text-gray-50/40" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 pl-8">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                                <h3
                                  className={`font-semibold truncate text-sm sm:text-base ${
                                    isSelected
                                      ? "text-blue-100"
                                      : "text-slate-200"
                                  }`}
                                >
                                  {collection.collectionName}
                                </h3>
                                {isSelected && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs flex-shrink-0">
                                    Selected
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                                <span className="truncate">
                                  Created{" "}
                                  {formatDistanceToNow(
                                    new Date(collection.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Database className="h-12 w-12 text-gray-400" />
                <p className="text-gray-400">No collections found.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
