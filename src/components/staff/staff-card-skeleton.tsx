import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StaffCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar Skeleton */}
            <Skeleton className="w-16 h-16 rounded-2xl" />
            
            <div className="flex-1 space-y-2">
              {/* Name Skeleton */}
              <Skeleton className="h-5 w-32" />
              {/* Role Badge Skeleton */}
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          {/* Menu Button Skeleton */}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Employee ID Skeleton */}
        <div className="mt-3">
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Email Skeleton */}
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Phone Skeleton */}
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Department & Branch Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-3 rounded-lg border">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </CardFooter>
    </Card>
  );
}

