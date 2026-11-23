import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div aria-hidden className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />
  );
}
