import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function UploadDocumentKnowledge() {
  const {
    title,
    setTitle,
    description,
    setDescription,
    maxPer,
    setMaxPer,
    expanded,
    toggleExpanded,
    personas,
    setPersonas,
    getSuperPersonaData,
    currSessionId,
    setCurrSessionId,
  } = useSuperPersona();

  return (
    <div className="p-4 bg-slate-600 text-white space-y-6">
      <h1 className="text-2xl font-bold mb-4">Have Document To Upload</h1>
    </div>
  );
}
