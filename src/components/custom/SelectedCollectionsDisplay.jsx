import React from "react";
import { useCollection } from "@/context/CollectionContext";
import { Grid2x2, LibraryBig, X } from "lucide-react";
import { Button } from "../ui/button";

function SelectedCollectionsDisplay() {
  const { toggleCollectionSelection, getSelectedCollections } = useCollection();
  const selectedCollections = getSelectedCollections();

  if (selectedCollections.length === 0) {
    return null; // Don't render anything if no collections are selected
  }

  return (
    <div className="flex flex-wrap gap-2 mb-2 max-h-40 overflow-y-auto hide-scrollbar">
      {selectedCollections.map((collection) => (
        <div
          key={collection.id}
          className="flex items-center gap-2 rounded-md justify-between p-2 w-fit bg-slate-800"
        >
          <Grid2x2 className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <span className="text-white text-xs">
              {collection.collectionName}
              <p className="text-slate-400">Knowledge Block</p>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 rounded-full hover:bg-slate-700 text-white"
            onClick={() => toggleCollectionSelection(collection.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default SelectedCollectionsDisplay;
