"use client";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/context/CollectionContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Calendar, CheckCircle2, Circle } from "lucide-react";

export default function InternalKnowledgeDialog({
  isDialogOpen = false,
  setIsDialogOpen = () => {},
}) {
  const { collectionList, selectedCollectionIds, toggleCollectionSelection } =
    useCollection();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getSelectionStatus = () => {
    const selected = selectedCollectionIds.length;
    const total = Math.min(collectionList.length, 5);
    return { selected, total };
  };

  const { selected, total } = getSelectionStatus();

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
      }}
    >
      <DialogContent className="w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl max-h-[85vh] sm:max-h-[80vh] p-0 bg-slate-800 border-slate-700">
        <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh]">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <span className="hidden sm:inline">Select Collections</span>
              <span className="sm:hidden">Collections</span>
              <Badge
                variant="outline"
                className="border-blue-500/30 text-blue-400 text-xs"
              >
                Up to 5
              </Badge>
            </DialogTitle>
            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
              <span className="hidden sm:inline">
                Choose up to 5 collections to include in your knowledge base.
              </span>
              <span className="sm:hidden">Select up to 5 collections.</span>{" "}
              Selected:{" "}
              <span className="text-blue-400 font-medium">{selected}/5</span>
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="max-h-[50vh] sm:max-h-[55vh] overflow-auto">
              <div className="p-3 sm:p-4 lg:p-6">
                {collectionList.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {collectionList.map((collection, index) => {
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
                            group relative p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer
                            ${
                              isSelected
                                ? "bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                : isDisabled
                                  ? "bg-slate-800/30 border-slate-700/30 cursor-not-allowed opacity-50"
                                  : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/50"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative flex-shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="absolute -top-4 -right-8 w-8 h-8 text-blue-400" />
                              ) : (
                                <CheckCircle2 className="absolute -top-4 -right-8 w-8 h-8  text-gray-50/40" />
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
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  Created {formatDate(collection.created_at)}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`
                              w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                              ${isSelected ? "bg-blue-500/20 text-blue-300" : "bg-slate-700/50 text-slate-400"}
                            `}
                            >
                              {index + 1}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          <div
                            className={`
                            absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-200
                            ${isSelected ? "bg-blue-500" : "bg-transparent"}
                          `}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                    <div className="p-3 sm:p-4 bg-slate-800/50 rounded-full mb-4">
                      <Database className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300 mb-2">
                      No Collections Found
                    </h3>
                    <p className="text-sm sm:text-base text-slate-400 max-w-md px-4">
                      You haven't created any collections yet. Create your first
                      collection to get started with internal knowledge.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer with selection summary */}
          {collectionList.length > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden sm:inline">
                    {collectionList.length} total collections available
                  </span>
                  <span className="sm:hidden">
                    {collectionList.length} available
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs sm:text-sm text-slate-400">
                    {selected > 0 && (
                      <span className="text-blue-400 font-medium">
                        {selected} selected
                      </span>
                    )}
                    {selected === 5 && (
                      <span className="text-amber-400 ml-2">
                        • Limit reached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
