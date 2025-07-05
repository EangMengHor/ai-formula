export default function OsintNewInstance({
  workflowId,
  name,
  handleBlockSidebar,
}) {
  return (
    <div
      onClick={() => handleBlockSidebar(workflowId, name)}
      className={` bg-g1 cursor-pointer hover:bg-g2 flex justify-between items-center gap-2 relative rounded-2xl p-1 `}
    >
      <div
        className="text-md font-medium text-white truncate px-3 flex items-start justify-between flex-col"
        style={{ maxWidth: "80%" }}
      >
        {name.replaceAll("_", " ") || "Document"}
        <p className="text-slate-600 text-sm">OSINT Search Job (Click)</p>
      </div>
      <div className="flex-shrink-0 px-3 py-2">
        <img
          src="/people (1).png"
          className="opacity-70 w-16 h-1w-16 -rotate-6"
        />
      </div>
    </div>
  );
}
