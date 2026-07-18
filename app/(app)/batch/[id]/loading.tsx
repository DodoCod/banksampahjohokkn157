import { FormSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <FormSkeleton />
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
