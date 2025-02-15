export default function PersonaSkeleton() {
    return (
      <div className="bg-slate-700 rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="flex gap-4 items-center p-6">
          <div className="w-12 h-12 bg-slate-600 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-600 rounded w-3/4"></div>
            <div className="h-4 bg-slate-600 rounded"></div>
            <div className="h-4 bg-slate-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }
  
  