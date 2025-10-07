"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Leader */}
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Branch & Members */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded-lg mb-2" />
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-3 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded-lg mb-2" />
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Members Preview */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </CardFooter>
    </Card>
  );
}

