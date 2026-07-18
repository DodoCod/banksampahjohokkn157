import { FormSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <FormSkeleton />
      <TableSkeleton rows={4} cols={4} />
    </div>
  );
}
