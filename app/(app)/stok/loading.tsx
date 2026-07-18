import { CardsSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <CardsSkeleton count={4} />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
