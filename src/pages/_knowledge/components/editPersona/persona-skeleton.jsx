import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function PersonaSkeleton() {
  return (
    <Card className="w-full max-w-2xl  p-6 rounded-2xl bg-slate-900 border-slate-600">
      <div className="space-y-6">
        {/* Icon skeleton with glow effect */}
        <div className="relative w-12 h-12">
          <Skeleton className="absolute inset-0 rounded-full bg-[#2D6BEF]/20" />
          <Skeleton className="absolute inset-1 rounded-full bg-[#2D6BEF]/10" />
        </div>

        {/* Title skeleton */}
        <Skeleton className="h-7 w-48 bg-slate-500" />

        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-slate-500" />
          <Skeleton className="h-4 w-11/12 bg-slate-500" />
        </div>

        {/* Read More skeleton */}
        <Skeleton className="h-4 w-24 bg-[#2D6BEF]/20" />

        {/* Divider */}
        <div className="border-t border-[#1E2028] pt-4" />

        {/* Collapsible sections skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#1E2028] last:border-0">
              <Skeleton className="h-5 w-40 bg=slate-700" />
              <Skeleton className="h-4 w-4 bg=slate-700" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

