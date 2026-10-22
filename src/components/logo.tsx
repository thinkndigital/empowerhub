import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="EmpowerHub"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
