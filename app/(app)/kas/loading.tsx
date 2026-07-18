import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mb-6 max-w-xs">
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
